import React from 'react';
import { SparklesIcon, AppleIcon, GameIcon, AndroidIcon, WindowsIcon } from '../ui/Icons';

interface SuggestedPromptsProps {
    onPromptClick: (prompt: string) => void;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onPromptClick }) => {
    const prompts = [
        { text: "Find a video editor for macOS", icon: <AppleIcon /> },
        { text: "Best free games on Steam", icon: <GameIcon /> },
        { text: "Top productivity apps for Android", icon: <AndroidIcon /> },
        { text: "I need drivers for my Dell laptop", icon: <WindowsIcon /> }
    ];

    return (
        <div className="px-2 sm:px-4 py-4">
             <div className="flex items-center gap-2 mb-3">
                <SparklesIcon />
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Try one of these</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {prompts.map(prompt => (
                    <button
                        key={prompt.text}
                        onClick={() => onPromptClick(prompt.text)}
                        className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500 flex items-center gap-3"
                    >
                        <span className="flex-shrink-0">{prompt.icon}</span>
                        <span>{prompt.text}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SuggestedPrompts;