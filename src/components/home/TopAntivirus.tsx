import React from 'react';
import { VirusScanIcon } from '../ui/Icons';
import type { TrendingTopic } from '../../types';

interface TopAntivirusProps {
    onTopicClick: (topic: string) => void;
}

// FIX: Corrected the type definition for antivirusTrends. The previous type was complex and incorrect due to operator precedence.
// The objects in the array perfectly match the TrendingTopic interface.
const antivirusTrends: TrendingTopic[] = [
    {
        name: 'McAfee Total Protection',
        description: 'Antivirus, identity and privacy protection.',
        companyDomain: 'mcafee.com',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/McAfee_Shield_Logo.svg'
    },
    {
        name: 'Norton 360 Deluxe',
        description: 'Comprehensive security with VPN & more.',
        companyDomain: 'norton.com',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Norton_AntiVirus_logo.png'
    },
    {
        name: 'TotalAV',
        description: 'Award-winning antivirus & security suite.',
        companyDomain: 'totalav.com',
        logo: 'https://www.totalav.com/static/images/logo.svg'
    },
    {
        name: 'Bitdefender Total Security',
        description: 'Top-rated protection against all threats.',
        companyDomain: 'bitdefender.com',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Bitdefender_Antivirus_Logo.svg' // Correct visual
    },
    {
        name: 'Avast One',
        description: 'Free antivirus with privacy features.',
        companyDomain: 'avast.com',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Avast_Antivirus_logo.svg'
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
    return (
        <div
            className="w-full flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            data-tour-id="top-antivirus"
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <VirusScanIcon />
                    <h3 className="font-bold text-gray-800 dark:text-white">Top Antivirus 2025</h3>
                </div>
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
                                src={item.logo || `https://logo.clearbit.com/${item.companyDomain}`}
                                alt={`${item.name} logo`}
                                className="max-w-full max-h-full object-contain"
                                onError={handleImageError}
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{item.name}</p>
                            <p className="text-gray-500 dark:text-white text-xs truncate">{item.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TopAntivirus;
