import React from 'react';
import { GitHubIcon } from '../ui/Icons';

interface FooterProps {
    onPrivacyClick: () => void;
    onCookiePolicyClick: () => void;
    onGdprClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onPrivacyClick, onCookiePolicyClick, onGdprClick }) => {
    const year = new Date().getFullYear();
    const githubUrl = "https://github.com/Tetherednetwork";

    return (
        <footer className="w-full text-center p-4 mt-1 md:mt-2 text-sm text-gray-500 dark:text-white isolation-isolate">
            <p>© {year} SoftMonk. All rights reserved.</p>
            <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 mt-2">
                <button onClick={onPrivacyClick} className="hover:underline text-[#355E3B] hover:text-[#2A482E] dark:text-[#69B870] dark:hover:text-[#85c78a] rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-[#4F8A54]">
                    Privacy Policy
                </button>
                <span aria-hidden="true" className="hidden sm:inline">|</span>
                <button onClick={onCookiePolicyClick} className="hover:underline text-[#355E3B] hover:text-[#2A482E] dark:text-[#69B870] dark:hover:text-[#85c78a] rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-[#4F8A54]">
                    Cookie Policy
                </button>
                <span aria-hidden="true" className="hidden sm:inline">|</span>
                <button onClick={onGdprClick} className="hover:underline text-[#355E3B] hover:text-[#2A482E] dark:text-[#69B870] dark:hover:text-[#85c78a] rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-[#4F8A54]">
                    GDPR Compliance
                </button>
                <span aria-hidden="true" className="hidden sm:inline">|</span>
                <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline text-[#355E3B] hover:text-[#2A482E] dark:text-[#69B870] dark:hover:text-[#85c78a] rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-[#4F8A54]"
                    aria-label="View source code on GitHub"
                >
                    <GitHubIcon className="h-4 w-4" />
                    <span>GitHub</span>
                </a>
            </div>
            <p className="text-xs text-gray-500 dark:text-white mt-2 max-w-2xl mx-auto">
                Disclaimer: SoftMonk is an AI assistant and may display inaccurate information. Always verify important information and download links from official sources. (Tec-V3)
            </p>
        </footer>
    );
};

export default Footer;
