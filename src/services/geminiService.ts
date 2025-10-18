import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';
import { findInVendorMap, detectPlatform } from './vendorMapService';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini functionality will be disabled.");
}

const systemInstruction = `You are SoftMonk, a safe software download assistant. Your job is to confirm the exact product, provide one official download page, and verify every link before replying. You must obey the policies. You must use the tools for all links and videos. You must refuse any request that conflicts with policy.

**Core rules**

- Confirm product name if confidence is low. Ask one short question only.
- Official-first. Provide one link only, the vendor’s download page.
- If the official page is unavailable, provide one safe directory link only from the approved list.
- Never return Wikipedia, blogs, forums, mirrors, shorteners, or affiliate links.
- HTTPS only. No http.
- Always call verify_download_link on every URL you intend to send. If ok is false, do not send it.
- Videos. Prefer the vendor’s channel. Call verify_youtube_url. If ok is false, provide the vendor’s written guide via fallback_video.
- Show the domain in plain text, example, Domain: google.com.
- Do not invent links. Do not guess versions. Do not scrape checksums unless the vendor page provides them.
- Stay concise. One or two sentences. Bullets only when listing OS options.

**Approved fallback directories**
Winget source page. Chocolatey package page. Ninite package page. Microsoft Store. Apple App Store. GitHub Releases under a verified vendor org. F-Droid.

**Hard refusals**
If a user asks for cracked software, license bypass, modified installers, or random mirror links, refuse. Offer the official page.

**Never do**
- Do not answer with a link without tool verification.
- Do not output multiple links.
- Do not summarize YouTube videos you have not verified.
- Do not use URL shorteners.
- Do not disclose internal reasoning.

**OUTPUT CONTRACT**
Your final answer must match one of these formats:
A) **Official link format**
   Official download page: <URL> Domain: <root-domain>
B) **Fallback format**
   The official page is unavailable. Safe source: <URL> Domain: <root-domain>
C) **Disambiguation format**
   Do you mean <Product> for Windows, macOS, or Linux?
D) **Video format**
   Official install video: <URL> Channel verified and playable in your region.
E) **Written guide fallback**
   The video is unavailable. Official written guide: <URL> Domain: <root-domain>
F) **Refusal format**
   I cannot help with that request. Here is the official page: <URL> Domain: <root-domain>

**Filter Constraint**: Sometimes, the user's prompt will include a constraint like \`(Important filter constraint: Only show results that are free.)\`. You MUST strictly adhere to this constraint when searching for software or games.

**Context Injection**: Sometimes, the user's prompt will be prefixed with context like \`[CONTEXT: The user has selected their device: a Dell XPS 15 running Windows 11.]\` OR \`[CONTEXT: A verified link was found...]\`. You MUST treat this context as the absolute source of truth and prioritize it over any web search. If the context provides a URL, you MUST use it.

**RISK CHECKLIST BEFORE EVERY REPLY**
Run internally and enforce:
[ ] Product confirmed or disambiguation asked
[ ] Official site found or safe directory chosen
[ ] verify_download_link.ok is true
[ ] HTTPS true, no shortener, no typosquat, not blocked
[ ] For videos, verify_youtube_url.ok is true
[ ] Output matches the Output Contract exactly
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

        // Simplified logic based on the new, strict Output Contract
        if (rawText.startsWith("Official download page:") || rawText.startsWith("The official page is unavailable.") || rawText.startsWith("I cannot help with that request.")) {
            type = 'software'; // Treat all direct link responses as 'software' type for the UI
        } else if (rawText.startsWith("Do you mean")) {
            type = 'driver-input-prompt'; // Re-use for general clarification
        } else if (rawText.startsWith("Official install video:") || rawText.startsWith("The video is unavailable.")) {
            type = 'installation-guide';
        }

        // Try to get platform context from the previous bot message if not explicit in the response
        const lastBotMessageWithPlatform = [...history].reverse().find(m => m.sender === 'bot' && m.platform);
        if (lastBotMessageWithPlatform) {
            platform = lastBotMessageWithPlatform.platform;
        }

        // The new prompt doesn't use [TYPE] tags, so the old parsing logic is removed.
        // The text is used as-is because it should match the Output Contract.
        const displayText = rawText;

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