
import type { TrendingTopic } from '../types';

// SVGs as Data URIs/URLs for instant loading/caching
const LOGOS = {
    // Startups / New Tools
    arc: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Arc_Browser_logo.svg",
    notion: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg",
    figma: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
    openai: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
    perplexity: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Perplexity_AI_logo.svg", // Fallback or find specific

    // Antivirus
    mcafee: "https://upload.wikimedia.org/wikipedia/commons/2/2f/McAfee_Shield_Logo.svg",
    norton: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Norton_AntiVirus_logo.png",
    bitdefender: "https://upload.wikimedia.org/wikipedia/commons/3/30/Bitdefender_Antivirus_Logo.svg",
    avast: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Avast_Antivirus_logo.svg",
    totalav: "https://www.totalav.com/static/images/logo.svg"
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
