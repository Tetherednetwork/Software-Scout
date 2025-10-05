import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from '../ui/Icons';

interface TourStep {
    selector: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        selector: '[data-tour-id="trending-topics"]',
        title: "Discover Trending Software",
        content: "Not sure what to look for? Click any of these popular software trends to start a search instantly.",
        position: 'right',
    },
    {
        selector: '[data-tour-id="top-antivirus"]',
        title: "Top Antivirus Software",
        content: "Stay protected! We've listed some top-rated antivirus solutions. Click on one to ask the AI for more details and a safe download link.",
        position: 'right',
    },
    {
        selector: '[data-tour-id="main-nav"]',
        title: "Navigate The Site",
        content: "Use this menu to explore other pages like our Blog, About page, and other useful tools we offer.",
        position: 'bottom',
    },
    {
        selector: '[data-tour-id="file-verifier-link"]',
        title: "Verify Your Downloads",
        content: "Got a file hash? Use our File Verifier to check if your downloaded file is authentic and hasn't been tampered with.",
        position: 'bottom',
    },
    {
        selector: '[data-tour-id="ai-provider-switcher"]',
        title: "Switch Your AI Provider",
        content: "You can choose from multiple AI providers like Gemini, OpenAI, and more to power your search. Pick the one you trust the most!",
        position: 'bottom',
    },
    {
        selector: '[data-tour-id="software-filters"]',
        title: "Filter Your Search",
        content: "Refine your software search by cost. You can look for free, freemium, or paid applications to match your needs.",
        position: 'bottom',
    },
    {
        selector: '[data-tour-id="chat-input"]',
        title: "Start a Conversation",
        content: "This is where the magic happens. Ask for any software, game, or driver. For example, try 'Find a photo editor for Windows'.",
        position: 'top',
    },
    {
        selector: '[data-tour-id="clear-history"]',
        title: "Clear Your Conversation",
        content: "Want a fresh start? Click the trash icon to clear your entire chat history. This action cannot be undone.",
        position: 'bottom',
    },
    {
        selector: '[data-tour-id="header-profile-link"]',
        title: "Manage Your Profile",
        content: "Sign in to save your chat history. Once logged in, you can manage your profile, avatar, and saved devices here.",
        position: 'bottom',
    },
    {
        selector: '[data-tour-id="safety-actions"]',
        title: "Quick Safety Actions",
        content: "Explore these cards for helpful tips and step-by-step guides on keeping your PC safe and running smoothly.",
        position: 'left',
    },
];


interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const step = tourSteps[currentStep];
        const targetElement = document.querySelector(step.selector) as HTMLElement;

        if (targetElement) {
            // Add highlight class
            targetElement.classList.add('tour-highlight');

            const targetRect = targetElement.getBoundingClientRect();
            const tooltipRect = tooltipRef.current?.getBoundingClientRect();
            
            let top = 0, left = 0;
            const offset = 12; // Space between element and tooltip

            if(tooltipRect) {
                switch(step.position) {
                    case 'top':
                        top = targetRect.top - tooltipRect.height - offset;
                        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                        break;
                    case 'bottom':
                        top = targetRect.bottom + offset;
                        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                        break;
                     case 'left':
                        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                        left = targetRect.left - tooltipRect.width - offset;
                        break;
                    case 'right':
                        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                        left = targetRect.right + offset;
                        break;
                    // Add other positions if needed
                    default: // bottom
                        top = targetRect.bottom + offset;
                        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                }
            }

            setTooltipStyle({
                top: `${top}px`,
                left: `${left}px`,
                position: 'fixed'
            });
            
             // Scroll to the element if it's not in view
             targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }

        return () => {
            if (targetElement) {
                targetElement.classList.remove('tour-highlight');
            }
        };
    }, [currentStep, isOpen]);

    if (!isOpen) {
        return null;
    }

    const nextStep = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentStepData = tourSteps[currentStep];

    return (
        <div className="tour-overlay" onClick={onClose}>
            <div
                ref={tooltipRef}
                className="tour-tooltip"
                style={tooltipStyle}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`tour-tooltip-arrow ${currentStepData.position || 'bottom'}`}></div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{currentStepData.title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                        <CloseIcon />
                    </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{currentStepData.content}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {currentStep + 1} / {tourSteps.length}
                    </span>
                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button onClick={prevStep} className="px-3 py-1.5 text-sm font-semibold bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                                Back
                            </button>
                        )}
                        <button onClick={nextStep} className="px-3 py-1.5 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700">
                            {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
