import React from 'react';
import { ShieldCheckIcon, WrenchScrewdriverIcon, CheckCircleIcon } from '../ui/Icons';

const CoreFeatures: React.FC = () => {
    const features = [
        {
            icon: <ShieldCheckIcon />,
            title: "Official Sources Only",
            description: "We link directly to official websites, avoiding ads and bundleware."
        },
        {
            icon: <WrenchScrewdriverIcon />,
            title: "Guided Driver Finder",
            description: "Our step-by-step wizard helps you find the exact driver for your PC."
        },
        {
            icon: <CheckCircleIcon />,
            title: "Safety Verified",
            description: "We prioritize safe, direct links with verified file info."
        }
    ];

    return (
        <section className="w-full mx-auto mb-1 md:mb-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((feature) => (
                    <div key={feature.title} className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                           {feature.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{feature.title}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CoreFeatures;
