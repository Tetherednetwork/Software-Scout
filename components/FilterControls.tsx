import React from 'react';
import type { SoftwareFilter, AIProvider } from '../types';
import { FilterIcon, TrashIcon, GeminiIcon, OpenAIIcon, AzureAIFoundryIcon, DeepSeekIcon } from './Icons';

interface FilterControlsProps {
    activeFilter: SoftwareFilter;
    onFilterChange: (filter: SoftwareFilter) => void;
    onClearHistory: () => void;
    activeProvider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
    isOpenAIEnabled: boolean;
    isAzureEnabled: boolean;
    isDeepSeekEnabled: boolean;
    isHistoryEnabled: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
    activeFilter, 
    onFilterChange, 
    onClearHistory,
    activeProvider,
    onProviderChange,
    isOpenAIEnabled,
    isAzureEnabled,
    isDeepSeekEnabled,
    isHistoryEnabled
}) => {
    const filters: { id: SoftwareFilter; label: string }[] = [
        { id: 'all', label: "All" },
        { id: 'free', label: "Free" },
        { id: 'freemium', label: "Freemium" },
        { id: 'paid', label: "Paid" },
    ];

    return (
        <div className="p-3 sm:p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3 sticky top-0 z-10">
            <div className="flex items-center gap-4" data-tour-id="software-filters">
                <div className="hidden sm:flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <FilterIcon />
                    <span className="font-semibold text-sm">Filter by:</span>
                </div>
                <div className="flex items-center gap-2">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[#4F8A54] ${
                                activeFilter === filter.id
                                    ? 'bg-[#355E3B] text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
             <div className="flex items-center gap-2 sm:gap-4">
                <div data-tour-id="ai-provider-switcher" className="bg-gray-200 dark:bg-gray-900/70 p-1 rounded-full flex items-center gap-1 text-sm" role="radiogroup" aria-label="AI Provider">
                    <button
                        onClick={() => onProviderChange('gemini')}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-200 ${activeProvider === 'gemini' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                        title="Use Gemini AI"
                        role="radio"
                        aria-checked={activeProvider === 'gemini'}
                    >
                        <GeminiIcon className="h-5 w-5" />
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Gemini</span>
                    </button>
                    <button
                        onClick={() => onProviderChange('openai')}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-200 ${!isOpenAIEnabled ? 'opacity-50' : ''} ${activeProvider === 'openai' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                        title={isOpenAIEnabled ? "Use OpenAI" : "OpenAI API key not configured"}
                        role="radio"
                        aria-checked={activeProvider === 'openai'}
                    >
                        <OpenAIIcon className="h-5 w-5" />
                         <span className="font-semibold text-gray-700 dark:text-gray-200">OpenAI</span>
                    </button>
                    <button
                        onClick={() => onProviderChange('azure')}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-200 ${!isAzureEnabled ? 'opacity-50' : ''} ${activeProvider === 'azure' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                        title={isAzureEnabled ? "Use Azure AI Foundry" : "Azure AI Foundry API key not configured"}
                        role="radio"
                        aria-checked={activeProvider === 'azure'}
                    >
                        <AzureAIFoundryIcon className="h-5 w-5" />
                         <span className="font-semibold text-gray-700 dark:text-gray-200">Azure</span>
                    </button>
                    <button
                        onClick={() => onProviderChange('deepseek')}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-200 ${!isDeepSeekEnabled ? 'opacity-50' : ''} ${activeProvider === 'deepseek' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
                        title={isDeepSeekEnabled ? "Use DeepSeek" : "DeepSeek API key not configured"}
                        role="radio"
                        aria-checked={activeProvider === 'deepseek'}
                    >
                        <DeepSeekIcon className="h-5 w-5" />
                         <span className="font-semibold text-gray-700 dark:text-gray-200">DeepSeek</span>
                    </button>
                </div>
                <button
                    onClick={onClearHistory}
                    title={isHistoryEnabled ? "Clear Chat History" : "Sign in to manage history"}
                    aria-label="Clear Chat History"
                    data-tour-id="clear-history"
                    disabled={!isHistoryEnabled}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500"
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};

export default FilterControls;