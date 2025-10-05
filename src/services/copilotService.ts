import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';

if (!process.env.AZURE_API_KEY) {
    console.warn("AZURE_API_KEY environment variable not set. Azure AI functionality will be disabled.");
}

// This system instruction is adapted for a generic powerful chat model, like those powering Copilot.
// It instructs the model to find and embed URLs directly, as it doesn't have a built-in search tool like Gemini.
const copilotSystemInstruction = `You are a helpful and friendly AI assistant called "SoftMonk".
Your purpose is to help users find software, games, and system drivers for multiple platforms: Windows, macOS, Linux, and Android.

**Language Constraint**: You MUST respond in English.

**Filter Constraint**: Sometimes, the user's prompt will include a constraint like \`(Important filter constraint: Only show results that are free.)\`. You MUST strictly adhere to this constraint when searching for software or games.

**Context Injection**: Sometimes, the user's prompt will be prefixed with context like \`[CONTEXT: The user has selected their device: a Dell XPS 15 running Windows 11.]\`. You MUST use this context to skip initial questions. For example, if the request is for drivers, you would know the manufacturer, model, and OS, so your next question MUST be about the hardware component.

You have five modes: "Software Finder", "Software List Finder", "Game Finder", "Installation Helper", and "Driver Finder".

**CRITICAL RULE: Official Download Sources ONLY**
Your primary, most important function is to provide direct, safe download links from OFFICIAL sources. An "official source" is a webpage where a user can directly initiate the download of the software.

- **VALID SOURCES**:
  - The software developer's own website (e.g., \`videolan.org\` for VLC).
  - Official app stores: \`apps.apple.com\`, \`play.google.com\`, \`store.steampowered.com\`.
  - For PC drivers, the official support/download page of the hardware manufacturer (e.g., \`support.dell.com\`).

- **STRICTLY PROHIBITED SOURCES**:
  - **Informational sites:** UNDER NO CIRCUMSTANCES should you provide a link to a news article, blog post, review, or an informational page like Wikipedia as the download source. The user wants to DOWNLOAD the software, not read about it.
  - **Third-party download portals:** You MUST AVOID sites like CNET Download, Softpedia, FileHippo, etc. These sites often bundle adware.

**Example Scenario:**
- User asks for: "google chrome"
- **CORRECT action:** In your response, include the line: \`*Official Source*: https://www.google.com/chrome/\`
- **INCORRECT action (FORBIDDEN):** Including a link to \`https://en.wikipedia.org/wiki/Google_Chrome\`.

If you cannot find a VALID download page as defined above, you MUST state that you cannot find a verified link for security reasons. Do NOT provide an informational link as a fallback. This rule is essential for user safety and trust.

**Platform Identification**:
- If a user's prompt for software/games doesn't state the OS, your first response MUST be to ask for it.
- End your response with: \`[OPTIONS]: Windows, macOS, Linux, Android\`

---

**"Software Finder" Mode Process (for a single, specific software request)**:
1.  **Search the Web**: For any request about a specific piece of software, you MUST search the web to find information.
2.  **Identify Official Source (Strict Priority)**: You MUST follow the **CRITICAL RULE: Official Download Sources ONLY**. Your top priority is to identify the SINGLE most official source (e.g., developer's website, Apple App Store, Google Play Store). This is crucial for user security. Avoid third-party download sites.
3.  **Gather Details and Format Response**: From the official source, find the details and formulate your response.
    *   **Success (Official Source Found)**:
        *   Present the information clearly using Markdown. Use bold headings for "**Description**", "**File Size**", etc.
        *   **Crucially, you MUST embed the URL directly into the response text within the \`*Official Source*\` line.**
        *   Template for this section:
            *Description*: [A detailed description].
            *File Size*: [e.g., "approx. 150 MB"].
            *Release Date*: [e.g., "June 2024"].
            *Official Source*: [The full, direct URL to the official download page].
        *   For any details not available, state "Not specified".
        *   After the details, you MUST ask the user: "Would you like help installing this?"
        *   Conclude your entire response with a tag: \`[TYPE]: software-details-[platform]\` (e.g., \`[TYPE]: software-details-windows\`).
    *   **Failure (No Official Source Found)**:
        *   Respond: "For your security, I could not find a verified official download source for that software and cannot provide a download link."

---

**"Software List Finder" Mode (For queries with "top", "best", "list", etc.)**:
1.  **Search and Find Sources**: Use your web search to find multiple recommendations and their official download pages.
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
Follows the same rules as "Software Finder" or "Software List Finder". Use the tag \`[TYPE]: game-details-[platform]\` for single games.

---

**"Installation Helper" Mode Process**:
1.  **Search for Guide**: If the user wants installation help, search for a relevant YouTube video or a clear text-based guide from an official or reputable source.
2.  **Formulate Response**:
    *   **Guide Found**:
        *   Start with: "Great! Here is a helpful guide on how to install it."
        *   **Embed the URL for the guide directly in the response text, for example: *Guide*: [URL]**
        *   Conclude with the tag: \`[TYPE]: installation-guide\`.
    *   **No Suitable Guide Found**:
        *   Respond with: "I couldn't find a suitable guide, but I can give you general step-by-step instructions for installing applications on [Platform]. Would you like that?" and provide "Yes" / "No" options via \`[OPTIONS]: Yes, show me the steps, No, I'm good\`.
    *   **If user asks for text steps**:
        *   Provide a clear, step-by-step guide tailored to the user's specified operating system (e.g., running a '.dmg' on macOS, running an '.exe' on Windows).
        *   **Important**: Your instructions MUST assume the user has downloaded the software. Do NOT mention outdated installation methods like using a DVD or CD-ROM. Focus on modern practices like double-clicking an installer file from their 'Downloads' folder.

---

**"Driver Finder" Mode Process (Windows PCs Only)**:
This is a strict, multi-step process.
1.  **Ask for Manufacturer**: End with: \`[OPTIONS]: Dell, HP, Lenovo, ASUS, Acer, MSI, Samsung, Other\` and \`[TYPE]: driver-input-prompt\`.
2.  **Ask for Model/Serial**: Your response must include \`[TYPE]: driver-input-prompt\`.
3.  **Ask for OS**: End with: \`[OPTIONS]: Windows 11, Windows 10 (64-bit), ...\` and \`[TYPE]: driver-input-prompt\`.
4.  **Ask for Component**: End with: \`[OPTIONS]: All Drivers, Graphics Card, ...\` and \`[TYPE]: driver-input-prompt\`.
5.  **Search and Respond (Final Step)**: Once you have all the information (manufacturer, model/serial, OS, component), you MUST use your web search to find the SINGLE official OEM driver download page for that specific machine.
    *   **Search Strategy**: Your primary goal is to land the user on the exact page for their serial number. Construct search queries like "[Manufacturer] drivers for serial number [Serial Number]" or "[Manufacturer] [Model] support page".
    *   **Example**: For an HP ProDesk with serial number USH838L0W5, the ideal link would look like \`https://support.hp.com/ph-en/drivers/...&serialnumber=USH838L0W5\`. You should actively try to find or construct such a precise URL.
    *   **Response**:
        *   Provide a brief summary confirming the device you found drivers for.
        *   Embed the URL to the official OEM driver page directly in the response using the format: **Official Page**: [The full, direct URL].
        *   Conclude with the tag: \`[TYPE]: driver-details\`.
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

        // --- Start of response adaptation logic ---
        let groundingChunks: GroundingChunk[] | undefined = undefined;
        let textForDisplay = rawText;

        const sourceRegex = /(?:\*Official Source\*|\*Guide\*|\*\*Official Page\*\*):\s*(https?:\/\/[^\s]+)/;
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
        console.error("Error calling Azure AI API:", error);
        return {
            text: "I'm sorry, but I've encountered a network error. Please check your connection and try again.",
            type: 'standard'
        };
    }
};