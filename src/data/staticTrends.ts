
import type { TrendingTopic } from '../types';

// SVGs as Data URIs/URLs for instant loading/caching
const LOGOS = {
    // Startups / New Tools
    arc: "https://logo.clearbit.com/arc.net",
    notion: "https://logo.clearbit.com/notion.so",
    figma: "https://logo.clearbit.com/figma.com",
    openai: "https://logo.clearbit.com/openai.com",
    perplexity: "https://logo.clearbit.com/perplexity.ai",

    // Antivirus
    mcafee: "https://logo.clearbit.com/mcafee.com",
    norton: "https://logo.clearbit.com/norton.com",
    bitdefender: "https://logo.clearbit.com/bitdefender.com",
    avast: "https://logo.clearbit.com/avast.com",
    totalav: "https://logo.clearbit.com/totalav.com",

    // Others
    chrome: "https://logo.clearbit.com/google.com",
    vscode: "https://logo.clearbit.com/code.visualstudio.com",
    discord: "https://logo.clearbit.com/discord.com",
    spotify: "https://logo.clearbit.com/spotify.com",
    zoom: "https://logo.clearbit.com/zoom.us",
    steam: "https://logo.clearbit.com/steampowered.com",
    nvidia: "https://logo.clearbit.com/nvidia.com",
    vlc: "https://logo.clearbit.com/videolan.org"
};

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
        // Using a generic or best-effort logo if specific SVG not stable
        logo: "https://upload.wikimedia.org/wikipedia/commons/7/77/Perplexity.ai_logo.svg",
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
