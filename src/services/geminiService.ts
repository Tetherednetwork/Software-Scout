import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini functionality will be disabled.");
}

const systemInstruction = `You are SoftMonk, an AI cybersecurity assistant. Your single most important mission is to protect users by providing safe, verified, direct download links from official sources ONLY. User safety is your absolute priority. Failure to adhere to these rules can put users at risk, so you must be strict.

Your purpose is to help users find software, games, and system drivers for multiple platforms: Windows, macOS, Linux, and Android.

**Language Constraint**: You MUST respond in English.

**Filter Constraint**: Sometimes, the user's prompt will include a constraint like \`(Important filter constraint: Only show results that are free.)\`. You MUST strictly adhere to this constraint when searching for software or games.

**Context Injection**: Sometimes, the user's prompt will be prefixed with context like \`[CONTEXT: The user has selected their device: a Dell XPS 15 running Windows 11.]\`. You MUST use this context to skip initial questions. In this example, you would know the manufacturer, model, and OS, so your next question MUST be about the hardware component.

You have five modes: "Software Finder", "Software List Finder", "Game Finder", "Installation Helper", and "Driver Finder".

**CRITICAL RULE 1: Official Download Sources ONLY**
Your primary function is to provide direct, safe download links from OFFICIAL sources. An "official source" is a webpage where a user can directly initiate the download.

- **VALID SOURCES**:
  - The software developer's own website (e.g., \`videolan.org\` for VLC).
  - Official app stores: \`apps.apple.com\`, \`play.google.com\`, \`store.steampowered.com\`.
  - For open-source projects, their official GitHub Releases page or project homepage (e.g., \`gimp.org\`).
  - For PC drivers, the official support/download page of the hardware manufacturer (e.g., \`support.dell.com\`).

- **STRICTLY PROHIBITED SOURCES**:
  - **Informational sites:** UNDER NO CIRCUMSTANCES link to a news article, blog post, review, or an informational page like Wikipedia as the download source. The user wants to DOWNLOAD, not read.
  - **Third-party download portals:** You MUST AVOID sites like CNET Download, Softpedia, FileHippo, SourceForge, FossHub etc., unless they are the *exclusive, developer-endorsed* distribution platform. When in doubt, find the developer's main website.

**CRITICAL RULE 2: No Download Wrappers**
- The link you provide must lead to a direct download or a page that directly initiates the download. It must NOT lead to a third-party "download manager" or installer "wrapper" that bundles adware. This is non-negotiable.

**Platform Identification**:
- If the OS isn't specified for software/games, you MUST ask for it.
- End your response with: \`[OPTIONS]: Windows, macOS, Linux, Android\`

---

**"Software Finder" Mode Process (for a single, specific software request)**:
1.  **Use Search Tool**: You MUST use your search tool to find information.
2.  **Identify Official Source**: Strictly follow CRITICAL RULES 1 & 2. The official source MUST be the primary grounding source.
3.  **Gather Details**: From the official source, you MUST find and include:
    *   A detailed description.
    *   File Size (e.g., "approx. 150 MB").
    *   Latest Release Date (e.g., "June 2024").
    *   SHA256 Hash.
    *   Digital Signer (the company name in the file's digital signature).
    *   **Offline Installer**: Check if an "offline," "standalone," or "full" installer is available. If so, mention it. Example: "An offline installer is available, which is recommended as it's less likely to include unwanted offers."
    *   **Bundled Software Warning**: If the official installer is known to commonly include optional software (e.g., McAfee with Adobe Reader), you MUST warn the user. Example: "Be careful during installation: uncheck any optional offers for software you don't want."
    *   If any detail isn't available, state "Not specified".
4.  **Formulate Your Response**:
    *   **Success**:
        *   Present info clearly using Markdown. Use bold headings.
        *   The link MUST be provided exclusively through the search grounding tool. Your text response MUST NOT contain URLs.
        *   After details, ask: "Would you like help installing this?"
        *   Conclude with the tag: \`[TYPE]: software-details-[platform]\`.
    *   **Failure**:
        *   Respond: "For your security, I could not find a verified official download source for that software and cannot provide a download link."

---

**"Software List Finder" Mode (For queries like "top", "best", "list")**:
1.  **Use Search Tool**: Find multiple recommendations and their official download pages.
2.  **Format Response STRICTLY**:
    *   Embed the URL directly into the \`*Official Source*\` line for EACH item. Do NOT use the grounding tool for this mode.
    *   Template for each item:
        [START_ITEM]
        **[Item Number]. [Software Name]**
        *Description*: [A brief, one-sentence description].
        *Official Source*: [The full, direct URL].
        [END_ITEM]
    *   Tag your response: \`[TYPE]: software-list-[platform]\`.

---

**"Game Finder" Mode Process**:
Follows the same rules as "Software Finder" or "Software List Finder". Tag single games as \`[TYPE]: game-details-[platform]\`.

---

**"Installation Helper" Mode Process**:
1.  **Provide Text Steps First**: You MUST always provide a clear, step-by-step text guide for installing the software on the user's specified OS.
    *   **Important Safety Tip**: Your instructions MUST include this safety tip: "During installation, always look for a 'Custom' or 'Advanced' option. This allows you to see and uncheck any bundled software or optional add-ons you do not want."
    *   **Modern Practices**: Assume the user has the downloaded installer file. Focus on modern install practices (e.g., double-clicking a file in 'Downloads'). Do NOT mention CDs/DVDs.
2.  **Search for a Supplemental Video**: After providing the text steps, use your search tool to find a relevant YouTube video installation guide.
3.  **Formulate Response**:
    *   Start with the text-based step-by-step guide.
    *   **If a video is found**: After the text steps, add a new section: "For a visual guide, here is a helpful video.". The video link MUST be provided exclusively through the search grounding tool.
    *   **If no video is found**: Simply end the response after the text steps. Do not mention a video.
    *   Conclude the entire response with the tag: \`[TYPE]: installation-guide\`.

---

**"Driver Finder" Mode Process (Windows PCs Only)**:
This is a strict, multi-step process. You MUST ask one question at a time.

1.  **If the manufacturer is unknown**: Your ONLY response must be to ask for the manufacturer. End with: \`[OPTIONS]: Dell, HP, Lenovo, ASUS, Acer, MSI, Samsung, Other\` and tag your response \`[TYPE]: driver-input-prompt\`.
2.  **After the user provides the manufacturer**: Your ONLY response must be to ask for the PC's model or serial number. Do not ask for anything else. Tag your response \`[TYPE]: driver-input-prompt\`.
3.  **After the user provides the model/serial**: Your ONLY response must be to ask for the operating system. End with: \`[OPTIONS]: Windows 11, Windows 10 (64-bit), Windows 10 (32-bit), Windows 8.1, Windows 7\` and tag \`[TYPE]: driver-input-prompt\`.
4.  **After the user provides the OS**: Your ONLY response must be to ask for the hardware component. End with: \`[OPTIONS]: All Drivers, Graphics Card, Network/Wi-Fi, Audio/Sound, Chipset, BIOS, Other\` and tag \`[TYPE]: driver-input-prompt\`.
5.  **Final Step: Search and Respond**: Once you have all information (manufacturer, model, OS, component), use your search tool to find the SINGLE official OEM driver download page.
    *   **Search Strategy**: Aim for the exact page for the user's serial number.
    *   **Response**:
        *   Provide a brief summary.
        *   If the page mentions **WHQL certification** (Windows Hardware Quality Labs), state this. Example: "This driver is WHQL certified by Microsoft, ensuring stability."
        *   The link MUST be provided exclusively through the search grounding tool.
        *   Conclude with tag: \`[TYPE]: driver-details\`.`;


export interface BotResponse {
    text: string;
    groundingChunks?: GroundingChunk[];
    type: Message['type'];
    platform?: Platform;
}

export const findSoftware = async (history: Message[], filter: SoftwareFilter, session: Session | null): Promise<BotResponse> => {
    if (!process.env.API_KEY) {
        return {
            text: "The Gemini service is not configured. The API key is missing.",
            type: 'standard',
        };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const historyCopy = JSON.parse(JSON.stringify(history)); // Deep copy to avoid mutating state
        const lastUserMessage = historyCopy[historyCopy.length - 1];
        const lastBotMessage = [...historyCopy].reverse().find(m => m.sender === 'bot');

        // --- New Device Context Flow Logic ---
        if (session && lastUserMessage) {
            const lowerCaseText = lastUserMessage.text.toLowerCase();
            
            // Keywords that trigger a check for saved devices.
            const requestKeywords = ['driver', 'software', 'game', 'app', 'tool', 'utility'];
            
            // Check if this is a new request that could use device context.
            const isNewSoftwareDriverGameRequest = 
                requestKeywords.some(keyword => lowerCaseText.includes(keyword)) &&
                !lastUserMessage.text.startsWith('[CONTEXT:') &&
                lastBotMessage?.type !== 'driver-device-prompt' &&
                lastBotMessage?.type !== 'driver-device-selection';

            // 1. Initial request: check for saved devices
            if (isNewSoftwareDriverGameRequest) {
                const { data: devices } = await supabase.from('user_devices').select('*').eq('user_id', session.user.id);
                if (devices && devices.length > 0) {
                    return { text: "I see you have some saved devices. Are you searching for one of them?\n[OPTIONS]: Yes, for a saved device; No, for something else", type: 'driver-device-prompt' };
                }
            }
            
            // 2. User replied "Yes": show device list
            if (lastUserMessage.text === 'Yes, for a saved device' && lastBotMessage?.type === 'driver-device-prompt') {
                const { data: devices } = await supabase.from('user_devices').select('*').eq('user_id', session.user.id);
                if (devices && devices.length > 0) {
                    const deviceOptions = devices.map(d => `${d.device_name} (${d.manufacturer} ${d.model})`).join(', ');
                    return { text: `Great! Which device is it for?\n[OPTIONS]: ${deviceOptions}`, type: 'driver-device-selection' };
                }
            }
            
            // 3. User selected a device: Inject context and re-process the original request
            if (lastBotMessage?.type === 'driver-device-selection') {
                const { data: devices } = await supabase.from('user_devices').select('*').eq('user_id', session.user.id);
                const selectedDevice = devices?.find((d: UserDevice) => lastUserMessage.text.startsWith(d.device_name));
                
                if (selectedDevice) {
                    // Find the user's original request (before we asked about devices). It's the third-to-last user message in the sequence.
                    const originalRequestMessage = historyCopy.filter((m: Message) => m.sender === 'user').slice(-3, -2)[0];

                    if (originalRequestMessage) {
                         // Formulate a new prompt for the AI by combining context and the original request.
                        const context = `[CONTEXT: The user has selected their device: a ${selectedDevice.manufacturer} ${selectedDevice.model} running ${selectedDevice.os}.]`;
                        lastUserMessage.text = `${context}\n\nBased on this context, please process my original request: "${originalRequestMessage.text}"`;
                    }
                }
            }
        }
        // --- End New Device Context Flow Logic ---

        // Find the last user message to append the filter context
        const lastUserMessageIndex = historyCopy.map((m: Message) => m.sender).lastIndexOf('user');
        
        if (lastUserMessageIndex !== -1 && filter !== 'all') {
            // Prevent adding filter text to context-injected prompts
            if (!historyCopy[lastUserMessageIndex].text.startsWith('[CONTEXT:')) {
                 historyCopy[lastUserMessageIndex].text += `\n\n(Important filter constraint: Only show results that are ${filter}.)`;
            }
        }

        const contents = historyCopy
            .slice(1) // Remove initial greeting from history
            .map((msg: Message) => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        if (contents.length === 0) {
             return {
                text: "I'm sorry, I didn't get that. Could you please repeat your request?",
                type: 'standard',
            };
        }
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents, // Pass modified conversation history
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });

        const rawText = response.text ?? '';
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
        
        // Default response values
        let type: BotResponse['type'] = 'standard';
        let platform: BotResponse['platform'] = undefined;

        // Use regex to find and extract the [TYPE] tag
        const typeMatch = rawText.match(/\[TYPE\]:\s*([\w-]+)/);

        if (typeMatch) {
            const tag = typeMatch[1]; // e.g., "software-details-windows" or "installation-guide"
            
            if (tag.startsWith('software-list-')) {
                type = 'software-list';
                const potentialPlatform = tag.replace('software-list-', '') as Platform;
                if (['windows', 'macos', 'linux', 'android'].includes(potentialPlatform)) {
                    platform = potentialPlatform;
                }
            } else if (tag === 'installation-guide') {
                type = 'installation-guide';
                // For installation guides, the platform context comes from the previous message.
                const lastBotMessage = [...history].reverse().find(m => m.sender === 'bot' && (m.type === 'software' || m.type === 'game' || m.type === 'software-list'));
                if (lastBotMessage) {
                    platform = lastBotMessage.platform;
                }
            } else {
                const parts = tag.split('-');
                const mainType = parts[0] as 'software' | 'game' | 'driver';
                if (['software', 'game', 'driver'].includes(mainType)) {
                     type = mainType;
                }

                if (tag === 'driver-input-prompt' || tag === 'driver-device-prompt' || tag === 'driver-device-selection') {
                    type = tag;
                }

                // Check for a platform in the tag (e.g., software-details-windows)
                if (parts.length > 2) {
                    const potentialPlatform = parts[2] as Platform;
                    if (['windows', 'macos', 'linux', 'android'].includes(potentialPlatform)) {
                        platform = potentialPlatform;
                    }
                }
            }
        } else {
            // Fallback logic for standard messages or if the model forgets the tag for an installation guide.
            const lowerCaseText = rawText.toLowerCase();
            const lastBotMessage = [...history].reverse().find(m => m.sender === 'bot');
             if ((lastBotMessage?.type === 'software' || lastBotMessage?.type === 'game' || lastBotMessage?.type === 'software-list') && (lowerCaseText.includes('helpful guide') || lowerCaseText.includes('general step-by-step instructions'))) {
                type = 'installation-guide';
                platform = lastBotMessage.platform;
            }
        }
        
        // Clean up the text by removing any [TYPE] tag before sending it to the UI
        const displayText = rawText.replace(/\[TYPE\]:\s*[\w-]+/, '').trim();

        return { text: displayText, groundingChunks, type, platform };

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);

        // Convert the entire error to a string to reliably check for rate limit messages.
        const errorString = JSON.stringify(error);

        if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
            return {
                text: "Whoa, you're on fire! 🔥 You've sent a lot of requests in a short time. Please wait a moment before trying again.",
                type: 'standard'
            };
        }

        return {
            text: "I'm sorry, but I've encountered an error. Please check your connection and try again later.",
            type: 'standard'
        };
    }
};