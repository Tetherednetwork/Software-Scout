// import { db } from './firebase'; // Removed unused import to fix TS6133
import type { Message, SoftwareFilter, Session, GroundingChunk, Platform, SavedDevice } from '../types';
import { findInVendorMap, detectPlatform } from './vendorMapService';
import { dbService } from './dbService';

export interface BotResponse {
    text: string;
    groundingChunks?: GroundingChunk[];
    type: Message['type'];
    platform?: Platform;
    suggestedDevice?: Partial<SavedDevice>;
}

/**
 * A central function to call our secure backend AI service (a Firebase Cloud Function).
 * It includes client-side pre-processing to improve UX, such as handling saved devices and clarifying software.
 *
 * @param history - The current chat history.
 * @param filter - The active software filter.
 * @param session - The user's current session, or null if not logged in.
 * @returns A promise that resolves to the bot's response.
 */
export const findSoftware = async (
    history: Message[],
    filter: SoftwareFilter,
    session: Session | null
): Promise<BotResponse> => {

    // Create a mutable copy of the history for this request
    const historyCopy = JSON.parse(JSON.stringify(history));
    const lastUserMessage = historyCopy[historyCopy.length - 1];
    const lastBotMessage = [...historyCopy].reverse().find((m: Message) => m.sender === 'bot');

    // --- START: Client-side pre-processing logic for better UX ---
    // We will capture any verified URL found during this phase to ensure it's returned to the UI
    let verifiedPreDetectedUrl: string | undefined;

    // A. Handle response to a platform selection prompt
    if (lastBotMessage?.type === 'platform-prompt') {
        const platform = detectPlatform(lastUserMessage.text);
        const originalRequestMessage = historyCopy.filter((m: Message) => m.sender === 'user').slice(-2, -1)[0];
        // Match both "I found" (direct) and "Great! For" (clarified) patterns
        const softwareNameMatch = lastBotMessage.text.match(/(?:I found|Great! For) "(.*?)"/);
        if (platform && originalRequestMessage && softwareNameMatch) {
            const softwareName = softwareNameMatch[1];
            const foundSoftwareList = await findInVendorMap(softwareName);
            if (foundSoftwareList.length > 0) {
                const software = foundSoftwareList[0];
                const urlKey = platform === 'macos' ? 'mac' : platform;
                const url = software[urlKey as keyof typeof software];
                if (url) {
                    verifiedPreDetectedUrl = url;
                    const context = `[CONTEXT: A verified link for "${software.name}" for ${platform} was found: ${url}. You MUST use this as the official source. Do not search for another link.]`;
                    lastUserMessage.text = `${context}\n\nOriginal request: "${originalRequestMessage.text}"`;
                    // Now let it fall through to the backend call with the new context
                }
            }
        }
    }

    // B. Handle response to a software clarification prompt
    if (lastBotMessage?.type === 'software-clarification-prompt') {
        const selectedSoftwareName = lastUserMessage.text;
        const foundSoftwareList = await findInVendorMap(selectedSoftwareName);
        if (foundSoftwareList && foundSoftwareList.length > 0) {
            const singleMatch = foundSoftwareList[0];
            const availablePlatforms = ['windows', 'mac', 'linux', 'android']
                .filter(p => singleMatch[p as keyof typeof singleMatch])
                .map(p => p === 'mac' ? 'macOS' : p.charAt(0).toUpperCase() + p.slice(1));

            if (availablePlatforms.length > 0) {
                return {
                    text: `Great! For "${singleMatch.name}", which operating system do you need?\n[OPTIONS]: ${availablePlatforms.join(', ')}`,
                    type: 'platform-prompt',
                };
            }
        }
    }

    // C. Check if this is a new query that can be handled locally first
    const isNewQuery = !lastUserMessage.text.startsWith('[CONTEXT:') && (!lastBotMessage || !['driver-input-prompt', 'driver-device-prompt', 'driver-device-selection', 'platform-prompt', 'software-clarification-prompt'].includes(lastBotMessage.type || ''));

    if (isNewQuery) {
        // Attempt to find a match in our verified software map
        const foundSoftwareList = await findInVendorMap(lastUserMessage.text);
        if (foundSoftwareList && foundSoftwareList.length > 0) {
            // If multiple matches, ask user to clarify
            if (foundSoftwareList.length > 1) {
                const softwareOptions = foundSoftwareList.map(s => s.name).join(', ');
                return {
                    text: `I found a couple of potential matches for that. Which one are you looking for?\n[OPTIONS]: ${softwareOptions}`,
                    type: 'software-clarification-prompt',
                };
            }

            // If single match, check if we know the platform to provide context to the AI
            const singleMatch = foundSoftwareList[0];
            const platform = detectPlatform(lastUserMessage.text);
            if (platform) {
                const urlKey = platform === 'macos' ? 'mac' : platform;
                const url = singleMatch[urlKey as keyof typeof singleMatch];
                if (url) {
                    verifiedPreDetectedUrl = url;
                    const context = `[CONTEXT: A verified link for "${singleMatch.name}" for ${platform} was found: ${url}. You MUST use this as the official source. Do not search for another link.]`;
                    lastUserMessage.text = `${context}\n\nOriginal request: "${lastUserMessage.text}"`;
                }
            } else {
                // If we don't know the platform, ask the user
                const availablePlatforms = ['windows', 'mac', 'linux', 'android']
                    .filter(p => singleMatch[p as keyof typeof singleMatch])
                    .map(p => p === 'mac' ? 'macOS' : p.charAt(0).toUpperCase() + p.slice(1));

                if (availablePlatforms.length > 0) {
                    return {
                        text: `I found "${singleMatch.name}". Which operating system do you need it for?\n[OPTIONS]: ${availablePlatforms.join(', ')}`,
                        type: 'platform-prompt',
                    };
                }
            }
        }
    }
    // D. Check for Drivers + Saved Device Context match
    // Only verify if we haven't already just finished a prompt
    const isPromptResponse = lastBotMessage && ['driver-input-prompt', 'driver-device-prompt', 'driver-device-selection'].includes(lastBotMessage.type || '');

    if (session && !isPromptResponse && isNewQuery) {
        const lowerCaseText = lastUserMessage.text.toLowerCase();
        // Driver intent detection
        const driverKeywords = ['driver', 'drivers', 'bios', 'firmware', 'update'];
        if (driverKeywords.some(keyword => lowerCaseText.includes(keyword))) {
            // Use dbService for consistency
            const { data: devices } = await dbService.getUserDevices(session.user.id);
            if (devices && devices.length > 0) {
                return {
                    text: "I see you have saved devices in your profile. Is this request for one of them?",
                    type: 'driver-device-prompt' // UI can render a Yes/No or Device Picker here
                };
            }
        }
    }

    // E. Handle the saved device selection flow
    if (session && lastUserMessage && lastBotMessage) {
        // User answered "Yes" or selected "Saved Device" logic
        // We assume the UI sends specific text or we treat "Yes" generally
        if (lastBotMessage.type === 'driver-device-prompt') {
            const text = lastUserMessage.text.toLowerCase();
            if (text.includes('yes') || text.includes('saved device')) {
                const { data: devices } = await dbService.getUserDevices(session.user.id);
                if (devices && devices.length > 0) {
                    const deviceOptions = devices.map(d => `${d.name} (${d.brand} ${d.model})`).join('; ');
                    return {
                        text: `Great! Which device is it for?\n[OPTIONS]: ${deviceOptions}`,
                        type: 'driver-device-selection'
                    };
                }
            }
        }

        // User picked a specific device
        if (lastBotMessage.type === 'driver-device-selection') {
            const { data: devices } = await dbService.getUserDevices(session.user.id);
            const selectedDevice = devices?.find((d: SavedDevice) => lastUserMessage.text.includes(d.name) || lastUserMessage.text.includes(d.model));

            if (selectedDevice) {
                // Find original request to append context
                // We go back 2 user messages usually (1. Request, 2. "Yes", 3. "Device Name") - imprecise, better to search back.
                const originalRequestMessage = [...historyCopy].reverse().find((m: Message) =>
                    m.sender === 'user' &&
                    !m.text.includes('Yes') &&
                    !m.text.includes(selectedDevice.name) &&
                    m.type !== 'driver-device-selection'
                );

                if (originalRequestMessage) {
                    // CRITICAL: Slot-Filling Injection
                    const context = `
[SYSTEM CONTEXT: The user selected a saved device.]
Device: ${selectedDevice.brand} ${selectedDevice.model}
OS: ${selectedDevice.os_family} ${selectedDevice.os_version || ''}
Serial: ${selectedDevice.serial_number || 'Unknown'}

TASK: Fulfill the user's driver request ("${originalRequestMessage.text}") for this specific device. 
1. If you need the specific driver type (e.g. Wi-Fi vs Audio), ASK for it.
2. If you have enough info, provide the verified download link immediately.
3. If the driver requires a Serial Number and checking the portal, ask for it ONLY if missing.
`;
                    lastUserMessage.text = `${context}\n\nUser Selection: "${selectedDevice.name}"`;
                }
            }
        }
    }
    // --- END: Client-side pre-processing logic ---

    // F. Resilience: Input Validation
    if (!historyCopy || historyCopy.length === 0) {
        console.warn("findSoftware called with empty history");
        return { text: "I didn't catch that. Could you say it again?", type: 'standard' };
    }

    // Switch to Vercel API Route
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history: historyCopy, filter }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `HTTP error ${response.status}`);
        }

        const data: BotResponse = await response.json();
        const rawText = data.text || ''; // Ensure text is string

        let groundingChunks: GroundingChunk[] | undefined = data.groundingChunks;
        let textForDisplay = rawText;
        let suggestedDevice: Partial<SavedDevice> | undefined = undefined;

        // 1. Parsing Links
        const downloadLinkRegex = /\[DOWNLOAD_LINK\](https?:\/\/[^\[\]\s]+)\[\/DOWNLOAD_LINK\]/;
        const downloadMatch = rawText.match(downloadLinkRegex);

        const videoLinkRegex = /\[VIDEO_LINK\](https?:\/\/[^\[\]\s]+)\[\/VIDEO_LINK\]/;
        const videoMatch = rawText.match(videoLinkRegex);

        // 2. Parsing Detected Device Data (New Feature)
        const deviceDataRegex = /\[DETECTED_DEVICE_DATA\](.*?)\[\/DETECTED_DEVICE_DATA\]/;
        const deviceMatch = rawText.match(deviceDataRegex);

        if (deviceMatch && deviceMatch[1]) {
            try {
                suggestedDevice = JSON.parse(deviceMatch[1]);
                textForDisplay = textForDisplay.replace(deviceDataRegex, '').trim();
            } catch (e) {
                console.warn("Failed to parse detected device data:", e);
            }
        }

        if (downloadMatch && downloadMatch[1]) {
            const url = downloadMatch[1];
            if (!groundingChunks) groundingChunks = [];
            // Dedup
            if (!groundingChunks.some(g => g.web.uri === url)) {
                groundingChunks.unshift({ web: { uri: url, title: 'Official Source' } });
            }
            textForDisplay = textForDisplay.replace(downloadLinkRegex, '').trim();
        } else if (videoMatch && videoMatch[1]) {
            const url = videoMatch[1];
            if (!groundingChunks) groundingChunks = [];
            groundingChunks.push({ web: { uri: url, title: 'Video Guide' } });
            textForDisplay = textForDisplay.replace(videoLinkRegex, '').trim();
        }

        // Post-processing: Inject verified URL if AI didn't return one (or even if it did, ours is safer)
        if (verifiedPreDetectedUrl) {
            if (!groundingChunks) groundingChunks = [];

            // Check if this URL is already there to avoid duplicates
            const alreadyExists = groundingChunks.some(chunk => chunk.web.uri === verifiedPreDetectedUrl);

            if (!alreadyExists) {
                groundingChunks.unshift({
                    web: {
                        uri: verifiedPreDetectedUrl,
                        title: "Official Verified Source"
                    }
                });
            }

            // Force type to software to ensure UI handles it with maximum feature set (like the Yes/No prompts if applicable)
            // specific types like 'driver' or 'game' should probably remain if AI set them, but for 'standard' we upgrade.
            if (data.type === 'standard') {
                data.type = 'software';
            }
        }

        // Return cleaned response with suggestedDevice
        return {
            ...data,
            text: textForDisplay,
            groundingChunks,
            suggestedDevice
        };

    } catch (error: any) {
        console.error("AI Service Error:", error);

        // Resilience: Friendly Error Fallback
        // Check for specific Firebase error codes if possible, or network/timeout issues.
        let friendlyMessage = "I'm having a little trouble connecting to my brain right now. Please give me a moment and try again.";

        if (error.code === 'functions/unavailable' || error.message.includes('network')) {
            friendlyMessage = "I'm having trouble connecting to the internet. Please check your connection.";
        } else {
            // Debug: Show actual error
            friendlyMessage = `System Debug Error: ${error.message}. Please verify Vercel API Route configuration and OpenAI Key Settings.`;
        }

        return {
            text: friendlyMessage,
            type: 'standard'
        };
    }
};