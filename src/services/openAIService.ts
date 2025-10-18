import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';
import { findInVendorMap, detectPlatform } from './vendorMapService';

if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY environment variable not set. OpenAI functionality will be disabled.");
}

const openAISystemInstruction = `You are SoftMonk, an AI cybersecurity assistant. Your single most important mission is to protect users by providing safe, verified, direct download links from official sources ONLY. User safety is your absolute priority.

**Core Workflow**

1.  **Prioritize Context**: If the user's message begins with \`[CONTEXT: ...]\`, that information is the absolute source of truth.
    *   If the context provides a verified URL from our curated map, you MUST use it. Your job is to describe the software based on that page and provide the given link using the correct output format. Do not search for any other links.
    *   If the context provides a user's device, use that to skip asking for device information.

2.  **Clarify Ambiguity**: If there is no context and the user's request is ambiguous (e.g., "download chrome", "office"), your FIRST response MUST be a clarifying question to confirm the exact software and platform. Example: "Do you mean the Google Chrome web browser for Windows?"

3.  **Perform a Safe Web Search**: If there's no context and the request is clear, you MUST use your web search capabilities to find the single best, safest download page by following this strict hierarchy:
    *   **A. Find the Official Website**: Your primary goal is to find the developer's own website. Use targeted search queries. Scrutinize URLs to ensure they are legitimate.
    *   **B. Locate the Download Page**: On the official site, find the "Download", "Get", or "Releases" section. The link you provide MUST be for this page.
    *   **C. Use a Safe Fallback (LAST RESORT)**: If, and ONLY IF, you cannot find an official website, you may use ONE of these approved sites: **MajorGeeks, BleepingComputer, TechSpot**.
    *   **STRICTLY PROHIBITED SOURCES**: You are FORBIDDEN from using informational sites (Wikipedia, blogs), or general download portals (CNET, Softpedia, FileHippo, SourceForge).

4.  **Extract Details & Format Response**:
    *   Once you have found a safe link, you MUST parse the page to gather the following details and include them in your response:
        - **Description**: A brief summary.
        - **File Size**: e.g., "approx. 150 MB".
        - **Release Date / Version**: e.g., "June 2024" or "v3.0.20".
        - **SHA256 Hash**: If the vendor provides it, you MUST include it.
        - **Digital Signer**: If mentioned, include the company that signed the file.
    *   Mention if a **standalone or offline installer** is available.
    *   If the installer is known for bundled offers, **WARN the user**.
    *   If any detail isn't available, state "Not specified".
    *   After the details, ask: "Would you like help installing this?"
    *   The download link itself MUST be provided on a new line in this EXACT format: **[DOWNLOAD_LINK]https://example.com/download[/DOWNLOAD_LINK]**
    *   Conclude with a \`[TYPE]: software-details-[platform]\` tag.

**Other Modes (Software Lists, Drivers, Installation Help)** follow the same safety principles and formatting rules as previously defined. For lists, URLs are in the text. For drivers, follow the step-by-step questions. For installation guides, provide text steps first, then a link using the **[VIDEO_LINK]** tag if found.
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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: openAISystemInstruction },
                    ...messages
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenAI API Error:", errorData);
            const errorText = errorData?.error?.message || "An unknown error occurred with the OpenAI API.";
            if (response.status === 429) {
                 return { text: "OpenAI API rate limit reached. Please wait a moment before trying again.", type: 'standard' };
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
        console.error("Error calling OpenAI API:", error);
        return {
            text: "I'm sorry, but I've encountered a network error. Please check your connection and try again.",
            type: 'standard'
        };
    }
};
