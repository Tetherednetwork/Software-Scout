import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize OpenAI Client
// Vercel will inject OPENAI_API_KEY from Environment Variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS check (Optional, Vercel handling or use logic)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const { history, filter } = req.body;

    if (!history || !Array.isArray(history)) {
        res.status(400).json({ error: 'The "history" argument is required.' });
        return;
    }

    try {
        const messages = history.map((msg: any) => ({
            role: (msg.sender === 'bot' ? 'assistant' : 'user') as 'assistant' | 'user' | 'system',
            content: msg.text || ""
        }));

        const systemPrompt = `You are SoftMonk, an AI assistant dedicated to direct, safe software downloads.
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

        const responseText = completion.choices[0].message.content || "No response.";

        res.status(200).json({
            text: responseText,
            type: 'standard',
            groundingChunks: []
        });

    } catch (error: any) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: error.message || 'Error communicating with OpenAI' });
    }
}
