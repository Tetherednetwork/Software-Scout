import React from 'react';
import { BotIcon } from '../ui/Icons';
import LoadingSpinner from '../ui/LoadingSpinner';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex items-start gap-4 justify-start">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                <BotIcon />
            </div>
            <div className="max-w-xl rounded-lg p-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
                <div className="flex items-center gap-2">
                    <span className="italic text-gray-600 dark:text-white">SoftMonk is typing...</span>
                    <LoadingSpinner />
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator;
