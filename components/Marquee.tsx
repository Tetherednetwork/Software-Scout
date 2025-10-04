import React from 'react';

const Marquee: React.FC = () => {
    const marqueeItems = [
        "Find the right download. From the right source. Every time.",
        "Avoid bundleware and fake mirrors.",
        "Verify files before your users touch them.",
        "Find official app downloads from the OEM site.",
        "Find the correct driver for a specific PC model or device ID.",
        "Show safe, direct links only, with file hashes and version info.",
        "Flag bundleware and unwanted add-ons before install.",
    ];

    return (
        <div className="relative h-6 mt-2 overflow-hidden w-full max-w-lg text-center text-sm text-gray-600 dark:text-white marquee-mask">
            <div className="marquee-content absolute w-full">
                {[...marqueeItems, ...marqueeItems].map((item, index) => (
                    <div key={index} className="py-1">{item}</div>
                ))}
            </div>
        </div>
    );
};

export default Marquee;
