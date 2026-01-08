import React, { useEffect } from 'react';

// Make sure the adsbygoogle object is available on the window
declare global {
    interface Window {
        // FIX: The previous type was incorrect. `adsbygoogle` is an array of ad request objects.
        // The `push` method is called on the array itself, not on its elements.
        adsbygoogle?: object[];
    }
}

// This component handles the integration of an AdSense ad unit.
const AdSenseWidget: React.FC = () => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, []);

    // IMPORTANT FOR USER:
    // Replace 'ca-pub-XXXXXXXXXXXXXXXX' with your own AdSense Publisher ID.
    // Replace 'YYYYYYYYYY' with your own Ad Slot ID.
    const adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // <-- REPLACE THIS
    const adSlot = "YYYYYYYYYY";           // <-- REPLACE THIS

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center h-auto min-h-[280px] flex flex-col justify-center items-center">
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Advertisement</p>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={adClient}
                data-ad-slot={adSlot}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
             <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Replace placeholder IDs in AdSenseWidget.tsx to display real ads.</p>
        </div>
    );
};

export default AdSenseWidget;