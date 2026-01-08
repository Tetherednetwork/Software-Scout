

import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';

if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY environment variable not set. OpenAI functionality will be disabled.");
}

// This system instruction is the core "training" for the AI, defining its persona, rules, and output format.
const openAISystemInstruction = `You are SoftMonk, an AI cybersecurity assistant. Your single most important mission is to protect users by providing safe, verified, direct download links from official sources ONLY. User safety is your absolute priority.

**CRITICAL RULE: URL HANDLING & OUTPUT FORMAT**
You MUST NEVER write a raw URL for a download or a video directly in your main text response. This is a strict security and user experience requirement.
- For **software, game, or driver downloads**, you MUST provide the link on a new line in this EXACT format: **[DOWNLOAD_LINK]https://example.com/download[/DOWNLOAD_LINK]**
- For **YouTube video guides**, you MUST provide the link on a new line in this EXACT format: **[VIDEO_LINK]https://youtube.com/watch?v=...[/VIDEO_LINK]**
// FIX: Escaped backticks inside the template literal to prevent a syntax error.
- For **lists of software**, you MUST embed the URL directly into the text for each item, like this: \\\`*Official Source*: [URL]\\\`.
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

// FIX: Escaped backticks inside the template literal to prevent a syntax error.
*   **Software/Game Finder (Single)**: Follow the Core Workflow. Use the \\\`[DOWNLOAD_LINK]\\\` tag.
*   **Software/Game List Finder ("top", "best", etc.)**: For each item, provide a one-sentence description and the URL using the format \`*Official Source*: [URL]\`.
*   **Driver Finder (Windows)**: This is a strict, multi-step process. Ask ONE question at a time to get Manufacturer > Model/Serial > OS > Component. Then, search and provide the official OEM driver page link.
*   **Installation Helper**: First, provide a clear, step-by-step text guide. CRUCIALLY, include this tip: "During installation, always look for a 'Custom' or 'Advanced' option to uncheck any bundled software you do not want." After the text, if you find a relevant YouTube video, provide its link using the \`[VIDEO_LINK]\` tag.
`;

export interface BotResponse {
    text: string;
    groundingChunks?: GroundingChunk[];
    type: Message['type'];
    platform?: Platform;
}

export const findSoftware = async (history: Message[], filter: SoftwareFilter, session: Session | null): Promise<BotResponse> => {
    if (!process.env.OPENAI_API_KEY) {
         return {
            text: "The OpenAI service is not configured. The API key is missing.",
            type: 'standard',
        };
    }

    try {
        const historyCopy = JSON.parse(JSON.stringify(history)); 
        const lastUserMessage = historyCopy[historyCopy.length - 1];
        const lastBotMessage = [...historyCopy].reverse().find(m => m.sender === 'bot');

        // --- Device Context Flow Logic ---
        if (session && lastUserMessage) {
            const lowerCaseText = lastUserMessage.text.toLowerCase();
            const isNewSoftwareDriverGameRequest = ['driver', 'software', 'game', 'app'].some(keyword => lowerCaseText.includes(keyword)) && !lastUserMessage.text.startsWith('[CONTEXT:') && lastBotMessage?.type !== 'driver-device-prompt' && lastBotMessage?.type !== 'driver-device-selection';

            if (isNewSoftwareDriverGameRequest) {
                const { data: devices } = await supabase.from('user_devices').select('*').eq('user_id', session.user.id);
                if (devices && devices.length > 0) {
                    return { text: "I see you have some saved devices. Are you searching for one of them?\n[OPTIONS]: Yes, for a saved device; No, for something else", type: 'driver-device-prompt' };
                }
            }
            
            if (lastUserMessage.text === 'Yes, for a saved device' && lastBotMessage?.type === 'driver-device-prompt') {
                const { data: devices } = await supabase.from('user_devices').select('*').eq('user_id', session.user.id);
                if (devices && devices.length > 0) {
                    const deviceOptions = devices.map(d => `${d.device_name} (${d.manufacturer} ${d.model})`).join(', ');
                    return { text: `Great! Which device is it for?\n[OPTIONS]: ${deviceOptions}`, type: 'driver-device-selection' };
                }
            }
            
            if (lastBotMessage?.type === 'driver-device-selection') {
                const { data: devices } = await supabase.from('user_devices').select('*').eq('user_id', session.user.id);
                const selectedDevice = devices?.find((d: UserDevice) => lastUserMessage.text.startsWith(d.device_name));
                
                if (selectedDevice) {
                    // FIX: Replaced findLast with reverse().find() for broader JavaScript environment compatibility.
                    const originalRequestMessage = [...historyCopy].reverse().find((m: Message) => m.sender === 'user' && m.type !== 'driver-device-selection' && m.text !== 'Yes, for a saved device');
                    if (originalRequestMessage) {
                        const context = `[CONTEXT: The user has selected their device: a ${selectedDevice.manufacturer} ${selectedDevice.model} running ${selectedDevice.os}.]`;
                        lastUserMessage.text = `${context}\n\nBased on this context, please process my original request: "${originalRequestMessage.text}"`;
                    }
                }
            }
        }
        // --- End Device Context Flow ---

        const lastUserMessageIndex = historyCopy.map((m: Message) => m.sender).lastIndexOf('user');
        
        if (lastUserMessageIndex !== -1 && filter !== 'all') {
             if (!historyCopy[lastUserMessageIndex].text.startsWith('[CONTEXT:')) {
                historyCopy[lastUserMessageIndex].text += `\n\n(Important filter constraint: Only show results that are ${filter}.)`;
            }
        }
        
        const messages = historyCopy.slice(1).map((msg: Message) => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }));
        
        if (messages.length === 0) return { text: "I'm sorry, I didn't get that.", type: 'standard' };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: openAISystemInstruction }, ...messages] })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenAI API Error:", errorData);
            const errorText = errorData?.error?.message || "An unknown error occurred with the OpenAI API.";
            if (response.status === 429) return { text: "OpenAI API rate limit reached. Please wait.", type: 'standard' };
            return { text: `Sorry, an error occurred: ${errorText}`, type: 'standard' };
        }

        const data = await response.json();
        const rawText = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

        // --- Adapt OpenAI response to the UI's expected format ---
        let groundingChunks: GroundingChunk[] | undefined = undefined;
        let textForDisplay = rawText;

        const downloadLinkRegex = /\[DOWNLOAD_LINK\](https?:\/\/[^\[\]\s]+)\[\/DOWNLOAD_LINK\]/s;
        const downloadMatch = rawText.match(downloadLinkRegex);
        const videoLinkRegex = /\[VIDEO_LINK\](https?:\/\/[^\[\]\s]+)\[\/VIDEO_LINK\]/s;
        const videoMatch = rawText.match(videoLinkRegex);

        if (downloadMatch && downloadMatch[1]) {
            groundingChunks = [{ web: { uri: downloadMatch[1], title: 'Official Source' } }];
            textForDisplay = rawText.replace(downloadLinkRegex, '').trim();
        } else if (videoMatch && videoMatch[1]) {
            groundingChunks = [{ web: { uri: videoMatch[1], title: 'Video Guide' } }];
            textForDisplay = rawText.replace(videoLinkRegex, '').trim();
        }

        let type: BotResponse['type'] = 'standard';
        let platform: BotResponse['platform'] = undefined;

        const typeMatch = textForDisplay.match(/\[TYPE\]:\s*([\w-]+)/);
        if (typeMatch) {
            const tag = typeMatch[1];
            const parts = tag.split('-');
            if (['software', 'game', 'driver'].includes(parts[0])) type = parts[0] as 'software' | 'game' | 'driver';
            if (['driver-input-prompt', 'driver-device-prompt', 'driver-device-selection', 'platform-prompt', 'software-clarification-prompt', 'software-list', 'installation-guide'].includes(tag)) type = tag;
            if (parts.length > 1) {
                const potentialPlatform = parts[parts.length - 1] as Platform;
                if (['windows', 'macos', 'linux', 'android'].includes(potentialPlatform)) platform = potentialPlatform;
            }
        }
        
        const displayText = textForDisplay.replace(/\[TYPE\]:\s*[\w-]+/, '').trim();

        return { text: displayText, groundingChunks, type, platform };

    } catch (error: any) {
        console.error("Error calling OpenAI API:", error);
        return { text: "I'm sorry, a network error occurred. Please try again.", type: 'standard' };
    }
};