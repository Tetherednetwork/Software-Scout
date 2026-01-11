
import type { TrendingTopic } from '../types';

// SVGs as Data URIs for instant loading/caching
const LOGOS = {
    chrome: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg",
    vscode: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg",
    discord: "https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
    spotify: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
    zoom: "https://upload.wikimedia.org/wikipedia/commons/2/25/Zoom_communications_Logo.svg",
    steam: "https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg",
    nvidia: "https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo_2024.svg",
    vlc: "https://upload.wikimedia.org/wikipedia/commons/e/e6/VLC_Icon.svg",

    // Antivirus
    mcafee: "https://upload.wikimedia.org/wikipedia/commons/2/2f/McAfee_Shield_Logo.svg",
    norton: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Norton_AntiVirus_logo.png",
    bitdefender: "https://upload.wikimedia.org/wikipedia/commons/3/30/Bitdefender_Antivirus_Logo.svg",
    avast: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Avast_Antivirus_logo.svg",
    totalav: "https://www.totalav.com/static/images/logo.svg"
};

export const REALISTIC_SOFTWARE_TRENDS: TrendingTopic[] = [
    {
        name: "Google Chrome",
        description: "Top-rated for productivity.",
        companyDomain: "google.com",
        logo: LOGOS.chrome,
        trend_reason: "Browsing standard. Most downloaded browser."
    },
    {
        name: "Visual Studio Code",
        description: "Essential utility for developers.",
        companyDomain: "code.visualstudio.com",
        logo: LOGOS.vscode,
        trend_reason: "Trending in developer communities."
    },
    {
        name: "Spotify",
        description: "Music for everyone.",
        companyDomain: "spotify.com",
        logo: LOGOS.spotify,
        trend_reason: "Top music streaming app globally."
    },
    {
        name: "Discord",
        description: "Talk, chat, and hang out.",
        companyDomain: "discord.com",
        logo: LOGOS.discord,
        trend_reason: "Leading communication platform."
    },
    {
        name: "Zoom Workplace",
        description: "Video conferencing made easy.",
        companyDomain: "zoom.us",
        logo: LOGOS.zoom,
        trend_reason: "Essential for remote work."
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
