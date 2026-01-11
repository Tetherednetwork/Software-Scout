export const getLogoUrl = (domain: string) => {
    // Google's favicon service is the most reliable fallback.
    // We request a large size (128px) to get high quality icons where available.
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// SVGs as Data URIs/URLs for instant loading/caching
// Switched to Google's Favicon service as primary for reliability (Clearbit was 404ing)
const LOGOS = {
    // Startups / New Tools
    arc: getLogoUrl("arc.net"),
    notion: getLogoUrl("notion.so"),
    figma: getLogoUrl("figma.com"),
    openai: getLogoUrl("openai.com"),
    perplexity: getLogoUrl("perplexity.ai"),

    // Antivirus
    mcafee: getLogoUrl("mcafee.com"),
    norton: getLogoUrl("norton.com"),
    bitdefender: getLogoUrl("bitdefender.com"),
    avast: getLogoUrl("avast.com"),
    totalav: getLogoUrl("totalav.com"),

    // Others
    chrome: getLogoUrl("google.com"),
    vscode: getLogoUrl("code.visualstudio.com"),
    discord: getLogoUrl("discord.com"),
    spotify: getLogoUrl("spotify.com"),
    zoom: getLogoUrl("zoom.us"),
    steam: getLogoUrl("steampowered.com"),
    nvidia: getLogoUrl("nvidia.com"),
    vlc: getLogoUrl("videolan.org")
};

import type { TrendingTopic } from '../types';

export const REALISTIC_SOFTWARE_TRENDS: TrendingTopic[] = [
    {
        name: "Arc Browser",
        description: "The browser that browses for you.",
        companyDomain: "arc.net",
        logo: LOGOS.arc,
        trend_reason: "#1 Product on Product Hunt."
    },
    {
        name: "Notion",
        description: "Your connected workspace.",
        companyDomain: "notion.so",
        logo: LOGOS.notion,
        trend_reason: "New AI features released."
    },
    {
        name: "Figma",
        description: "The collaborative interface design tool.",
        companyDomain: "figma.com",
        logo: LOGOS.figma,
        trend_reason: "Trending for designers."
    },
    {
        name: "OpenAI ChatGPT",
        description: "AI that helps you write, learn, and create.",
        companyDomain: "openai.com",
        logo: LOGOS.openai,
        trend_reason: "Viral AI sensation."
    },
    {
        name: "Perplexity AI",
        description: "Where knowledge begins.",
        companyDomain: "perplexity.ai",
        logo: LOGOS.perplexity,
        trend_reason: "Search engine of the future."
    }
];

export const REALISTIC_ANTIVIRUS_TRENDS: TrendingTopic[] = [
    {
        name: 'McAfee Total Protection',
        description: 'Antivirus, identity and privacy protection.',
        companyDomain: 'mcafee.com',
        logo: LOGOS.mcafee
    },
    {
        name: 'Norton 360 Deluxe',
        description: 'Comprehensive security with VPN & more.',
        companyDomain: 'norton.com',
        logo: LOGOS.norton
    },
    {
        name: 'Bitdefender Total Security',
        description: 'Top-rated protection against all threats.',
        companyDomain: 'bitdefender.com',
        logo: LOGOS.bitdefender
    },
    {
        name: 'Avast One',
        description: 'Free antivirus with privacy features.',
        companyDomain: 'avast.com',
        logo: LOGOS.avast
    },
    {
        name: 'TotalAV',
        description: 'Award-winning antivirus & security suite.',
        companyDomain: 'totalav.com',
        logo: LOGOS.totalav
    }
];
