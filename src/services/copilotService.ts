
import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';
import { findInVendorMap, detectPlatform } from './vendorMapService';

if (!process.env.AZURE_API_KEY) {
    console.warn("AZURE_API_KEY environment variable not set. Azure AI functionality will be disabled.");
}

const copilotSystemInstruction = `You are SoftMonk, an AI cybersecurity assistant. Your single most important mission is to protect users by providing safe, verified, direct download links from official sources ONLY. User safety is your absolute priority.

Your purpose is to help users find software, games, and system drivers for multiple platforms: Windows, macOS, Linux, and Android.

**Language Constraint**: You MUST respond in English.

**Core Principles - You MUST follow these in order:**

**1. Clarify First:**
- If a user's request is short or ambiguous (e.g., "download chrome", "office"), your FIRST response MUST be a clarifying question to confirm the exact software and platform.
- Example: If the user says "chrome", you MUST ask: "Are you looking for the Google Chrome web browser? If so, for which operating system?"
- End clarifying questions with \`[OPTIONS]\` if appropriate.

**2. Prioritize Official Sources Above All:**
- Once the software is clear, you MUST use your web search capabilities to find the **official download page** from the software developer's own website.
- **VALID OFFICIAL SOURCES**: The developer's website (e.g., \`videolan.org\` for VLC, \`google.com/chrome\` for Google Chrome), official app stores (\`apps.apple.com\`, \`play.google.com\`, \`store.steampowered.com\`), or the official GitHub Releases page for open-source projects.
- The link you provide MUST lead directly to a page where the download can be started, not a generic homepage, product tour, or feature page.

**3. Provide a Safe Fallback ONLY If Necessary:**
- If, and ONLY IF, you have searched and cannot find an official website or a direct official download page, you may use ONE of these reputable third-party download sites as a fallback: **MajorGeeks, BleepingComputer, TechSpot**.
- **STRICTLY PROHIBITED SOURCES**: You are FORBIDDEN from using informational sites (Wikipedia, blogs, news articles) or general download portals (CNET Download, Softpedia, FileHippo, SourceForge) as the primary download source.

**Filter Constraint**: Sometimes, the user's prompt will include a constraint like \`(Important filter constraint: Only show results that are free.)\`. You MUST strictly adhere to this constraint when searching for software or games.

**Context Injection**: Sometimes, the user's prompt will be prefixed with context like \`[CONTEXT: The user has selected their device: a Dell XPS 15 running Windows 11.]\` OR \`[CONTEXT: A verified link was found...]\`. You MUST treat this context as the absolute source of truth and prioritize it over any web search. If the context provides a URL, you MUST use it.

---

**"Software Finder" Mode Process (for a single, specific software request)**:
1.  **Clarify Ambiguity**: Follow Core Principle #1. If the request is already clear, proceed.
2.  **Use Web Search**: Follow Core Principles #2 and #3 to find the single best, safest download page.
3.  **Gather Details and Format Response**:
    *   **Success (Official or Safe Fallback Source Found)**:
        *   First, confirm the software name. Example: "Here are the official download details for the Google Chrome web browser."
        *   Present info clearly using Markdown with bold headings.
        *   Include: **Description**, **File Size**, **Release Date**, **SHA256 Hash**, **Digital Signer**.
        *   **Offline Installer**: Mention if a "standalone" or "offline" installer is available.
        *   **Bundled Software Warning**: If the installer is known to have optional offers, WARN the user.
        *   For any details not available, state "Not specified".
        *   After details, ask: "Would you like help installing this?"
        *   After the question, you MUST provide the download link on a new line in this exact format: **[DOWNLOAD_LINK]https://example.com/download[/DOWNLOAD_LINK]**
        *   Conclude with tag: \`[TYPE]: software-details-[platform]\`.
    *   **Failure**:
        *   Respond: "For your security, I could not find a verified official download source for that software and cannot provide a download link."

---

**"Software List Finder" Mode (For queries with "top", "best", "list", etc.)**:
1.  **Search and Find Sources**: Find multiple recommendations and their official download pages.
2.  **Format Response STRICTLY**:
    *   Embed the URL directly into the \`*Official Source*\` line for EACH item.
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
    *   **Important Safety Tip**: Your instructions MUST include this safety tip: "During installation, always look for a 'Custom' or 'Advanced' option to uncheck any bundled software you do not want."
2.  **Search for a Supplemental Video**: After providing the text steps, use your web search to find a relevant YouTube video installation guide.
3.  **Formulate Response**:
    *   Start your response with the text-based step-by-step guide.
    *   **If a video is found**: After the text steps, add a new section: "For a visual guide, here is a helpful video.". **Then provide the video URL on a new line in this exact format: [VIDEO_LINK]https://youtube.com/watch?v=...[/VIDEO_LINK]**.
    *   **If no video is found**: Simply end the response after the text steps. Do not mention a video.
    *   Conclude the entire response with the tag: \`[TYPE]: installation-guide\`.

---

**"Driver Finder" Mode Process (Windows PCs Only)**:
This is a strict, multi-step process. You MUST ask one question at a time.

1.  **If the manufacturer is unknown**: Your ONLY response must be to ask for the manufacturer. End with: \`[OPTIONS]: Dell, HP, Lenovo, ASUS, Acer, MSI, Samsung, Other\` and tag your response \`[TYPE]: driver-input-prompt\`.
2.  **After the user provides the manufacturer**: Your ONLY response must be to ask for the PC's model or serial number. Do not ask for anything else. Tag your response \`[TYPE]: driver-input-prompt\`.
3.  **After the user provides the model/serial**: Your ONLY response must be to ask for the operating system. End with: \`[OPTIONS]: Windows 11, Windows 10 (64-bit), Windows 10 (32-bit), Windows 8.1, Windows 7\` and tag \`[TYPE]: driver-input-prompt\`.
4.  **After the user provides the OS**: Your ONLY response must be to ask for the hardware component. End with: \`[OPTIONS]: All Drivers, Graphics Card, Network/Wi-Fi, Audio/Sound, Chipset, BIOS, Other\` and tag \`[TYPE]: driver-input-prompt\`.
5.  **Final Step: Search and Respond**: Once you have all information, use your web search to find the SINGLE official OEM driver download page.
    *   **Response**:
        *   Provide a brief summary.
        *   If the page mentions **WHQL certification**, state this.
        *   Provide the URL to the official page on a new line in this exact format: **[DOWNLOAD_LINK]https://example.com/drivers[/DOWNLOAD_LINK]**.
        *   Conclude with tag: \`[TYPE]: driver-details\`.
`;

export interface BotResponse {
    text: string;
    groundingChunks?: GroundingChunk[];
    type: Message['type'];
    platform?: Platform;
}

// Note: This function assumes a Microsoft Azure-hosted model endpoint that is compatible with the OpenAI API format.
// This is a common setup for using models that power Copilot.
export const findSoftware = async (history: Message[], filter: SoftwareFilter, session: Session | null): Promise<BotResponse> => {
    if (!process.env.AZURE_API_KEY) {
         return {
            text: "The Azure AI service is not configured. The API key is missing.",
            type: 'standard',
        };
    }

    try {
        const historyCopy = JSON.parse(JSON.stringify(history)); 
        const lastUserMessage = historyCopy[historyCopy.length - 1];
        const lastBotMessage = [...historyCopy].reverse().find((m: Message) => m.sender === 'bot');

        // --- Vendor Map & Device Context Flow Logic ---
        if (session && lastUserMessage) {
            const lowerCaseText = lastUserMessage.text.toLowerCase();
            const isNewRequest = !lastUserMessage.text.startsWith('[CONTEXT:') && (!lastBotMessage || !lastBotMessage.text.includes('[OPTIONS]:'));

            // 1. Check vendor map first for new requests
            if (isNewRequest) {
                const foundSoftware = await findInVendorMap(lastUserMessage.text);
                if (foundSoftware) {
                    const platform = detectPlatform(lastUserMessage.text);
                    const url = platform ? foundSoftware[platform as keyof typeof foundSoftware] : null;

                    if (url && typeof url === 'string') {
                        const context = `[CONTEXT: A verified link for ${foundSoftware.name} for ${platform} was found in our curated map: ${url}. You MUST use this as the official source. Do not use web search to find another link. Follow the "Software Finder" mode process to describe the software and present this link using the [DOWNLOAD_LINK] tag.]`;
                        lastUserMessage.text = `${context}\n\nOriginal request: "${lastUserMessage.text}"`;
                    }
                }
            }

            // 2. Standard device context flow
            const requestKeywords = ['driver', 'software', 'game', 'app', 'tool', 'utility'];
            const isNewSoftwareDriverGameRequest = 
                requestKeywords.some(keyword => lowerCaseText.includes(keyword)) && isNewRequest;

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
                    const originalRequestMessage = historyCopy.filter((m: Message) => m.sender === 'user').slice(-3, -2)[0];
                    if (originalRequestMessage) {
                        const context = `[CONTEXT: The user has selected their device: a ${selectedDevice.manufacturer} ${selectedDevice.model} running ${selectedDevice.os}.]`;
                        lastUserMessage.text = `${context}\n\nBased on this context, please process my original request: "${originalRequestMessage.text}"`;
                    }
                }
            }
        }
        // --- End Context Flow Logic ---

        const lastUserMessageIndex = historyCopy.map((m: Message) => m.sender).lastIndexOf('user');
        
        if (lastUserMessageIndex !== -1 && filter !== 'all') {
            if (!historyCopy[lastUserMessageIndex].text.startsWith('[CONTEXT:')) {
                historyCopy[lastUserMessageIndex].text += `\n\n(Important filter constraint: Only show results that are ${filter}.)`;
            }
        }
        
        const messages = historyCopy
            .slice(1) 
            .map((msg: Message) => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
        
        if (messages.length === 0) {
             return { text: "I'm sorry, I didn't get that. Could you please repeat your request?", type: 'standard' };
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', { // Using a compatible endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AZURE_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Assuming access to a powerful model
                messages: [
                    { role: 'system', content: copilotSystemInstruction },
                    ...messages
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Azure AI API Error:", errorData);
            const errorText = errorData?.error?.message || "An unknown error occurred with the Azure AI API.";
            if (response.status === 429) {
                 return { text: "Azure AI API rate limit reached. Please wait a moment before trying again.", type: 'standard' };
            }
            return { text: `Sorry, an error occurred: ${errorText}`, type: 'standard' };
        }

        const data = await response.json();
        const rawText = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

        let groundingChunks: GroundingChunk[] | undefined = undefined;
        let textForDisplay = rawText;

        const downloadLinkRegex = /\[DOWNLOAD_LINK\](https?:\/\/[^\[\]\s]+)\[\/DOWNLOAD_LINK\]/;
        const downloadMatch = rawText.match(downloadLinkRegex);

        const videoLinkRegex = /\[VIDEO_LINK\](https?:\/\/[^\[\]\s]+)\[\/VIDEO_LINK\]/;
        const videoMatch = rawText.match(videoLinkRegex);

        if (downloadMatch && downloadMatch[1]) {
            const url = downloadMatch[1];
            groundingChunks = [{ web: { uri: url, title: 'Official Source' } }];
            textForDisplay = rawText.replace(downloadLinkRegex, '').trim();
        } else if (videoMatch && videoMatch[1]) {
            const url = videoMatch[1];
            groundingChunks = [{ web: { uri: url, title: 'Video Guide' } }];
            textForDisplay = rawText.replace(videoLinkRegex, '').trim();
        }

        let type: BotResponse['type'] = 'standard';
        let platform: BotResponse['platform'] = undefined;

        const typeMatch = rawText.match(/\[TYPE\]:\s*([\w-]+)/);
        if (typeMatch) {
            const tag = typeMatch[1];
            if (tag.startsWith('software-list-')) {
                type = 'software-list';
                platform = tag.replace('software-list-', '') as Platform;
            } else if (tag === 'installation-guide') {
                type = 'installation-guide';
                const lastBotMessage = [...history].reverse().find(m => m.sender === 'bot' && (m.type === 'software' || m.type === 'game'));
                if (lastBotMessage) platform = lastBotMessage.platform;
            } else {
                const parts = tag.split('-');
                if (['software', 'game', 'driver'].includes(parts[0])) {
                     type = parts[0] as 'software' | 'game' | 'driver';
                }
                if (tag === 'driver-input-prompt' || tag === 'driver-device-prompt' || tag === 'driver-device-selection') {
                    type = tag;
                }
                if (parts.length > 2) {
                     const potentialPlatform = parts[parts.length - 1] as Platform;
                     if (['windows', 'macos', 'linux', 'android'].includes(potentialPlatform)) {
                        platform = potentialPlatform;
                    }
                }
            }
        }
        
        const displayText = textForDisplay.replace(/\[TYPE\]:\s*[\w-]+/, '').trim();

        return { text: displayText, groundingChunks, type, platform };

    } catch (error: any) {
        console.error("Error calling Azure AI API:", error);
        return {
            text: "I'm sorry, but I've encountered a network error. Please check your connection and try again.",
            type: 'standard'
        };
    }
};
