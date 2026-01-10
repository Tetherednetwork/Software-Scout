import React, { useState, useEffect } from 'react';
import type { Session, Page } from '../../types';
import { CloseIcon, InformationIcon, FileIcon, AccessibilityIcon, CogIcon } from '../ui/Icons';
import NotificationBell from './NotificationBell';
import ThemeSwitcher from '../ui/ThemeSwitcher';

interface HeaderProps {
    session: Session | null;
    isAdmin: boolean;
    currentPage: Page;
    onNavClick: (page: Page) => void;
    onLoginClick: () => void;
    onProfileClick: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onStartTour: () => void;
    onOpenDownloadHistoryModal: () => void;
}

const MenuIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ session, isAdmin, currentPage, onNavClick, onLoginClick, onProfileClick, theme, toggleTheme, onStartTour, onOpenDownloadHistoryModal }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const topBarMessages = [
        "No clutter. No risk. Just the right software, for any device.",
        "SoftMonk helps you find safe software across Windows, macOS, Linux, Android, and games.",
        "SoftMonk is built with AI and guided by cybersecurity experts.",
        "We avoid adware links and download managers.",
        "Coming Soon: A Windows helper app for auto-detect and file checks."
    ];
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % topBarMessages.length);
        }, 5000); // Change message every 5 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [topBarMessages.length]);

    const navLinks: { name: string; page: Page; tourId?: string; icon?: React.ReactNode }[] = [
        { name: 'SoftMonk', page: 'home' },
        { name: 'About', page: 'about' },
        { name: 'Community Forum', page: 'forum' },
        { name: 'File Verifier', page: 'file-verifier', tourId: 'file-verifier-link' },
    ];

    if (isAdmin) {
        navLinks.push({ name: 'Admin', page: 'admin' as const, icon: <CogIcon /> });
    }

    const NavLink: React.FC<{ name: string; page: Page; tourId?: string; isMobile?: boolean; icon?: React.ReactNode; }> = ({ name, page, tourId, isMobile, icon }) => (
        <button
            data-tour-id={tourId}
            onClick={() => {
                onNavClick(page);
                if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`font-semibold transition-colors rounded-md flex items-center ${isMobile ? 'w-full text-left p-3 text-lg' : 'px-4 py-2 text-lg relative nav-link-hover'} ${currentPage === page ? 'text-amber-500 dark:text-amber-400 nav-link-active' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {name}
        </button>
    );

    return (
        <header className="sticky top-0 z-40 isolation-isolate">
            {/* Top Bar */}
            <div className="hidden sm:block bg-primary-gradient text-white text-sm font-semibold">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center h-9 overflow-hidden">
                    <img src="/images/right.png" alt="Monk pointing right" className="h-8 w-auto mr-3 flex-shrink-0" />
                    <p key={currentMessageIndex} className="top-bar-text-animated text-center">
                        {topBarMessages[currentMessageIndex]}
                    </p>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <button onClick={() => onNavClick('home')} className="flex items-center">
                                <img src="/images/logo.png" alt="SoftMonk Icon" className="h-16 w-auto block dark:hidden" />
                                <img src="/images/SoftMonk_logo_2.png" alt="SoftMonk Icon" className="h-16 w-auto hidden dark:block" />
                            </button>
                        </div>

                        {/* Desktop Links */}
                        <div className="hidden lg:flex items-center gap-2" data-tour-id="main-nav">
                            {navLinks.map(link => <NavLink key={link.page} {...link} />)}
                        </div>

                        {/* Right Side Controls & Hamburger */}
                        <div className="flex items-center gap-2">
                            <div className="hidden lg:flex items-center gap-2">
                                <div className="flex items-center gap-4" data-tour-id="header-profile-link">
                                    {session ? (
                                        <div className="flex items-center gap-4">
                                            <button onClick={onProfileClick} className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg">
                                                <img src={session.user?.user_metadata?.custom_avatar_url || session.user?.user_metadata?.avatar_url || '/images/logo.png'} alt="user avatar" className="h-8 w-8 rounded-full object-cover" />
                                                <span>My Profile</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button onClick={onLoginClick} className="text-lg font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2 rounded-md">
                                                Login
                                            </button>
                                            <button onClick={onLoginClick} className="text-lg font-semibold text-white bg-primary-gradient transition-colors px-4 py-2 rounded-md">
                                                Sign Up
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {session && <NotificationBell session={session} />}

                                {session && <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>}

                                <button
                                    onClick={onStartTour}
                                    className="p-3 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[#4F8A54]"
                                    aria-label="Start Guided Tour"
                                    title="Start Guided Tour"
                                >
                                    <InformationIcon className="h-5 w-5" />
                                </button>

                                <button
                                    onClick={onOpenDownloadHistoryModal}
                                    data-tour-id="download-history"
                                    className="p-3 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[#4F8A54]"
                                    aria-label="Download History"
                                    title="Download History"
                                >
                                    <FileIcon className="h-5 w-5" />
                                </button>

                                <button
                                    className="p-3 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[#4F8A54]"
                                    aria-label="Accessibility Options"
                                    title="Accessibility Options"
                                >
                                    <AccessibilityIcon className="h-5 w-5" />
                                </button>

                                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                            </div>
                            {/* Hamburger Menu Button */}
                            <div className="lg:hidden flex items-center gap-2">
                                {session && <NotificationBell session={session} />}
                                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4F8A54]"
                                    aria-controls="mobile-menu"
                                    aria-expanded={isMobileMenuOpen}
                                >
                                    <span className="sr-only">Open main menu</span>
                                    {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden" id="mobile-menu">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
                            {navLinks.map(link => <NavLink key={link.page} {...link} isMobile />)}
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                {session ? (
                                    <div className="px-3 space-y-2">
                                        <button onClick={() => { onProfileClick(); setIsMobileMenuOpen(false); }} className="block w-full text-left p-3 text-lg font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md">
                                            My Profile
                                        </button>
                                    </div>
                                ) : (
                                    <div className="px-3 space-y-2">
                                        <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="block w-full text-left p-3 text-lg font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md">
                                            Login
                                        </button>
                                        <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-lg font-semibold rounded-md text-white bg-primary-gradient">
                                            Sign Up
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
