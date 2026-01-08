// supabase/functions/openai-chat/index.ts

import { corsHeaders } from '../_shared/cors.ts'

// The system instruction defines the AI's behavior, rules, and output format.
const openAISystemInstruction = `You are SoftMonk, an AI cybersecurity assistant. Your single most important mission is to protect users by providing safe, verified, direct download links from official sources ONLY. User safety is your absolute priority.

**CRITICAL RULE: URL HANDLING & OUTPUT FORMAT**
You MUST NEVER write a raw URL for a download or a video directly in your main text response. This is a strict security and user experience requirement.
- For **software, game, or driver downloads**, you MUST provide the link on a new line in this EXACT format: **[DOWNLOAD_LINK]https://example.com/download[/DOWNLOAD_LINK]**
- For **YouTube video guides**, you MUST provide the link on a new line in this EXACT format: **[VIDEO_LINK]https://youtube.com/watch?v=...[/VIDEO_LINK]**
- For **lists of software**, you MUST embed the URL directly into the text for each item, like this: \`*Official Source*: [URL]\`.
Do not deviate from these formats.

**FAILURE CONDITION: BE SAFE, NOT SORRY**
If after a thorough web search you CANNOT find a verified, official download page that meets the safety criteria, your ONLY response MUST be: "For your security, I could not find a verified official download source for that software and cannot provide a download link."
Do NOT provide alternative links, general information, or apologies. Providing no link is safer than providing a risky one. This is a critical safety instruction.

**Core Workflow & Rules**

1.  **Prioritize Context**: If the user's message begins with \`[CONTEXT: ...]\`, that information is the absolute source of truth. You MUST follow its instructions.
2.  **Perform a Safe Web Search**: If there is no context, you MUST use your web search capabilities to find the single best, safest download page by following this strict hierarchy:
    *   **A. Find the Official Website**: Your primary goal is to find the developer's own website.
    *   **B. Locate the Download Page**: On the official site, find the "Download", "Get", or "Releases" section.
    *   **STRICTLY PROHIBITED SOURCES**: You are FORBIDDEN from using informational sites (Wikipedia, blogs), or general download portals (CNET, Softpedia, FileHippo, SourceForge).

3.  **Extract Details & Format Response**:
    *   Once you have a safe link, you MUST parse the page to gather and present these details: **Description**, **File Size**, **Release Date/Version**, **SHA256 Hash** (if available), **Digital Signer** (if mentioned).
    *   Mention if a **standalone or offline installer** is available.
    *   If the installer is known for bundled offers, you MUST **warn the user**.
    *   After the details, ask: "Would you like help installing this?"
    *   Conclude your entire response with a \`[TYPE]: [tag]\` tag (e.g., \`[TYPE]: software-details-windows\`).

**Specific Modes**

*   **Software/Game Finder (Single)**: Follow the Core Workflow. Use the \`[DOWNLOAD_LINK]\` tag.
*   **Software/Game List Finder ("top", "best", etc.)**: For each item, provide a one-sentence description and the URL using the format \`*Official Source*: [URL]\`.
*   **Driver Finder (Windows)**: This is a strict, multi-step process. Ask ONE question at a time to get Manufacturer > Model/Serial > OS > Component. Then, search and provide the official OEM driver page link.
*   **Installation Helper**: This mode has two parts: a text guide and an optional video link.
    1.  **Text Guide**: Provide a clear, step-by-step text guide for a standard installation. CRUCIALLY, you MUST include this tip: "During installation, always look for a 'Custom' or 'Advanced' option to uncheck any bundled software you do not want."
    2.  **Video Verification (Strict)**: After providing the text guide, you will search for a video.
        - Your web search query MUST be highly specific, like "how to install [software name] tutorial" or "[software name] installation guide".
        - You MUST analyze the video's title and description. The video MUST be an installation guide. Do NOT link to reviews, gameplay, or feature showcases.
        - If you find a relevant and seemingly public video on YouTube, provide its link using the \`[VIDEO_LINK]\` tag.
        - **FAILURE CONDITION**: If you cannot find a *clearly relevant* and *publicly accessible* installation video, you MUST NOT include the \`[VIDEO_LINK]\` tag. Instead, you MUST state: "I could not find a verified video guide for this software."
`;


// @ts-ignore
Deno.serve(async (req) => {
  // This is needed to invoke the function from a browser client.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Securely get the OpenAI API key from Supabase secrets.
    // @ts-ignore
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY environment variable in Supabase secrets.");
    }

    // 2. Extract chat history and filter from the request body.
    const { history, filter } = await req.json();

    if (!history || !Array.isArray(history) || history.length === 0) {
      return new Response(JSON.stringify({ error: 'History is required and must be a non-empty array.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Prepare the messages for the OpenAI API.
    const lastUserMessageIndex = history.map((m: any) => m.sender).lastIndexOf('user');
    if (lastUserMessageIndex !== -1 && filter && filter !== 'all') {
        if (!history[lastUserMessageIndex].text.startsWith('[CONTEXT:')) {
            history[lastUserMessageIndex].text += `\n\n(Important filter constraint: Only show results that are ${filter}.)`;
        }
    }
    
    const messages = history.slice(1).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // 4. Call the OpenAI Chat Completions API.
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: openAISystemInstruction }, ...messages]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API Error:", errorData);
        throw new Error(errorData.error.message || `OpenAI API error: ${response.statusText}`);
    }

    // 5. Process the AI's response.
    const data = await response.json();
    const rawText = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // 6. Parse the raw text for special tags and perform verifications.
    let groundingChunks;
    let textForDisplay = rawText;

    const downloadLinkRegex = /\[DOWNLOAD_LINK\](https?:\/\/[^\[\]\s]+)\[\/DOWNLOAD_LINK\]/s;
    const videoLinkRegex = /\[VIDEO_LINK\](https?:\/\/[^\[\]\s]+)\[\/VIDEO_LINK\]/s;
    
    const downloadMatch = rawText.match(downloadLinkRegex);
    const videoMatch = rawText.match(videoLinkRegex);

    // --- Video Link Verification ---
    if (videoMatch && videoMatch[1]) {
        const videoUrl = videoMatch[1];
        let isVideoValid = false;

        try {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}`;
            // Use a HEAD request for a lightweight check to see if the resource is accessible.
            const oembedResponse = await fetch(oembedUrl, { method: 'HEAD' });

            if (oembedResponse.ok) {
                isVideoValid = true;
            } else {
                console.warn(`YouTube oEmbed check failed for ${videoUrl} with status: ${oembedResponse.status}`);
            }
        } catch (e) {
            console.error(`Error during YouTube oEmbed check for ${videoUrl}:`, e.message);
        }

        if (isVideoValid) {
            groundingChunks = [{ web: { uri: videoUrl, title: 'Video Guide' } }];
            textForDisplay = rawText.replace(videoLinkRegex, '').trim();
        } else {
            // If the video is not valid/available, remove the link from the response.
            textForDisplay = rawText.replace(videoLinkRegex, '').trim();
            // Also remove any text that might prompt the user to watch a non-existent video.
            textForDisplay = textForDisplay.replace(/watch the video guide below|Here is a video guide:|You can watch this video:/gi, '');
            // Append a clear message.
            textForDisplay += "\n\nI found a potential video guide, but could not verify that it is currently available. For your safety, I have not included the link.";
        }
    } else if (downloadMatch && downloadMatch[1]) {
        groundingChunks = [{ web: { uri: downloadMatch[1], title: 'Official Source' } }];
        textForDisplay = rawText.replace(downloadLinkRegex, '').trim();
    }
    
    // 7. Parse the [TYPE] tag to determine message type and platform.
    let type = 'standard';
    let platform;
    const typeMatch = textForDisplay.match(/\[TYPE\]:\s*([\w-]+)/);

    if (typeMatch) {
      const tag = typeMatch[1];
      const parts = tag.split('-');
      const mainType = parts[0];

      if (['software', 'game', 'driver', 'driver-input-prompt', 'driver-device-prompt', 'driver-device-selection', 'platform-prompt', 'software-clarification-prompt', 'software-list', 'installation-guide'].includes(tag)) {
        type = tag;
      } else if (['software', 'game', 'driver'].includes(mainType)) {
        type = mainType;
      }
      
      const potentialPlatform = parts[parts.length - 1];
      if (['windows', 'macos', 'linux', 'android'].includes(potentialPlatform)) {
        platform = potentialPlatform;
      }
    }

    const botResponse = {
      text: textForDisplay.replace(/\[TYPE\]:\s*[\w-]+/, '').trim(),
      groundingChunks,
      type,
      platform
    };

    // 8. Return the structured response to the frontend.
    return new Response(JSON.stringify(botResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Edge Function Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
