import React, { useEffect, useRef, useState } from 'react';

// Declare the Trustpilot object on the window for TypeScript.
declare global {
    interface Window {
        Trustpilot?: {
            loadFromElement: (element: HTMLElement) => void;
        };
    }
}

// This component handles the integration of a Trustpilot TrustBox widget.
const TrustpilotWidget: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    useEffect(() => {
        // Observer to watch for theme changes on the <html> element
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
            setTheme(newTheme);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const loadWidget = () => {
            if (window.Trustpilot && ref.current) {
                window.Trustpilot.loadFromElement(ref.current);
            }
        };

        if (window.Trustpilot) {
            loadWidget();
        } else {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = `//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js`;
            script.async = true;
            document.head.appendChild(script);
            script.onload = loadWidget;
        }
    }, []); // Runs once per mount. The key prop below handles re-mounting on theme change.

    return (
        <div
            key={theme} // Force React to re-mount the component on theme change
            ref={ref}
            className="trustpilot-widget"
            data-locale="en-GB"
            data-template-id="56278e9abfbbba0bdcd568bc"
            data-businessunit-id="6901d73a3bbae18328e53a32"
            data-style-height="52px"
            data-style-width="100%"
            data-theme={theme}
            data-token="b92ab7a9-4555-474c-91b3-6b17ceed6fa6"
        >
            <a href="https://uk.trustpilot.com/review/softmonk.co" target="_blank" rel="noopener noreferrer">Trustpilot</a>
        </div>
    );
};

export default TrustpilotWidget;
