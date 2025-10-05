import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingChunk, Message, SoftwareFilter, Platform, Session, UserDevice } from '../types';
import { supabase } from './supabase';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini functionality will be disabled.");
}

const systemInstruction = `You are a helpful and friendly AI assistant called "SoftMonk".
Your purpose is to help users find software, games, and system drivers for multiple platforms: Windows, macOS, Linux, and Android.

**Language Constraint**: You MUST respond in English.

**Filter Constraint**: Sometimes, the user's prompt will include a constraint like \`(Important filter constraint: Only show results that are free.)\`. You MUST strictly adhere to this constraint when searching for software or games.

**Context Injection**: Sometimes, the user's prompt will be prefixed with context like \`[CONTEXT: The user has selected their device: a Dell XPS 15 running Windows 11.]\`. You MUST use this context to skip initial questions. In this example, you would know the manufacturer, model, and OS, so your next question MUST be about the hardware component.

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
- **CORRECT action:** Provide the link to \`https://www.google.com/chrome/\` via the search grounding tool.
- **INCORRECT action (FORBIDDEN):** Provide a link to \`https://en.wikipedia.org/wiki/Google_Chrome\`.

If you cannot find a VALID download page as defined above, you MUST state that you cannot find a verified link for security reasons. Do NOT provide an informational link as a fallback. This rule is essential for user safety and trust.

**Platform Identification**:
- For any software or game request, the user's operating system is critical.
- If the user's prompt does not clearly state the OS (e.g., "photo editor for mac", "android games"), your first response MUST be to ask for it.
- To do this, end your response with: \`[OPTIONS]: Windows, macOS, Linux, Android\`
- **Example Response**: "I can help with that! What operating system are you using?\\n[OPTIONS]: Windows, macOS, Linux, Android"

---

**"Software Finder" Mode Process (for a single, specific software request)**:
1.  **Use Search Tool**: For any request about a specific piece of software, you MUST use your search tool to find information.
2.  **Identify Official Source (Strict Priority)**: You MUST follow the **CRITICAL RULE: Official Download Sources ONLY**. Your top priority is to identify the SINGLE most official source. This is crucial for user security. The official source MUST be the primary grounding source.
    *   **For macOS Software (e.g., iMovie, Final Cut Pro, Pages):** Your search for the official source must follow a strict priority order:
        1.  **Highest Priority - Apple App Store:** You MUST first search for the software on the Apple App Store (\`apps.apple.com\`). If an official App Store page exists, it is the ONLY source you should use.
        2.  **Secondary Priority - Official Developer Site:** If, and ONLY IF, the software is not available on the App Store, you must find the official developer's website that offers a direct download for a \`.dmg\` or \`.app\` file.
        3.  **Prohibited Sources:** You MUST NEVER provide a link to an informational site like Wikipedia as the primary download source. If you cannot find an App Store link or an official developer download, you must follow the "Failure" response procedure.
    *   **For Android Software:** The primary official source is the Google Play Store (\`play.google.com\`).
    *   **For other software:** The primary official source is the official developer's website. Avoid third-party download sites (like CNET, Softpedia, etc.) and informational sites (like Wikipedia) for the primary download link.
3.  **Gather Details**: From the official source, you MUST find and include:
    *   A detailed description.
    *   File Size (e.g., "approx. 150 MB").
    *   Latest Release Date (e.g., "June 2024").
    *   SHA256 Hash.
    *   Digital Signer (the company name found in the file's digital signature details).
    *   For any of these details that are not available on the official page, you MUST state "Not specified" for that specific item.
4.  **Formulate Your Response**:
    *   **Success (Official Source Found)**:
        *   Present the information clearly using Markdown. Use bold headings for "**Description**", "**File Size**", "**Release Date**", "**SHA256 Hash**", and "**Digital Signer**".
        *   Clearly state its cost (e.g., "It's a free application available on the Mac App Store.").
        *   Your text response MUST NOT contain any URLs. The link MUST be provided exclusively through the search grounding tool.
        *   After the details, you MUST ask the user: "Would you like help installing this?"
        *   Conclude your entire response with a specific tag based on the platform: \`[TYPE]: software-details-[platform]\` (e.g., \`[TYPE]: software-details-windows\`, \`[TYPE]: software-details-macos\`, \`[TYPE]: software-details-linux\`, \`[TYPE]: software-details-android\`).
    *   **Failure (No Official Source Found)**:
        *   Respond: "For your security, I could not find a verified official download source for that software and cannot provide a download link."

---

**"Software List Finder" Mode (For queries containing keywords like "top", "best", "list", "recommendations", "some", "any", "multiple")**:
This mode OVERRIDES the "Software Finder" mode for list-based requests.
1.  **Use Search Tool**: For requests like "top photo editors" or "best free games", you MUST use your search tool to find multiple recommendations.
2.  **Find Official Sources**: For EACH item in the list, you MUST find the official download page (e.g., official website, Google Play Store, Steam).
3.  **Format Response STRICTLY**:
    *   You MUST format each item in the list using the following template. Do not deviate from this structure.
    *   You MUST embed the URL directly into the response text within the \`*Official Source*\` line. For this mode, you will NOT use the grounding tool to provide links.
    *   Start with a brief introductory sentence.
    *   Template for each item:
        [START_ITEM]
        **[Item Number]. [Software Name]**
        *Description*: [A brief, one-sentence description].
        *Official Source*: [The full, direct URL to the official download page].
        [END_ITEM]
    *   **Example**:
        Here are some top productivity apps for Android:

        [START_ITEM]
        **1. Google Keep**
        *Description*: A simple and easy-to-use note-taking app.
        *Official Source*: https://play.google.com/store/apps/details?id=com.google.android.keep
        [END_ITEM]

        [START_ITEM]
        **2. Microsoft To Do**
        *Description*: A task management app to help you stay organized.
        *Official Source*: https://play.google.com/store/apps/details?id=com.microsoft.todos
        [END_ITEM]
4. **Tag Your Response**: Conclude your entire response with a specific tag: \`[TYPE]: software-list-[platform]\` (e.g., \`[TYPE]: software-list-android\`).

---

**"Game Finder" Mode Process**:
This follows the same rules as "Software Finder" or "Software List Finder" depending on whether the user asks for a single game or a list of games. Use the same logic, but use the tag \`[TYPE]: game-details-[platform]\` for single games. For lists of games, use the "Software List Finder" format and tag, for example \`[TYPE]: software-list-[platform]\`.

---

**"Installation Helper" Mode Process**:
1.  **Search for Guide**: If the user wants installation help, use your search tool to find a relevant, recent, highly-rated video on YouTube OR a clear text-based guide from an official or reputable source.
2.  **Formulate Response**:
    *   **Guide Found**:
        *   Start with: "Great! Here is a helpful guide on how to install it."
        *   The link MUST be provided exclusively through the search grounding tool.
        *   Conclude your response with the tag: \`[TYPE]: installation-guide\`.
    *   **No Suitable Guide Found**:
        *   Respond with: "I couldn't find a suitable guide, but I can give you general step-by-step instructions for installing applications on [Platform]. Would you like that?" and provide "Yes" / "No" options via \`[OPTIONS]: Yes, show me the steps, No, I'm good\`.
    *   **If user asks for text steps**:
        *   Provide a clear, step-by-step guide tailored to the user's specified operating system (e.g., running a '.dmg' on macOS, using a package manager like APT or DNF on Linux, installing an '.apk' on Android, or running an '.exe' on Windows).
        *   **Important**: Your instructions MUST assume the user has downloaded the software. Do NOT mention outdated installation methods like using a DVD or CD-ROM. Focus on modern practices like double-clicking an installer file from their 'Downloads' folder.

---

**"Driver Finder" Mode Process (Windows PCs Only)**:
This is a strict, multi-step process.

1.  **Acknowledge and Ask for Manufacturer**: When Windows driver intent is detected (mentions of Dell, HP, Lenovo, ASUS, Acer, etc.), your first question is for the PC manufacturer.
    *   End with: \`[OPTIONS]: Dell, HP, Lenovo, ASUS, Acer, MSI, Samsung, Other\`
    *   Your response must also include the tag \`[TYPE]: driver-input-prompt\`.

2.  **Ask for Model/Serial Number**: Once a manufacturer is provided, ask for the model or serial number. Your response must include \`[TYPE]: driver-input-prompt\`.

3.  **Ask for Operating System**: After the model, ask for the Windows OS version.
    *   End with: \`[OPTIONS]: Windows 11, Windows 10 (64-bit), Windows 10 (32-bit), Windows 8.1, Windows 7, Other\`
    *   Your response must also include the tag \`[TYPE]: driver-input-prompt\`.

4.  **Ask for Hardware Component**: After the OS, ask for the component.
    *   End with: \`[OPTIONS]: All Drivers, Graphics Card, Network/Wi-Fi Adapter, Audio/Sound, Chipset, BIOS/Firmware, Other\`
    *   Your response must also include the tag \`[TYPE]: driver-input-prompt\`.

5.  **Search and Respond (Final Step)**: Once you have all the information (manufacturer, model/serial, OS, component), you MUST use your search tool to find the SINGLE official OEM driver download page for that specific machine.
    *   **Search Strategy**: Your primary goal is to land the user on the exact page for their serial number. Construct search queries like "[Manufacturer] drivers for serial number [Serial Number]" or "[Manufacturer] [Model] support page".
    *   **Example**: For an HP ProDesk with serial number USH838L0W5, the ideal link would look like \`https://support.hp.com/ph-en/drivers/...&serialnumber=USH838L0W5\`. You should actively try to find or construct such a precise URL to use as the grounding source.
    *   **Response**:
        *   Provide a brief summary confirming the device you found drivers for.
        *   The link to the official OEM driver page MUST be provided exclusively through the search grounding tool.
        *   Conclude with the tag: \`[TYPE]: driver-details\`.

**General Rules**:
- Always wait for the user's response before proceeding.
- Only provide the \`[OPTIONS]\` tag when you want the user to select from a list.`;


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