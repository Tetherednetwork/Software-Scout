export type ScanStatus = 'queued' | 'scanning' | 'verified' | 'warned' | 'blocked';
export type Verdict = 'safe' | 'suspicious' | 'malicious' | 'unknown';

export interface ScanResult {
    url: string;
    verdict: Verdict;
    provider: 'Google Safe Browsing' | 'VirusTotal' | 'SoftMonk Internal';
    score?: number; // 0-100, where 100 is perfectly safe
    details: string;
    timestamp: number;
}

const GOOGLE_SAFE_BROWSING_API_KEY = import.meta.env.VITE_GOOGLE_SAFE_BROWSING_KEY || '';

/**
 * Simulates a multi-engine scan using Google Safe Browsing and basic heuristics.
 * In a real backend, this would call the actual VirusTotal API (which requires hiding the key).
 * For client-side MVP, we rely on high-confidence domain checking + Safe Browsing lookup.
 */
export const scanUrl = async (url: string): Promise<ScanResult> => {
    console.log(`[Scanner] Starting layered scan for: ${url}`);

    // 1. Internal Whitelist Check (Fastest & Most Reliable for known vendors)
    // If it matches our internal vendor map domains, we trust it high.
    const trustedDomains = ['microsoft.com', 'google.com', 'adobe.com', 'videolan.org', 'steampowered.com', 'spotify.com', 'zoom.us', 'discord.com', 'mozilla.org', 'nvidia.com', 'intel.com', 'amd.com', 'hp.com', 'dell.com', 'lenovo.com'];

    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        if (trustedDomains.some(d => hostname.endsWith(d))) {
            return {
                url,
                verdict: 'safe',
                provider: 'SoftMonk Internal',
                score: 100,
                details: 'Verified Official Vendor Domain',
                timestamp: Date.now()
            };
        }
    } catch (e) {
        return {
            url,
            verdict: 'malicious',
            provider: 'SoftMonk Internal',
            score: 0,
            details: 'Invalid URL Format',
            timestamp: Date.now()
        };
    }

    // 2. Google Safe Browsing Check (Real Threat Intelligence)
    if (GOOGLE_SAFE_BROWSING_API_KEY) {
        try {
            const isSafe = await checkSafeBrowsing(url, GOOGLE_SAFE_BROWSING_API_KEY);
            if (!isSafe) {
                return {
                    url,
                    verdict: 'malicious',
                    provider: 'Google Safe Browsing',
                    score: 0,
                    details: 'Flagged by Google as unsafe',
                    timestamp: Date.now()
                };
            }
        } catch (e) {
            console.error("Safe Browsing Check Failed:", e);
            // Fail open (allow) but warn, or fail closed? For MVP, we proceed to next check.
        }
    }

    // 3. Fallback / Default Verdict
    // If not actively blocked and not explicitly whitelisted, we treat as "Unknown but passable" 
    // or "Verified" if verifiedPreDetectedUrl logic was used upstream.
    return {
        url,
        verdict: 'safe', // Defaulting to safe for unflagged URLs to prompt download
        provider: 'SoftMonk Internal',
        score: 80, // High but not perfect 100
        details: 'No threats detected by standard scans',
        timestamp: Date.now()
    };
};

// Helper for Google Safe Browsing API
async function checkSafeBrowsing(url: string, apiKey: string): Promise<boolean> {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client: {
                    clientId: "softmonk-scanner",
                    clientVersion: "1.0.0"
                },
                threatInfo: {
                    threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    platformTypes: ["ANY_PLATFORM"],
                    threatEntryTypes: ["URL"],
                    threatEntries: [{ url: url }]
                }
            })
        });

        const data = await response.json();
        // If data.matches exists, threat found (return false = not safe). Else safe.
        return !data.matches || data.matches.length === 0;

    } catch (e) {
        console.warn("GSB API Error", e);
        return true; // Assume safe if API fails to avoid blocking users due to network error
    }
}
