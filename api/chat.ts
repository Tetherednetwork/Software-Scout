import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import knowledgeBase from './tech_knowledge.json';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper to find software by keyword (Simple Vector Search Proxy)
// In production, use Pinecone/Embeddings
function findSoftwareCandidate(userText: string) {
    const text = userText.toLowerCase();
    // Simple relevance score based on keyword match
    const candidates = knowledgeBase.map(item => {
        let score = 0;
        if (text.includes(item.name.toLowerCase())) score += 10;
        item.keywords.forEach(k => {
            if (text.includes(k.toLowerCase())) score += 3;
        });
        return { item, score };
    });

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    // Return if high confidence
    if (candidates[0].score > 2) return candidates[0].item;
    return null;
}

// Helper to determine what we already know from the conversation
async function extractContext(history: any[]) {
    // We send the conversation to OpenAI to extract entities
    // This is the "Technician's Notebook"

    // Simplification: We look at the LAST few messages.
    const recentHistory = history.slice(-6); // last 6 turns

    const extractionPrompt = `
    You are an AI Data Extractor for a PC Technician.
    Analyze the conversation and extract:
    1. The software name the user wants (if any).
    2. The OS Version (e.g. Windows 10, macOS Ventura).
    3. Architecture (64-bit/32-bit).
    4. GPU Model (if mentioned).
    
    Return JSON ONLY:
    {
      "software_name": "string or null",
      "os_version": "string or null",
      "arch": "string or null",
      "gpu_model": "string or null"
    }
    `;

    const messages: any[] = recentHistory.map((m: any) => ({
        role: m.sender === 'bot' ? 'assistant' : 'user',
        content: m.text || ""
    }));

    messages.push({ role: "system", content: extractionPrompt });

    const completion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-3.5-turbo",
        temperature: 0,
        response_format: { type: "json_object" }
    });

    try {
        return JSON.parse(completion.choices[0].message.content || "{}");
    } catch (e) {
        return {};
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

    const { history } = req.body;
    const lastUserMessage = history[history.length - 1];
    const userText = lastUserMessage.text;

    try {
        // 1. Identify Candidate Software (Heuristic or Extraction)
        // First checks extracting from AI, if null, checks keywords.
        const context = await extractContext(history);
        let candidate = null;

        if (context.software_name) {
            // Find in KB
            const match = knowledgeBase.find(k => k.name.toLowerCase().includes(context.software_name.toLowerCase()) || context.software_name.toLowerCase().includes(k.name.toLowerCase()));
            if (match) candidate = match;
        }

        if (!candidate) {
            candidate = findSoftwareCandidate(userText);
        }

        // 2. Technician Logic
        if (candidate) {
            // We know what they want. Do we have the required fields?
            const requirements = candidate.required_fields;
            let missingField = null;

            for (const field of requirements) {
                // Check if context has this field
                // Mapping: KB field -> Context key
                // 'os_version' -> context.os_version
                // 'arch' -> context.arch
                // 'gpu_model' -> context.gpu_model

                if (!context[field as keyof typeof context]) {
                    missingField = field;
                    break;
                }
            }

            if (missingField) {
                // Ask the question!
                let question = "";
                switch (missingField) {
                    case "os_version":
                        question = `For ${candidate.name}, I need to know your Operating System version. Are you on Windows 10, Windows 11, macOS, or Linux?`;
                        break;
                    case "arch":
                        question = `Is your system 64-bit or 32-bit?`;
                        break;
                    case "gpu_model":
                        question = `To get the right driver, I need your Graphics Card model (e.g. RTX 3060, GTX 1650).`;
                        break;
                    default:
                        question = `I also need to know: ${missingField}`;
                }

                return res.status(200).json({
                    text: question,
                    type: 'standard',
                    groundingChunks: []
                });

            } else {
                // All fields present!
                // Give the solution.
                const solution = `I have confirmed you need ${candidate.name} for ${context.os_version} (${context.arch || 'Standard'}). \n\nHere is your official download link: ${candidate.download_pattern}`;
                return res.status(200).json({
                    text: solution,
                    type: 'standard',
                    groundingChunks: []
                });
            }

        } else {
            // 3. Fallback: General AI Chat (Technician Persona)
            // If we don't know the software, just act helpful.
            const messages = history.map((msg: any) => ({
                role: (msg.sender === 'bot' ? 'assistant' : 'user') as 'assistant' | 'user' | 'system',
                content: msg.text || ""
            }));

            const systemPrompt = `You are SoftMonk, a senior PC technician.
            The user is asking generally.
            Be helpful, concise, and professional.
            If they ask for software, ask them specifically which one.
            `;
            messages.unshift({ role: "system", content: systemPrompt });

            const completion = await openai.chat.completions.create({
                messages: messages,
                model: "gpt-3.5-turbo",
                temperature: 0.7,
            });

            return res.status(200).json({
                text: completion.choices[0].message.content,
                type: 'standard',
                groundingChunks: []
            });
        }

    } catch (error: any) {
        console.error("Technician Error:", error);
        res.status(500).json({ error: error.message || 'Error processing request' });
    }
}
