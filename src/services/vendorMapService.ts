import type { Platform } from '../types';

export interface Vendor {
    name: string;
    slug: string;
    homepage: string;
    windows: string | null;
    mac: string | null;
    linux?: string | null;
    android?: string | null;
}

let vendorMap: Vendor[] | null = null;

async function fetchVendorMap(): Promise<Vendor[]> {
    if (vendorMap) return vendorMap;
    try {
        const response = await fetch('/softmonk_vendor_map.json');
        if (!response.ok) throw new Error('Network response was not ok for vendor map');
        const data = await response.json();
        vendorMap = data;
        return vendorMap as Vendor[];
    } catch (e) {
        console.error("Failed to load or parse vendor map", e);
        return [];
    }
}

export async function findInVendorMap(query: string): Promise<Vendor | null> {
    const map = await fetchVendorMap();
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/download|install|for|on/g, ' ').trim();

    if (!normalizedQuery) return null;

    const queryParts = normalizedQuery.split(' ').filter(Boolean);
    const queryRegex = new RegExp(queryParts.join('.*'), 'i');


    let bestMatch: Vendor | null = null;
    let bestMatchScore = 0;

    for (const software of map) {
        const name = software.name.toLowerCase();
        
        if (queryRegex.test(name)) {
            const score = 1 / name.length;
            if (score > bestMatchScore) {
                bestMatchScore = score;
                bestMatch = software;
            }
        }
    }
    return bestMatch;
}
            
export function detectPlatform(query: string): Platform | null {
    // 1. Prioritize user's explicit query
    const q = query.toLowerCase();
    if (/\b(windows|win)\b/.test(q)) return 'windows';
    if (/\b(macos|mac|apple)\b/.test(q)) return 'macos';
    if (/\b(linux|ubuntu|debian)\b/.test(q)) return 'linux';
    if (/\b(android)\b/.test(q)) return 'android';

    // 2. Fallback to automatic detection from browser/system info
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
        // Check for Linux last, as Android user agents also contain "linux"
        if (platform.startsWith('linux') || userAgent.includes('linux')) {
            return 'linux';
        }
    }
    
    // 3. If no detection is possible, return null to let the bot ask
    return null;
}