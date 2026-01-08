
import React from 'react';
import type { SoftwareFilter } from '../../types';
import { FilterIcon, TrashIcon } from '../ui/Icons';

interface FilterControlsProps {
    activeFilter: SoftwareFilter;
    onFilterChange: (filter: SoftwareFilter) => void;
    onClearHistory: () => void;
    isHistoryEnabled: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
    activeFilter, 
    onFilterChange, 
    onClearHistory,
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
