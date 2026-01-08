import React, { useState, useEffect, useCallback } from 'react';
import { QuestionMarkCircleIcon, ShieldCheckIcon, SparklesIcon, LockIcon, CloseCircleIcon, UserIcon, CogIcon, LaptopIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon } from '../components/ui/Icons';
import TrustpilotWidget from '../components/ui/TrustpilotWidget';


const AboutPage: React.FC = () => {
    // The "Talk to the Monk" button should navigate to the homepage where the chat is.
    const handleTalkToMonkClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
            // Dispatch popstate to trigger App's router
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
    };

    const slides = [
        {
            id: 1,
            title: "BUILT FOR EVERYONE",
            text: "Whether you're an everyday user getting started or an IT admin deploying at scale, SoftMonk simplifies finding software securely.",
            buttonText: "Explore Use Cases",
            image: "/images/everyone_softmonk.png",
            logo: null,
            imageStyle: 'free'
        },
        {
            id: 2,
            title: "GUIDE TO SAFER DOWNLOAD",
            text: "At SoftMonk, we're dedicated to making software downloads simple, transparent, and secure for everyone. No tricks, no malware—just the right files from the right sources.",
            buttonText: "Talk to the Monk",
            image: "/images/landing.png",
            logo: "/images/logo.png"
        },
        {
            id: 3,
            title: "DISCOVER VERIFIED SOFTWARE",
            text: "We help you find software from official sources, avoiding risky third-party sites that bundle unwanted software. Your security is our priority.",
            buttonText: "Find Software",
            image: "/images/softmonk_search.png",
            logo: null,
            imageStyle: 'free',
            scale: 0.85
        },
        {
            id: 4,
            title: "GUIDED DRIVER FINDER",
            text: "Our step-by-step wizard helps you find the exact driver for your PC, ensuring compatibility and security with every download.",
            buttonText: "Get Drivers",
            image: "/images/softmonk_path.png",
            logo: null,
            imageStyle: 'free',
            scale: 0.85
        },
        {
            id: 5,
            title: "SAFE SOFTWARE, VERIFIED SOURCES.",
            text: "No bundleware, no misleading ads. We are committed to complete transparency and providing a safe, trustworthy experience.",
            buttonText: "Learn More",
            image: "/images/softmonk_peace.png",
            logo: null,
            imageStyle: 'free'
        }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    }, [slides.length]);

    const prevSlide = () => {
        setCurrentIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    useEffect(() => {
        const slideInterval = setInterval(nextSlide, 5000); // Auto-scroll every 5 seconds
        return () => clearInterval(slideInterval);
    }, [nextSlide]);


    return (
        // The page wrapper now allows the global animated background to show through.
        <div>
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* The main hero card */}
                <div className="rounded-3xl overflow-hidden relative">
                    {/* Decorative gradient swoosh */}
                    <div className="absolute top-0 right-0 -mt-24 -mr-24 w-[500px] h-[500px] bg-gradient-to-br from-green-100 to-lime-100 dark:from-green-900/30 dark:to-lime-900/10 rounded-full blur-3xl opacity-80"></div>

                    <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                        {slides.map(slide => (
                            <div key={slide.id} className="w-full flex-shrink-0">
                                <div className="relative p-8 sm:p-12 lg:p-16">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">
                                        {/* Left Column: Text content */}
                                        <div className="space-y-6 text-center lg:text-left z-10">
                                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight leading-tight min-h-[176px] sm:min-h-56 lg:min-h-80 flex items-center">
                                                {slide.title}
                                            </h1>
                                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto lg:mx-0 min-h-[100px]">
                                                {slide.text}
                                            </p>
                                            <button
                                                onClick={handleTalkToMonkClick}
                                                className="inline-block bg-gradient-to-r from-lime-400 to-green-600 text-white font-bold py-4 px-10 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                                            >
                                                {slide.buttonText}
                                            </button>
                                        </div>

                                        {/* Right Column: Image content */}
                                        <div className="relative lg:h-full flex flex-col justify-center items-center">
                                            {(slide as any).imageStyle === 'free' ? (
                                                <div className="relative w-full max-w-lg mx-auto">
                                                    <img
                                                        src={slide.image}
                                                        alt="SoftMonk application feature"
                                                        className="relative w-full"
                                                        style={{ transform: (slide as any).scale ? `scale(${(slide as any).scale})` : 'none' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center lg:items-start space-y-4 text-center lg:text-left">
                                                    {slide.logo && (
                                                        <img src={slide.logo} alt="SoftMonk Logo" className="h-24 w-auto mx-auto lg:mx-0" />
                                                    )}
                                                    <div className="relative w-full max-w-lg mx-auto">
                                                        <img
                                                            src={slide.image}
                                                            alt="SoftMonk application screenshot"
                                                            className="relative w-full rounded-xl shadow-2xl border-4 border-white dark:border-gray-700"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                     {/* Slider Controls */}
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 dark:bg-gray-700/50 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-white">
                        <ChevronLeftIcon className="h-6 w-6 text-gray-800 dark:text-white" />
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/50 dark:bg-gray-700/50 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-white">
                        <ChevronRightIcon className="h-6 w-6 text-gray-800 dark:text-white" />
                    </button>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-2 w-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-6 bg-green-500' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'}`}
                                aria-label={`Go to slide ${index + 1}`}
                                aria-current={currentIndex === index ? 'true' : undefined}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-12 space-y-12">
                    {/* Core Principles Section */}
                    <section>
                        <div className="max-w-2xl mx-auto text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
                                Our Core Principles
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-8 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
                                        <HeartIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Our Mission</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    To empower every user to find and install software safely. We provide a direct path to the software you need, without the tricks, malware, or bloatware.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-8 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
                                        <CogIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">How It Works</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Our AI intelligently searches for official sources, verifies authenticity, and presents clear, concise information with direct download links.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-8 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
                                        <ShieldCheckIcon className="h-8 w-8" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Commitment to Safety</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    We point you to vendor pages, flag fake mirrors, show file hashes and signatures when available, and guide you through clean installations.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 3-Step Process Section */}
                    <section>
                        <div className="max-w-xl mx-auto text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
                                Our Simple 3-Step Process
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl shadow-lg p-8 border border-green-200 dark:border-green-700 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white dark:bg-green-900/50 p-3 rounded-full">
                                        <QuestionMarkCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Ask & Clarify</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Tell our AI what you need. It asks clarifying questions to pinpoint the exact software or driver, ensuring you get the right version for your system.
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl shadow-lg p-8 border border-green-200 dark:border-green-700 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white dark:bg-green-900/50 p-3 rounded-full">
                                        <ShieldCheckIcon className="h-8 w-8" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Verify & Link</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    The AI scours the web for the official source, verifying its authenticity and avoiding risky third-party sites that bundle unwanted software.
                                </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl shadow-lg p-8 border border-green-200 dark:border-green-700 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white dark:bg-green-900/50 p-3 rounded-full">
                                        <SparklesIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Guide & Support</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Receive a direct download link, file details, and step-by-step installation help to ensure a clean, safe setup every time.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Security Foundation Section */}
                     <section>
                        <div className="max-w-xl mx-auto text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
                                Your Security is Our Foundation
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-2xl border-2 border-green-200 dark:border-green-700">
                                <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">What We Do</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3"><LockIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Link Directly to Official Sources</span></li>
                                    <li className="flex items-center gap-3"><LockIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Verify File Hashes & Signatures</span></li>
                                    <li className="flex items-center gap-3"><LockIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Prefer Offline Installers</span></li>
                                    <li className="flex items-center gap-3"><LockIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Provide Clear Installation Guidance</span></li>
                                </ul>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl border-2 border-red-200 dark:border-red-700">
                                <h3 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">What We Avoid</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3"><CloseCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Third-Party Download Portals</span></li>
                                    <li className="flex items-center gap-3"><CloseCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Installers with Bundled Adware</span></li>
                                    <li className="flex items-center gap-3"><CloseCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Misleading Ads & Fake Buttons</span></li>
                                    <li className="flex items-center gap-3"><CloseCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">Linking to Unverified Mirrors</span></li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Built for Everyone Section */}
                    <section>
                        <div className="max-w-xl mx-auto text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
                                Built for Everyone
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-8 text-center">
                                <div className="flex justify-center mb-6"><div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full"><UserIcon className="h-8 w-8 text-green-600 dark:text-green-400" /></div></div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Everyday Users</h3>
                                <p className="text-gray-600 dark:text-gray-300">Get the software you need without worrying about viruses or confusing installation processes.</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-8 text-center">
                                <div className="flex justify-center mb-6"><div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full"><CogIcon className="h-8 w-8 text-green-600 dark:text-green-400" /></div></div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">IT Admins</h3>
                                <p className="text-gray-600 dark:text-gray-300">Find verified drivers and software with hashes for secure, repeatable deployments across your organization.</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-2xl p-8 text-center">
                                <div className="flex justify-center mb-6"><div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full"><LaptopIcon className="h-8 w-8 text-green-600 dark:text-green-400" /></div></div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Power Users</h3>
                                <p className="text-gray-600 dark:text-gray-300">Quickly locate official sources and silent install commands for streamlined setups and scripting.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 border-t border-gray-200 dark:border-gray-700 mt-4">
                <TrustpilotWidget />
            </div>
        </div>
    );
};

export default AboutPage;
