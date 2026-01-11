import React, { useState, useEffect } from 'react';
import type { TrendingTopic } from '../../types';
import { REALISTIC_SOFTWARE_TRENDS } from '../../data/staticTrends';

interface TrendingTopicsProps {
    onTopicClick: (topic: string) => void;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ onTopicClick }) => {
    const [trends, setTrends] = useState<TrendingTopic[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate a very brief load or just set immediately
        // We use the static realistic trends for speed and quality
        setTrends(REALISTIC_SOFTWARE_TRENDS);
        setIsLoading(false);
    }, []);

    // Function kept for the refresh button, but now it just re-sets the static list (or we could shuffle)
    const fetchTrends = () => {
        setIsLoading(true);
        setTimeout(() => {
            // Optional: Shuffle slightly or just reload
            setTrends([...REALISTIC_SOFTWARE_TRENDS].sort(() => 0.5 - Math.random()));
            setIsLoading(false);
        }, 500);
    };


    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        const trendName = target.alt.replace(' logo', '');
        // Fallback to an initial-based avatar
        target.src = `${import.meta.env.VITE_DICEBEAR_API_URL}/initials/svg?seed=${encodeURIComponent(trendName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&chars=2&radius=20`;
        // Prevent retrying the same failed URL
        target.onerror = null;
    };

    return (
        <div
            className="w-full flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            data-tour-id="trending-topics"
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <h3 className="font-bold text-gray-800 dark:text-white">Startup Trends</h3>
                </div>
                <button
                    onClick={fetchTrends}
                    disabled={isLoading}
                    className="p-1.5 text-gray-500 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                    aria-label="Refresh trends"
                    title="Refresh trends"
                >
                    <img src="/images/sync.png" alt="Refresh icon" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
                            <div className="w-10 h-10 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))
                ) : trends.length > 0 ? trends.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => onTopicClick(item.name)}
                        className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500"
                    >
                        <div className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5 flex items-center justify-center">
                            <img
                                src={item.logo || `https://logo.clearbit.com/${item.companyDomain}`}
                                alt={`${item.name} logo`}
                                className="max-w-full max-h-full object-contain"
                                onError={handleImageError}
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{item.name}</p>
                            <p className="text-gray-500 dark:text-white text-xs truncate">{item.description}</p>
                            {item.trend_reason && (
                                <p className="text-xs italic text-green-700 dark:text-green-400 mt-1 truncate" title={item.trend_reason}>
                                    {item.trend_reason}
                                </p>
                            )}
                        </div>
                    </button>
                )) : (
                    <p className="p-4 text-center text-sm text-gray-500 dark:text-white">No trends available right now.</p>
                )}
            </div>
        </div>
    );
};

export default TrendingTopics;
