"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai_chat = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const openai_1 = require("openai");
// import * as cors from "cors";
// Initialize Admin
admin.initializeApp();
// CORS check
// const corsHandler = cors({ origin: true });
// Initialize OpenAI Client
const getOpenAIClient = () => {
    var _a;
    // Gen 1: Use config or env
    const config = functions.config();
    const apiKey = process.env.OPENAI_API_KEY || ((_a = config.openai) === null || _a === void 0 ? void 0 : _a.key);
    if (!apiKey) {
        throw new Error("OpenAI API Key is missing. Check functions config or secrets.");
    }
    return new openai_1.default({ apiKey });
};
// v1 Function Definition
exports.openai_chat = functions.runWith({
    secrets: ["OPENAI_API_KEY"],
    timeoutSeconds: 60,
    memory: "256MB"
}).https.onCall(async (data, context) => {
    const { history, filter } = data; // v1 destructuring
    if (!history || !Array.isArray(history)) {
        throw new functions.https.HttpsError('invalid-argument', 'The "history" argument is required.');
    }
    try {
        const openai = getOpenAIClient();
        const messages = history.map((msg) => ({
            role: (msg.sender === 'bot' ? 'assistant' : 'user'),
            content: msg.text || ""
        }));
        const systemPrompt = `You are SoftMonk, an AI assistant dedicated to direct, safe software downloads.
        Rules:
        1. Only recommend official sources.
        2. Verify platforms.
        3. Be concise.
        4. CURRENT FILTER: ${filter || 'all'}
        `;
        messages.unshift({ role: "system", content: systemPrompt });
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo",
            temperature: 0.7,
        });
        return {
            text: completion.choices[0].message.content || "No response.",
            type: 'standard',
            groundingChunks: []
        };
    }
    catch (error) {
        console.error("OpenAI Error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Generic error.');
    }
});
//# sourceMappingURL=index.js.map