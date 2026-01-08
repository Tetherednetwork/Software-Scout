import React, { useState, useEffect } from 'react';

const LocationDisplay: React.FC = () => {
    const [location, setLocation] = useState<{ country: string; code: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const fetchLocation = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('https://ipwho.is/', { signal });
                if (!response.ok) throw new Error('Failed to fetch location');
                const data = await response.json();
                
                if (data.success && data.country && data.country_code) {
                    setLocation({ country: data.country, code: data.country_code });
                } else {
                     setLocation(null);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error("Error fetching location:", error);
                    setLocation(null);
                }
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchLocation();

        return () => controller.abort();
    }, []);

    if (isLoading) {
        return <div className="h-6 w-8 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-sm"></div>;
    }

    if (location) {
        return (
            <img
                src={`https://flagcdn.com/h20/${location.code.toLowerCase()}.png`}
                alt={`${location.country} flag`}
                className="h-5 object-contain rounded-sm"
                title={`Location: ${location.country}`}
            />
        );
    }
    
    return null; // Don't show anything if location fetch fails
};

export default LocationDisplay;