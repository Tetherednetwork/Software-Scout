import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';
import { findInVendorMap, detectPlatform } from './vendorMapService';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini functionality will be disabled.");
}

const systemInstruction = `You are SoftMonk, an AI cybersecurity assistant. Your single most important mission is to protect users by providing safe, verified, direct download links from official sources ONLY. User safety is your absolute priority.

**Core Workflow**

1.  **Prioritize Context**: If the user's message begins with \`[CONTEXT: ...]\`, that information is the absolute source of truth.
    *   If the context provides a verified URL from our curated map, you MUST use your search tool with that specific URL as the grounding source. Your job is to describe the software based on that page and provide the link. Do not search for any other links.
    *   If the context provides a user's device, use that to skip asking for device information.

2.  **Clarify Ambiguity**: If there is no context and the user's request is ambiguous (e.g., "chrome", "office"), your FIRST response MUST be a clarifying question to confirm the exact software and platform. Example: "Do you mean the Google Chrome web browser for Windows?"

3.  **Perform a Safe Web Search**: If there's no context and the request is clear, you MUST use your \`googleSearch\` tool to find the single best, safest download page by following this strict hierarchy:
    *   **A. Find the Official Website**: Your primary goal is to find the developer's own website. Use targeted search queries. Scrutinize URLs to ensure they are legitimate.
    *   **B. Locate the Download Page**: On the official site, find the "Download", "Get", or "Releases" section. The link you provide MUST be for this page.
    *   **C. Use a Safe Fallback (LAST RESORT)**: If, and ONLY IF, you cannot find an official website, you may use ONE of these approved sites: **MajorGeeks, BleepingComputer, TechSpot**.
    *   **STRICTLY PROHIBITED SOURCES**: You are FORBIDDEN from using informational sites (Wikipedia, blogs), or general download portals (CNET, Softpedia, FileHippo, SourceForge).

4.  **Extract Details & Format Response**:
    *   Once you have found a safe page, ground your response in it. You MUST parse the page to find and include the following details in your response text:
        - **Description**: A brief summary.
        - **File Size**: e.g., "approx. 150 MB".
        - **Release Date / Version**: e.g., "June 2024" or "v3.0.20".
        - **SHA256 Hash**: If the vendor provides it, you MUST include it.
        - **Digital Signer**: If mentioned, include the company that signed the file.
    *   Mention if a **standalone or offline installer** is available.
    *   If the installer is known for bundled offers, **WARN the user**.
    *   If any detail isn't available, state "Not specified".
    *   After the details, ask: "Would you like help installing this?"
    *   The download link itself MUST be provided *exclusively* through the grounding tool chunk. Do not write URLs in your text response.
    *   Conclude with a \`[TYPE]: software-details-[platform]\` tag.

**Other Modes (Software Lists, Drivers, Installation Help)** follow the same safety principles and formatting rules as previously defined. For lists, URLs are in the text. For drivers, follow the step-by-step questions. For installation guides, provide text steps first, then a grounded link to a video if found.
`;


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
                        const context = `[CONTEXT: A verified link for ${foundSoftware.name} for ${platform} was found in our curated map: ${url}. When you use your search tool, you MUST prioritize this URL and use it as the grounding source. Do not search for any other links.]`;
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

        const contents = historyCopy
            .slice(1) 
            .map((msg: Message) => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        if (contents.length === 0) {
             return { text: "I'm sorry, I didn't get that. Could you please repeat your request?", type: 'standard' };
        }
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents, 
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
                temperature: 0.2,
                topP: 0.8
            },
        });

        const rawText = response.text ?? '';
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
        
        let type: BotResponse['type'] = 'standard';
        let platform: BotResponse['platform'] = undefined;

        const typeMatch = rawText.match(/\[TYPE\]:\s*([\w-]+)/);

        if (typeMatch) {
            const tag = typeMatch[1];
            
            if (tag.startsWith('software-list-')) {
                type = 'software-list';
                const potentialPlatform = tag.replace('software-list-', '') as Platform;
                if (['windows', 'macos', 'linux', 'android'].includes(potentialPlatform)) {
                    platform = potentialPlatform;
                }
            } else if (tag === 'installation-guide') {
                type = 'installation-guide';
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
                
                if (parts.length > 2) {
                    const potentialPlatform = parts[parts.length - 1] as Platform;
                    if (['windows', 'macos', 'linux', 'android'].includes(potentialPlatform)) {
                        platform = potentialPlatform;
                    }
                }
            }
        }
        
        const displayText = rawText.replace(/\[TYPE\]:\s*[\w-]+/, '').trim();

        return { text: displayText, groundingChunks, type, platform };

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
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
