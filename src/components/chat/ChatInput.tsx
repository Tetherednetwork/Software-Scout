import React, { useState } from 'react';
import { SendIcon } from '../ui/Icons';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    isLoading: boolean;
    placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, placeholder }) => {
    const [inputText, setInputText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim() && !isLoading) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center gap-4">
                <label htmlFor="chat-input" className="sr-only">Chat message</label>
                <textarea
                    id="chat-input"
                    data-tour-id="chat-input"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || "Ask for software..."}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-white rounded-lg p-3 focus:ring-2 focus:ring-[#4F8A54] focus:outline-none resize-none disabled:bg-gray-200 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed"
                    rows={1}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !inputText.trim()}
                    aria-label="Send message"
                    className="bg-[#355E3B] text-white rounded-full p-3 hover:bg-[#2A482E] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[#4F8A54]"
                >
                    <SendIcon />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
