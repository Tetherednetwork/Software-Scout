import React from 'react';
import { ShieldCheckIcon, WrenchScrewdriverIcon, CheckCircleIcon } from '../ui/Icons';

const CoreFeatures: React.FC = () => {
    const features = [
        {
            icon: <ShieldCheckIcon className="h-5 w-5" />,
            title: "Official Sources Only",
            description: "We link directly to official websites, avoiding ads and bundleware."
        },
        {
            icon: <WrenchScrewdriverIcon />,
            title: "Guided Driver Finder",
            description: "Our step-by-step wizard helps you find the exact driver for your PC."
        },
        {
            icon: <CheckCircleIcon className="h-5 w-5" />,
            title: "Safety Verified",
            description: "We prioritize safe, direct links with verified file info."
        }
    ];

    return (
        <section className="w-full mx-auto mb-1 md:mb-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {features.map((feature) => (
                    <div key={feature.title} className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                           {feature.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-gray-800 dark:text-white">{feature.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-white">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CoreFeatures;
