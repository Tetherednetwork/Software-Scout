
import React from 'react';

interface FooterProps {
    onPrivacyClick: () => void;
    onCookiePolicyClick: () => void;
    onGdprClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onPrivacyClick, onCookiePolicyClick, onGdprClick }) => {
    const year = new Date().getFullYear();

    return (
        <footer className="w-full text-center p-4 mt-1 md:mt-2 text-sm text-gray-500 dark:text-gray-400">
            <p>© {year} SoftMonk. All rights reserved.</p>
            <div className="flex justify-center items-center gap-4 mt-1">
                 <button onClick={onPrivacyClick} className="hover:underline text-[#355E3B] hover:text-[#2A482E] dark:text-[#69B870] dark:hover:text-[#85c78a] rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-[#4F8A54]">
                    Privacy Policy
                </button>
                <span aria-hidden="true">|</span>
                <button onClick={onCookiePolicyClick} className="hover:underline text-[#355E3B] hover:text-[#2A482E] dark:text-[#69B870] dark:hover:text-[#85c78a] rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-[#4F8A54]">
                    Cookie Policy
                </button>
                <span aria-hidden="true">|</span>
                <button onClick={onGdprClick} className="hover:underline text-[#355E3B] hover:text-[#2A482E] dark:text-[#69B870] dark:hover:text-[#85c78a] rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-[#4F8A54]">
                    GDPR Compliance
                </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
                Disclaimer: SoftMonk is an AI assistant and may display inaccurate information. Always verify important information and download links from official sources.
            </p>
        </footer>
    );
};

export default Footer;
