import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import * as cors from "cors";

admin.initializeApp();
const corsHandler = cors({ origin: true });

// Initialize OpenAI Client
// Note: We access the API key via Firebase config functions.config().openai.key
// Use: firebase functions:config:set openai.key="YOUR_API_KEY"
const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY || functions.config().openai?.key;
    if (!apiKey) {
        throw new Error("OpenAI API Key is missing. Set it via 'firebase functions:config:set openai.key=...' or env vars.");
    }
    return new OpenAI({ apiKey });
};

export const openai_chat = functions.https.onCall(async (data, context) => {
    const { history, filter } = data;

    if (!history || !Array.isArray(history)) {
        throw new functions.https.HttpsError('invalid-argument', 'The "history" argument is required and must be an array of messages.');
    }

    // Rate limiting / Auth check (optional but recommended)
    // if (!context.auth) {
    //     throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    try {
        const openai = getOpenAIClient();

        // Convert our app's Message format to OpenAI's format
        const messages = history.map((msg: any) => ({
            role: msg.sender === 'bot' ? 'assistant' : 'user',
            content: msg.text
        }));

        // Add System Prompt
        const systemPrompt = `You are SoftMonk, an AI assistant dedicated to direct, safe software downloads.
        Your goal is to provide official, malware-free download links.
        
        Rules:
        1. Only recommend official sources.
        2. If a user asks for "VS Code", verify the platform (Windows, Mac, Linux).
        3. Be concise and friendly.
        4. CURRENT FILTER: ${filter || 'all'}
        `;

        messages.unshift({ role: "system", content: systemPrompt });

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo", // or gpt-4
            temperature: 0.7,
        });

        const responseText = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";

        return {
            text: responseText,
            type: 'standard',
            groundingChunks: [] // Advanced: Add real search grounding here if available
        };

    } catch (error: any) {
        console.error("OpenAI Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'An error occurred while communicating with OpenAI.');
    }
});
