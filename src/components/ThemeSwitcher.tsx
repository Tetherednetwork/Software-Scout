import React from 'react';
import { SunIcon, MoonIcon } from './ui/Icons';

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
            className="p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-500 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-green-500"
            aria-label={title}
            title={title}
        >
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
        </button>
    );
};

export default ThemeSwitcher;
