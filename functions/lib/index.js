"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai_chat = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const openai_1 = require("openai");
const cors = require("cors");
// Initialize Admin
admin.initializeApp();
// CORS is handled automatically by onCall, but good to have the import if needed.
const corsHandler = cors({ origin: true });
console.log("CORS init:", !!corsHandler);
// Initialize OpenAI Client
const getOpenAIClient = () => {
    var _a;
    // STARTUP CHECK: We need to see if the user set it via config or secret
    // Cast to any to avoid "never" type error on config
    const config = functions.config();
    // Check for v2 params style secret used in v1 (process.env.OPENAI_API_KEY)
    // or fallback to config validation
    const apiKey = process.env.OPENAI_API_KEY || ((_a = config.openai) === null || _a === void 0 ? void 0 : _a.key);
    if (!apiKey) {
        throw new Error("OpenAI API Key is missing.");
    }
    return new openai_1.default({ apiKey });
};
// v1 Function Definition
// Note: We use runWith({ secrets: ... }) to access the secret we just set!
exports.openai_chat = functions.runWith({
    secrets: ["OPENAI_API_KEY"]
}).https.onCall(async (data, context) => {
    // const { history, filter } = data; // v1 puts data directly in the first arg
    const history = data.history;
    const filter = data.filter;
    if (!history || !Array.isArray(history)) {
        throw new functions.https.HttpsError('invalid-argument', 'The "history" argument is required and must be an array of messages.');
    }
    try {
        const openai = getOpenAIClient();
        // Convert our app's Message format to OpenAI's format
        const messages = history.map((msg) => ({
            role: (msg.sender === 'bot' ? 'assistant' : 'user'),
            content: msg.text || ""
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
            model: "gpt-3.5-turbo",
            temperature: 0.7,
        });
        const responseText = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
        return {
            text: responseText,
            type: 'standard',
            groundingChunks: [] // Advanced: Add real search grounding here if available
        };
    }
    catch (error) {
        console.error("OpenAI Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'An error occurred while communicating with OpenAI.');
    }
});
//# sourceMappingURL=index.js.map