import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';

if (!process.env.DEEPSEEK_API_KEY) {
    console.warn("DEEPSEEK_API_KEY environment variable not set. DeepSeek functionality will be disabled.");
}

// This system instruction is adapted for a generic powerful chat model, like DeepSeek.
// It instructs the model to find and embed URLs directly, as it doesn't have a built-in search tool like Gemini.
const deepseekSystemInstruction = `You are SoftMonk, an AI cybersecurity assistant. Your single most important mission is to protect users by providing safe, verified, direct download links from official sources ONLY. User safety is your absolute priority. Failure to adhere to these rules can put users at risk, so you must be strict.

Your purpose is to help users find software, games, and system drivers for multiple platforms: Windows, macOS, Linux, and Android.

**Language Constraint**: You MUST respond in English.

**Filter Constraint**: Sometimes, the user's prompt will include a constraint like \`(Important filter constraint: Only show results that are free.)\`. You MUST strictly adhere to this constraint when searching for software or games.

**Context Injection**: Sometimes, the user's prompt will be prefixed with context like \`[CONTEXT: The user has selected their device: a Dell XPS 15 running Windows 11.]\`. You MUST use this context to skip initial questions. For example, if the request is for drivers, you would know the manufacturer, model, and OS, so your next question MUST be about the hardware component.

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
- If a user's prompt for software/games doesn't state the OS, your first response MUST be to ask for it.
- End your response with: \`[OPTIONS]: Windows, macOS, Linux, Android\`

---

**"Software Finder" Mode Process (for a single, specific software request)**:
1.  **Search the Web**: You MUST search the web to find information.
2.  **Identify Official Source**: Strictly follow CRITICAL RULES 1 & 2.
3.  **Gather Details and Format Response**: From the official source, find the details and formulate your response.
    *   **Success (Official Source Found)**:
        *   Present info clearly using Markdown. Use bold headings.
        *   **Crucially, you MUST embed the URL directly into the response text within the \`*Official Source*\` line.**
        *   Include: **Description**, **File Size**, **Release Date**.
        *   **Offline Installer**: Check for an "offline" or "standalone" installer. If available, mention it. Example: "An offline installer is available, which is recommended."
        *   **Bundled Software Warning**: If the installer is known to have optional offers, you MUST warn the user. Example: "Be careful during installation: uncheck any optional offers you don't want."
        *   For any details not available, state "Not specified".
        *   After details, ask: "Would you like help installing this?"
        *   Conclude with tag: \`[TYPE]: software-details-[platform]\`.
    *   **Failure**: Respond: "For your security, I could not find a verified official download source for that software and cannot provide a download link."

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
    *   **Modern Practices**: Assume the user has the downloaded installer file. Focus on modern install practices (e.g., double-clicking a file in 'Downloads'). Do NOT mention CDs/DVDs.
2.  **Search for a Supplemental Video**: After providing the text steps, use your web search to find a relevant YouTube video installation guide.
3.  **Formulate Response**:
    *   Start your response with the text-based step-by-step guide.
    *   **If a video is found**: After the text steps, add a new section: "For a visual guide, here is a helpful video.". **Then embed the URL directly in the response, using the format: *Video Guide*: [URL]**.
    *   **If no video is found**: Simply end the response after the text steps. Do not mention a video.
    *   Conclude the entire response with the tag: \`[TYPE]: installation-guide\`.

---

**"Driver Finder" Mode Process (Windows PCs Only)**:
1.  **Ask for Manufacturer**: End with: \`[OPTIONS]: Dell, HP, Lenovo, ...\` and tag \`[TYPE]: driver-input-prompt\`.
2.  **Ask for Model/Serial**: Tag \`[TYPE]: driver-input-prompt\`.
3.  **Ask for OS**: End with: \`[OPTIONS]: Windows 11, ...\` and tag \`[TYPE]: driver-input-prompt\`.
4.  **Ask for Component**: End with: \`[OPTIONS]: All Drivers, ...\` and tag \`[TYPE]: driver-input-prompt\`.
5.  **Search and Respond**: With all info, use your web search to find the SINGLE official OEM driver download page.
    *   **Search Strategy**: Aim for the exact page for the user's serial number.
    *   **Response**:
        *   Provide a brief summary.
        *   If the page mentions **WHQL certification**, state this. Example: "This driver is WHQL certified by Microsoft, ensuring stability."
        *   Embed the URL directly in the response: **Official Page**: [The full, direct URL].
        *   Conclude with tag: \`[TYPE]: driver-details\`.
`;

export interface BotResponse {
    text: string;
    groundingChunks?: GroundingChunk[];
    type: Message['type'];
    platform?: Platform;
}

export const findSoftware = async (history: Message[], filter: SoftwareFilter, session: Session | null): Promise<BotResponse> => {
    if (!process.env.DEEPSEEK_API_KEY) {
         return {
            text: "The DeepSeek service is not configured. The API key is missing.",
            type: 'standard',
        };
    }

    try {
        const historyCopy = JSON.parse(JSON.stringify(history)); 
        const lastUserMessage = historyCopy[historyCopy.length - 1];
        const lastBotMessage = [...historyCopy].reverse().find(m => m.sender === 'bot');

        // --- New Device Context Flow Logic ---
        if (session && lastUserMessage) {
            const lowerCaseText = lastUserMessage.text.toLowerCase();
            
            const requestKeywords = ['driver', 'software', 'game', 'app', 'tool', 'utility'];
            
            const isNewSoftwareDriverGameRequest = 
                requestKeywords.some(keyword => lowerCaseText.includes(keyword)) &&
                !lastUserMessage.text.startsWith('[CONTEXT:') &&
                lastBotMessage?.type !== 'driver-device-prompt' &&
                lastBotMessage?.type !== 'driver-device-selection';

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
        // --- End New Device Context Flow Logic ---

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
             return {
                text: "I'm sorry, I didn't get that. Could you please repeat your request?",
                type: 'standard',
            };
        }

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: deepseekSystemInstruction },
                    ...messages
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("DeepSeek API Error:", errorData);
            const errorText = errorData?.error?.message || "An unknown error occurred with the DeepSeek API.";
            if (response.status === 429) {
                 return { text: "DeepSeek API rate limit reached. Please wait a moment before trying again.", type: 'standard' };
            }
            return { text: `Sorry, an error occurred: ${errorText}`, type: 'standard' };
        }

        const data = await response.json();
        const rawText = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

        // --- Start of response adaptation logic ---
        let groundingChunks: GroundingChunk[] | undefined = undefined;
        let textForDisplay = rawText;

        const sourceRegex = /(?:\*Official Source\*|\*Guide\*|\*Video Guide\*|\*\*Official Page\*\*):\s*(https?:\/\/[^\s]+)/;
        const sourceMatch = rawText.match(sourceRegex);

        if (sourceMatch && sourceMatch[1]) {
            const url = sourceMatch[1];
            groundingChunks = [{ web: { uri: url, title: 'Official Source' } }];
            textForDisplay = rawText.replace(sourceRegex, '').trim();
        }
        // --- End of response adaptation logic ---

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
                if (parts.length > 2) platform = parts[2] as Platform;
            }
        }
        
        const displayText = textForDisplay.replace(/\[TYPE\]:\s*[\w-]+/, '').trim();

        return { text: displayText, groundingChunks, type, platform };

    } catch (error: any) {
        console.error("Error calling DeepSeek API:", error);
        return {
            text: "I'm sorry, but I've encountered a network error. Please check your connection and try again.",
            type: 'standard'
        };
    }
};