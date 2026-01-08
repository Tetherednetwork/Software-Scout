import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'cy', name: 'Cymraeg' },
];

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const getFlagEmoji = (langCode: string) => {
        switch (langCode) {
            case 'en': return '🇬🇧';
            case 'fr': return '🇫🇷';
            case 'cy': return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
            default: return '🌐';
        }
    }

    return (
        <div className="relative">
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-500 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer pr-10"
                aria-label="Select language"
            >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                        {getFlagEmoji(lang.code)} {lang.name}
                    </option>
                ))}
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 dark:text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
