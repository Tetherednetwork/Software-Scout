



import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { TrendingTopic } from '../types';

interface TrendingTopicsProps {
    onTopicClick: (topic: string) => void;
}

const TrendingTopics: React.FC<TrendingTopicsProps> = ({ onTopicClick }) => {
    const [trends, setTrends] = useState<TrendingTopic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrends = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const q = query(
                collection(db, 'trending_software'),
                orderBy('rank', 'asc'),
                limit(5)
            );
            const snapshot = await getDocs(q);

            const formattedData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    name: data.name,
                    description: data.description,
                    companyDomain: data.company_domain,
                };
            });
            setTrends(formattedData);
        } catch (err: any) {
            console.error("Error fetching trending topics:", err);
            setError(err.message || "Could not load trends.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends();
    }, []);


    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        const trendName = target.alt.replace(' logo', '');
        // Fallback to an initial-based avatar
        target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(trendName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&chars=2&radius=20`;
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
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Software Trends</h3>
                </div>
                <button
                    onClick={fetchTrends}
                    disabled={isLoading}
                    className="p-1.5 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
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
                ) : error ? (
                    <p className="p-4 text-center text-sm text-red-500 dark:text-red-400">{error}</p>
                ) : trends.length > 0 ? trends.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => onTopicClick(item.name)}
                        className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500"
                    >
                        <div className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5 flex items-center justify-center">
                            <img
                                src={`https://logo.clearbit.com/${item.companyDomain}`}
                                alt={`${item.name} logo`}
                                className="max-w-full max-h-full object-contain"
                                onError={handleImageError}
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{item.name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{item.description}</p>
                        </div>
                    </button>
                )) : (
                    <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No trends available right now.</p>
                )}
            </div>
        </div>
    );
};

export default TrendingTopics;