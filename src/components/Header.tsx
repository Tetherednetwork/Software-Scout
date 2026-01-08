import React, { useState, useEffect } from 'react';
import type { Session } from '../types';
import { authService } from '../services/authService';
import { CloseIcon, InformationIcon, FileIcon } from './ui/Icons';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
    session: Session | null;
    currentPage: string;
    onNavClick: (page: 'home' | 'about' | 'forum' | 'blogs' | 'file-verifier') => void;
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

const Header: React.FC<HeaderProps> = ({ session, currentPage, onNavClick, onLoginClick, onProfileClick, theme, toggleTheme, onStartTour, onOpenDownloadHistoryModal }) => {
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

    const handleLogout = async () => {
        await authService.signOut();
        window.location.reload();
    };

    const navLinks = [
        { name: 'Home', page: 'home' },
        { name: 'About', page: 'about' },
        { name: 'Forum', page: 'forum' },
        { name: 'Blogs', page: 'blogs' },
        { name: 'File Verifier', page: 'file-verifier', tourId: 'file-verifier-link' },
    ] as const;

    const NavLink: React.FC<{ name: string; page: typeof navLinks[number]['page']; tourId?: string; isMobile?: boolean; }> = ({ name, page, tourId, isMobile }) => (
        <button
            data-tour-id={tourId}
            onClick={() => {
                onNavClick(page);
                if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`font-semibold transition-colors rounded-md ${isMobile ? 'block w-full text-left p-3 text-lg' : 'px-4 py-2 text-lg relative nav-link-hover'} ${currentPage === page ? 'text-[#355E3B] dark:text-[#69B870]' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
        >
            {name}
        </button>
    );

    return (
        <div className="sticky top-0 z-40">
            {/* Top Bar */}
            <div className="bg-[#355E3B] text-white text-lg font-semibold">
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
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <button onClick={() => onNavClick('home')} className="flex items-center">
                                <img src="/images/logo.png" alt="SoftMonk Icon" className="h-20 w-auto" />
                            </button>
                        </div>

                        {/* Desktop Links */}
                        <div className="hidden lg:flex items-center gap-2" data-tour-id="main-nav">
                            {navLinks.map(link => <NavLink key={link.page} {...link} />)}
                        </div>

                        {/* Right Side Controls & Hamburger */}
                        <div className="flex items-center gap-2">
                            <div className="hidden lg:flex items-center gap-2">
                                {session ? (
                                    <div className="flex items-center gap-4" data-tour-id="header-profile-link">
                                        <button onClick={onProfileClick} className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg">
                                            <img src={session.user?.user_metadata?.avatar_url || '/images/logo.png'} alt="user avatar" className="h-8 w-8 rounded-full object-cover" />
                                            <span>My Profile</span>
                                        </button>
                                        <button onClick={handleLogout} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg">Logout</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button onClick={onLoginClick} className="text-lg font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2 rounded-md">
                                            Login
                                        </button>
                                        <button onClick={onLoginClick} className="text-lg font-semibold text-white bg-[#355E3B] hover:bg-[#2A482E] transition-colors px-4 py-2 rounded-md">
                                            Sign Up
                                        </button>
                                    </div>
                                )}

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
                                    className="p-3 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-[#4F8A54]"
                                    aria-label="Download History"
                                    title="Download History"
                                >
                                    <FileIcon className="h-5 w-5" />
                                </button>

                                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                            </div>
                            {/* Hamburger Menu Button */}
                            <div className="lg:hidden">
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
                                        <button onClick={handleLogout} className="block w-full text-left p-3 text-lg font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md">
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="px-3 space-y-2">
                                        <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="block w-full text-left p-3 text-lg font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md">
                                            Login
                                        </button>
                                        <button onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-lg font-semibold rounded-md text-white bg-[#355E3B] hover:bg-[#2A482E]">
                                            Sign Up
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </div>
    );
};

export default Header;
