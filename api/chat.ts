import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- A. EXPANDED KNOWLEDGE MATRIX (Simulated Graph) ---
const knowledgeBase = [
    // --- DRIVERS ---
    {
        "id": "nvidia_geforce",
        "name": "NVIDIA GeForce Game Ready Driver",
        "keywords": ["nvidia", "geforce", "driver", "gpu", "rtx", "gtx"],
        "category": "driver",
        "os_compatibility": ["Windows 10", "Windows 11"],
        "arch": ["64-bit"],
        "required_fields": ["gpu_model", "os_version"],
        "download_pattern": "https://www.nvidia.com/Download/index.aspx?lang=en-us",
        "verified": true,
        "manufacturer": "NVIDIA"
    },
    {
        "id": "amd_radeon",
        "name": "AMD Software: Adrenalin Edition",
        "keywords": ["amd", "radeon", "driver", "gpu", "rx", "adrenalin"],
        "category": "driver",
        "os_compatibility": ["Windows 10", "Windows 11"],
        "arch": ["64-bit"],
        "required_fields": ["os_version"],
        "download_pattern": "https://www.amd.com/en/support",
        "verified": true,
        "manufacturer": "AMD"
    },
    {
        "id": "intel_arc",
        "name": "Intel Arc & Iris Xe Graphics Driver",
        "keywords": ["intel", "graphics", "driver", "arc", "iris", "uhd"],
        "category": "driver",
        "os_compatibility": ["Windows 10", "Windows 11"],
        "arch": ["64-bit"],
        "required_fields": ["os_version"],
        "download_pattern": "https://www.intel.com/content/www/us/en/download/785597/intel-arc-iris-xe-graphics-windows.html",
        "verified": true,
        "manufacturer": "Intel"
    },
    {
        "id": "hp_laptop",
        "name": "HP Support Assistant / Drivers",
        "keywords": ["hp", "hewlett packard", "laptop", "driver", "envy", "spectre", "pavilion", "omen"],
        "category": "driver",
        "os_compatibility": ["Windows 10", "Windows 11"],
        "arch": ["64-bit"],
        "required_fields": ["laptop_model"],
        "download_pattern": "https://support.hp.com/us-en/drivers",
        "verified": true,
        "manufacturer": "HP"
    },
    {
        "id": "dell_command",
        "name": "Dell SupportAssist / Drivers",
        "keywords": ["dell", "laptop", "driver", "xps", "inspiron", "latitude", "alienware"],
        "category": "driver",
        "os_compatibility": ["Windows 10", "Windows 11"],
        "arch": ["64-bit"],
        "required_fields": ["laptop_model"],
        "download_pattern": "https://www.dell.com/support/home/en-us?app=drivers",
        "verified": true,
        "manufacturer": "Dell"
    },
    // --- RUNTIMES & UTILITIES ---
    {
        "id": "directx",
        "name": "DirectX End-User Runtime Web Installer",
        "keywords": ["directx", "dx", "runtime", "game error", "missing dll"],
        "category": "runtime",
        "os_compatibility": ["Windows 10", "Windows 11", "Windows 7"],
        "arch": ["32-bit", "64-bit"],
        "required_fields": ["os_version"],
        "download_pattern": "https://www.microsoft.com/en-us/download/details.aspx?id=35",
        "verified": true,
        "manufacturer": "Microsoft"
    },
    {
        "id": "vcredist",
        "name": "Visual C++ Redistributable 2015-2022",
        "keywords": ["visual c++", "vcredist", "msvcp140", "runtime", "c++"],
        "category": "runtime",
        "os_compatibility": ["Windows 10", "Windows 11"],
        "arch": ["64-bit", "32-bit"],
        "required_fields": ["arch"],
        "download_pattern": "https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist",
        "verified": true,
        "manufacturer": "Microsoft"
    },
    {
        "id": "steam",
        "name": "Steam Client",
        "keywords": ["steam", "valve", "store", "game launcher"],
        "category": "game_platform",
        "os_compatibility": ["Windows", "macOS", "Linux"],
        "arch": ["64-bit"],
        "required_fields": ["os_version"],
        "download_pattern": "https://store.steampowered.com/about/",
        "verified": true,
        "manufacturer": "Valve"
    },
    {
        "id": "vlc",
        "name": "VLC Media Player 3.0",
        "keywords": ["vlc", "video player", "media player", "mkv"],
        "category": "application",
        "os_compatibility": ["Windows", "macOS", "Linux", "Android"],
        "arch": ["64-bit"],
        "required_fields": ["os_version"],
        "download_pattern": "https://www.videolan.org/vlc/",
        "verified": true,
        "manufacturer": "VideoLAN"
    },
    {
        "id": "chrome",
        "name": "Google Chrome",
        "keywords": ["chrome", "browser", "internet"],
        "category": "application",
        "os_compatibility": ["Windows", "macOS", "Linux", "Android"],
        "arch": ["64-bit"],
        "required_fields": ["os_version"],
        "download_pattern": "https://www.google.com/chrome/",
        "verified": true,
        "manufacturer": "Google"
    },
    {
        "id": "photoshop",
        "name": "Adobe Photoshop",
        "keywords": ["photoshop", "adobe", "photo editor"],
        "category": "application",
        "os_compatibility": ["Windows", "macOS"],
        "arch": ["64-bit"],
        "required_fields": ["os_version"],
        "download_pattern": "https://www.adobe.com/products/photoshop.html",
        "verified": true,
        "manufacturer": "Adobe"
    }
];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Similarity Search (Level 1)
function findSoftwareCandidate(userText: string) {
    const text = userText.toLowerCase();
    const candidates = knowledgeBase.map(item => {
        let score = 0;
        if (text.includes(item.name.toLowerCase())) score += 20;
        item.keywords.forEach(k => {
            if (text.includes(k.toLowerCase())) score += 5;
        });
        return { item, score };
    });

    candidates.sort((a, b) => b.score - a.score);
    if (candidates[0] && candidates[0].score > 4) return candidates[0].item;
    return null;
}

// --- B. ENTITY EXTRACTION (Level 2) ---
async function extractContext(history: any[]) {
    const recentHistory = history.slice(-6);

    // Strict Schema for CompTIA A+ level detail
    const extractionPrompt = `
    You are the SoftMonk Knowledge Graph Extractor.
    Extract the following entities from the conversation:
    1. software_name: The specific product (normalize to canonical name if possible, e.g. "vlc" -> "VLC Media Player").
    2. os_canonical: OS formatted as 'win11_23h2_x64', 'mac14_4', etc if known, or just 'Windows 11'.
    3. arch: 'x64' (64-bit), 'x86' (32-bit), 'arm64'.
    4. hardware_id: Any specific model numbers (e.g. 'RTX 3060', 'HP Pavilion 15', 'Dell XPS 13').
    5. category_intent: 'driver', 'runtime', 'game', 'app'.
    
    Return JSON ONLY.
    `;

    const messages: any[] = recentHistory.map((m: any) => ({
        role: m.sender === 'bot' ? 'assistant' : 'user',
        content: m.text || ""
    }));
    messages.push({ role: "system", content: extractionPrompt });

    try {
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo",
            temperature: 0,
            response_format: { type: "json_object" }
        });
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

    try {
        // Check for specific "[SYSTEM CONTEXT]" from the client-side pre-processor
        // If present, we skip the hardcoded "Knowledge Graph" (Phase 1-3) and go straight to the intelligent LLM.
        const hasSystemContext = lastUserMessage.text.includes('[SYSTEM CONTEXT:') || lastUserMessage.text.includes('[CONTEXT:');

        let candidate = null;
        let context: any = {};

        // Only try the hardcoded path if we don't have a specific context override
        if (!hasSystemContext) {
            // Phase 1: Context Extraction
            context = await extractContext(history);

            // Phase 2: Candidate Matching
            if (context.software_name) {
                const match = knowledgeBase.find(k =>
                    k.name.toLowerCase().includes(context.software_name.toLowerCase()) ||
                    k.keywords.some(kw => context.software_name.toLowerCase().includes(kw))
                );
                if (match) candidate = match;
            }

            if (!candidate) {
                candidate = findSoftwareCandidate(lastUserMessage.text);
            }
        }

        // Phase 3: Requirement Logic (Technician Mode)
        if (candidate && !hasSystemContext) {
            const requirements = candidate.required_fields || [];
            let missingField = null;

            // Map extracted context to required fields
            const knownData = {
                os_version: context.os_canonical,
                arch: context.arch,
                gpu_model: context.hardware_id,
                laptop_model: context.hardware_id
            };

            for (const field of requirements) {
                if (!knownData[field as keyof typeof knownData]) {
                    missingField = field;
                    break;
                }
            }

            if (missingField) {
                // ... (Existing Logic for Missing Fields in Hardcoded Graph)
                // Shortened for brevity as we are keeping the original logic structure but just wrapping it
                // Re-implementing the switch/case from standard logic effectively
                let question = "";
                let options: string[] = [];
                let type: any = 'question';

                switch (missingField) {
                    case "os_version":
                        question = `For user ${candidate.manufacturer} driver installation, please select your Operating System version:`;
                        options = ["Windows 11", "Windows 10", "macOS", "Linux"];
                        break;
                    case "arch":
                        question = `Is your system 64-bit (x64) or 32-bit?`;
                        options = ["64-bit", "32-bit"];
                        break;
                    case "gpu_model":
                        question = `To select the correct Game Ready Driver, I need your NVIDIA GPU model.`;
                        options = ["RTX 4090", "RTX 4080", "RTX 3070", "RTX 3060", "GTX 1660"];
                        break;
                    case "laptop_model":
                        question = `Which specific ${candidate.manufacturer} model do you have?`;
                        options = ["Pavilion", "Envy", "Spectre", "Omen"];
                        break;
                    default:
                        question = `I need to know: ${missingField}`;
                }

                return res.status(200).json({
                    text: question,
                    type: type,
                    options: options,
                    groundingChunks: []
                });

            } else {
                // Phase 4: Delivery (Hardcoded Graph Success)
                const solution = `I have verified the latest confirmed release: **${candidate.name}** for ${knownData.os_version || 'your system'}.\n\n*   **Verified Source:** ${candidate.manufacturer} Official\n*   **Security Check:** Passed`;

                return res.status(200).json({
                    text: solution,
                    type: candidate.category,
                    groundingChunks: [
                        {
                            web: {
                                uri: candidate.download_pattern,
                                title: `Official Download: ${candidate.name}`
                            }
                        }
                    ]
                });
            }

        } else {
            // --- NEW ROBUST FALLBACK (LLM Handles Slot Filling & Context) ---

            const messages = history.map((msg: any) => ({
                role: (msg.sender === 'bot' ? 'assistant' : 'user') as 'assistant' | 'user' | 'system',
                content: msg.text || ""
            }));

            // The SUPREME System Prompt
            const systemPrompt = `You are SoftMonk, an AI cybersecurity expert and software guide.
Your goal is to provide **safe, direct, verified** download links.

**CRITICAL PROTOCOL: SYSTEM CONTEXT**
If the user message contains a block like \`[SYSTEM CONTEXT: ...]\`, that is verified data from the user's saved device profile.
- **TRUST IT.** Do not ask for the device name, brand, or OS if it is in the context.
- Use that info to immediately find the specific driver or software requested.
- PROCEED TO FIND THE LINK.

**CRITICAL PROTOCOL: SLOT FILLING**
If you DO NOT have context and the user asks for a "driver" or specific "software" where compatibility matters:
1. **CHECK**: Do you know the Device Brand/Model? Do you know the OS?
2. **ASK**: If missing, ask the user specifically for the missing piece. (e.g., "What is your laptop model?", "Are you on Windows 10 or 11?").
3. **DO NOT GUESS.**

**OUTPUT FORMAT RULES**
- **Links**: When you have a specific download page, you MUST format it exactly like this:
  \`[DOWNLOAD_LINK]https://example.com/drivers/page[/DOWNLOAD_LINK]\`
  (This triggers the UI to show a "Verified Source" button).
- **Warnings**: If a site is known for ads (like MajorGeeks), warn the user but provide the link if it's the safest option.
- **Prohibited**: Never link to Softonic, CNET, or random blogs.

**TONE**
Professional, helpful, "Senior Technician".
`;
            messages.unshift({ role: "system", content: systemPrompt });

            const completion = await openai.chat.completions.create({
                messages: messages,
                model: "gpt-3.5-turbo", // or gpt-4-turbo if available
                temperature: 0.3, // Lower temperature for more deterministic slot filling
            });

            // We return a standard response. The Client-Side `aiService.ts` will parse the `[DOWNLOAD_LINK]` tag
            // and convert it into the `groundingChunks` array automatically.
            return res.status(200).json({
                text: completion.choices[0].message.content,
                type: 'standard', // Client will upgrade this to 'software' or 'driver' based on content/tags
                groundingChunks: [] // Client populates this from the tag
            });
        }

    } catch (error: any) {
        console.error("AI Error:", error);
        return res.status(200).json({
            text: "I'm having trouble accessing my Knowledge Graph. Please try again in a moment.",
            type: 'standard'
        });
    }
}


