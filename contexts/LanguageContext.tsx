import React, { createContext, useState, useEffect, useContext } from 'react';

// Define the shape of the context
interface LanguageContextType {
    language: string;
    setLanguage: (language: string) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const savedLang = localStorage.getItem('language');
        const availableLangs = ['en', 'fr', 'cy'];
        return savedLang && availableLangs.includes(savedLang) ? savedLang : 'en';
    });

    const [translations, setTranslations] = useState<Record<string, string> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTranslations = async () => {
            setIsLoading(true);
            try {
                // Fetch the JSON file from the public 'locales' directory.
                // The path is absolute from the root of the site.
                const response = await fetch(`/locales/${language}.json`);
                if (!response.ok) {
                    throw new Error(`Could not load translations for language: ${language}`);
                }
                const data = await response.json();
                setTranslations(data);
                
                // Save language preference to localStorage
                localStorage.setItem('language', language);
                // Set the lang attribute on the HTML tag for accessibility
                document.documentElement.lang = language;

            } catch (error) {
                console.error(error);
                // Fallback to English if the selected language fails to load
                if (language !== 'en') {
                    setLanguage('en');
                } else {
                    // If even English fails, set translations to an empty object.
                    setTranslations({}); 
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTranslations();
    }, [language]);

    // The translation function
    const t = (key: string, replacements?: Record<string, string | number>): string => {
        if (isLoading || !translations) {
            return key; // Return key if translations are not loaded yet
        }
        let translation = translations[key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                const regex = new RegExp(`{{${placeholder}}}`, 'g');
                translation = translation.replace(regex, String(replacements[placeholder]));
            });
        }
        return translation;
    };
    
    // Don't render children until the initial translations are loaded
    if (isLoading) {
        return null; 
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
