import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Message, SoftwareFilter, Session, GroundingChunk, Platform, UserDevice } from '../types';
import { findInVendorMap, detectPlatform } from './vendorMapService';

export interface BotResponse {
    text: string;
    groundingChunks?: GroundingChunk[];
    type: Message['type'];
    platform?: Platform;
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
    // D. If it's a new query for drivers... (rest of the code unchanged)
    else if (session && isNewQuery) { // Added isNewQuery check to D to match logic structure
        const lowerCaseText = lastUserMessage.text.toLowerCase();
        const requestKeywords = ['driver', 'drivers'];
        if (requestKeywords.some(keyword => lowerCaseText.includes(keyword))) {
            const q = query(collection(db, 'user_devices'), where('user_id', '==', session.user.id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return { text: "I see you have some saved devices. Are you searching for one of them?\n[OPTIONS]: Yes, for a saved device; No, for something else", type: 'driver-device-prompt' };
            }
        }
    }

    // E. Handle the saved device selection flow
    if (session && lastUserMessage) {
        if (lastUserMessage.text === 'Yes, for a saved device' && lastBotMessage?.type === 'driver-device-prompt') {
            const q = query(collection(db, 'user_devices'), where('user_id', '==', session.user.id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const devices = snapshot.docs.map(d => d.data() as UserDevice);
                const deviceOptions = devices.map(d => `${d.device_name} (${d.manufacturer} ${d.model})`).join(', ');
                return { text: `Great! Which device is it for?\n[OPTIONS]: ${deviceOptions}`, type: 'driver-device-selection' };
            }
        }

        if (lastBotMessage?.type === 'driver-device-selection') {
            const q = query(collection(db, 'user_devices'), where('user_id', '==', session.user.id));
            const snapshot = await getDocs(q);
            const devices = snapshot.docs.map(d => d.data() as UserDevice);
            const selectedDevice = devices?.find((d: UserDevice) => lastUserMessage.text.startsWith(d.device_name));

            if (selectedDevice) {
                const originalRequestMessage = historyCopy.findLast((m: Message) => m.sender === 'user' && m.type !== 'driver-device-selection' && m.text !== 'Yes, for a saved device');

                if (originalRequestMessage) {
                    const context = `[CONTEXT: The user has selected their device: a ${selectedDevice.manufacturer} ${selectedDevice.model} running ${selectedDevice.os}.]`;
                    lastUserMessage.text = `${context}\n\nBased on this context, please process my original request: "${originalRequestMessage.text}"`;
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

        // Post-processing: Inject verified URL if AI didn't return one (or even if it did, ours is safer)
        if (verifiedPreDetectedUrl) {
            if (!data.groundingChunks) data.groundingChunks = [];

            // Check if this URL is already there to avoid duplicates
            const alreadyExists = data.groundingChunks.some(chunk => chunk.web.uri === verifiedPreDetectedUrl);

            if (!alreadyExists) {
                data.groundingChunks.unshift({
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

        return data;

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