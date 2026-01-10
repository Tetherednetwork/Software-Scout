import type { Platform, SoftwareCatalogItem } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface Vendor {
    name: string;
    slug?: string;
    homepage: string;
    windows: string | null;
    mac: string | null;
    linux?: string | null;
    android?: string | null;
    [key: string]: string | null | undefined;
}

// Cache the vendor map in memory to avoid repeated DB calls
let vendorMap: Vendor[] | null = null;

export async function getVendorMap(): Promise<Vendor[]> {
    if (vendorMap) return vendorMap;

    try {
        console.log("Fetching verified software list from Firestore (software_catalog)...");
        const querySnapshot = await getDocs(collection(db, 'software_catalog'));

        const data: Vendor[] = [];
        querySnapshot.forEach((doc) => {
            const d = doc.data() as SoftwareCatalogItem;

            // Map the new Knowledge Graph Schema to the legacy Vendor interface
            // used by the Frontend Search/Trends widgets.
            data.push({
                name: d.name,
                homepage: d.download_pattern,
                // Simple heuristic mapping for legacy fields
                windows: d.os_compatibility.some(os => os.includes('Windows')) ? d.download_pattern : null,
                mac: d.os_compatibility.some(os => os.includes('macOS')) ? d.download_pattern : null,
                linux: d.os_compatibility.some(os => os.includes('Linux')) ? d.download_pattern : null,
                android: d.os_compatibility.some(os => os.includes('Android')) ? d.download_pattern : null
            });
        });

        if (data.length > 0) {
            vendorMap = data;
            return vendorMap;
        }

        return [];
    } catch (e) {
        console.error("Failed to fetch from Firestore 'verified_software' collection. Falling back to local JSON.", e);
        try {
            const response = await fetch('/softmonk_vendor_map.json');
            if (!response.ok) throw new Error('Network response was not ok for fallback vendor map');
            const jsonData = await response.json();
            vendorMap = jsonData;
            return vendorMap as Vendor[];
        } catch (fallbackError) {
            console.error("Failed to load fallback vendor map", fallbackError);
            return [];
        }
    }
}

/**
 * Searches the vendor map for software entries matching the user's query using a hierarchical approach.
 * Handles ambiguity by returning multiple matches if necessary.
 * @param query The user's search query.
 * @returns A promise resolving to an array of matching Vendor objects, or an empty array if no match.
 */
export async function findInVendorMap(query: string): Promise<Vendor[]> {
    const map = await getVendorMap();
    // Intelligent filtering of common, irrelevant words like "browser", "app", etc.
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\b(download|install|for|on|get|find|browser|app|software|game|driver)\b/g, ' ').trim();

    if (!normalizedQuery) return [];

    // --- Tier 1: Exact Match ---
    // Look for a perfect match first. This is the highest confidence result.
    const exactMatch = map.find(s => s.name.toLowerCase() === normalizedQuery);
    if (exactMatch) {
        // Now, we must check for ambiguity. For example, if the query is "Visual Studio",
        // we have an exact match, but "Visual Studio Code" also exists. We should ask.
        const ambiguousMatches = map.filter(s =>
            s.name.toLowerCase() !== exactMatch.name.toLowerCase() &&
            s.name.toLowerCase().startsWith(exactMatch.name.toLowerCase() + ' ')
        );

        if (ambiguousMatches.length > 0) {
            // Ambiguity found. Return both the exact match and the ambiguous ones for clarification.
            return [exactMatch, ...ambiguousMatches].sort((a, b) => a.name.length - b.name.length);
        }

        // No ambiguity found, return the single confident match.
        return [exactMatch];
    }

    // --- Tier 2: "Starts With" Match ---
    // If no exact match, look for items that start with the query.
    // This is good for partial queries like "visual".
    const startsWithMatches = map.filter(s => s.name.toLowerCase().startsWith(normalizedQuery));
    if (startsWithMatches.length > 0) {
        // If we get multiple results (e.g., "visual" matching "Visual Studio" and "Visual Studio Code"),
        // it's ambiguous. Return the top (shortest) results for clarification.
        return startsWithMatches.sort((a, b) => a.name.length - b.name.length).slice(0, 2);
    }

    // --- Tier 3: Word-based search (less precise) ---
    // Handles typos or out-of-order words like "studio visual"
    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
    const wordMatches = map.filter(s => {
        const nameLower = s.name.toLowerCase();
        return queryWords.every(word => nameLower.includes(word));
    });

    if (wordMatches.length > 0) {
        // This is a lower-confidence match, so just return the best candidate.
        return [wordMatches.sort((a, b) => a.name.length - b.name.length)[0]];
    }

    return [];
}

/**
 * Detects the target platform from a user's query or browser user agent.
 * @param query The user's search query.
 * @returns A Platform string or null if not detected.
 */
export function detectPlatform(query: string): Platform | null {
    const q = query.toLowerCase();
    if (/\b(windows|win)\b/.test(q)) return 'windows';
    if (/\b(macos|mac|apple)\b/.test(q)) return 'macos';
    if (/\b(linux|ubuntu|debian)\b/.test(q)) return 'linux';
    if (/\b(android)\b/.test(q)) return 'android';

    if (typeof window !== 'undefined' && window.navigator) {
        const platform = window.navigator.platform.toLowerCase();
        const userAgent = window.navigator.userAgent.toLowerCase();

        if (platform.startsWith('win') || userAgent.includes('windows')) {
            return 'windows';
        }
        if (platform.startsWith('mac') || userAgent.includes('mac os')) {
            return 'macos';
        }
        if (userAgent.includes('android')) {
            return 'android';
        }
        if (platform.startsWith('linux') || userAgent.includes('linux')) {
            return 'linux';
        }
    }

    return null;
}