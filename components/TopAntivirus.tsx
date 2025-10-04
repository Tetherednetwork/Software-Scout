




import React, { useState } from 'react';

interface TopAntivirusProps {
    onTopicClick: (topic: string) => void;
}

const antivirusTrends = [
    {
        name: 'McAfee Total Protection',
        description: 'Trusted antivirus and identity protection.',
        companyDomain: 'mcafee.com',
    },
    {
        name: 'Norton 360',
        description: 'Comprehensive security suite.',
        companyDomain: 'norton.com',
    },
    {
        name: 'TotalAV',
        description: 'Award-winning antivirus & security.',
        companyDomain: 'totalav.com',
    },
];

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    const trendName = target.alt.replace(' logo', '');
    // Fallback to an initial-based avatar
    target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(trendName)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&chars=2&radius=20`;
    // Prevent retrying the same failed URL
    target.onerror = null; 
};

const TopAntivirus: React.FC<TopAntivirusProps> = ({ onTopicClick }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 500); // Simulate a quick refresh
    };

    return (
        <div 
            className="w-full flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            data-tour-id="top-antivirus"
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Top Antivirus</h3>
                </div>
                 <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-1.5 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                    aria-label="Refresh list"
                    title="Refresh list"
                >
                    <img src="/images/sync.png" alt="Refresh icon" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto">
                 {antivirusTrends.map((item) => (
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
                ))}
            </div>
        </div>
    );
};

export default TopAntivirus;