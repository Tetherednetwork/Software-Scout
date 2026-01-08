import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

interface ThemeSwitcherProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, toggleTheme }) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    const title = `Switch to ${nextTheme} mode`;
    
    return (
        <button
            onClick={toggleTheme}
            className="p-3 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[#4F8A54]"
            aria-label={title}
            title={title}
        >
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
        </button>
    );
};

export default ThemeSwitcher;
