import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, FullUserProfile } from '../../types';
import { authService } from '../../services/authService';
import { UserIcon, LogoutIcon } from '../ui/Icons';

interface UserInfoPanelProps {
    session: Session | null;
    userProfile: FullUserProfile | null;
    onProfileClick: () => void;
}

export const UserInfoPanel: React.FC<UserInfoPanelProps> = ({ session, userProfile, onProfileClick }) => {
    const [speed, setSpeed] = useState<number>(0);
    const [isTestingSpeed, setIsTestingSpeed] = useState<boolean>(false);
    const [speedTestError, setSpeedTestError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ country: string; code: string; } | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleLogout = async () => {
        const { error } = await authService.signOut();
        if (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        } else {
            // Reload to clear state
            window.location.reload();
        }
    };

    // Fetch location once on mount
    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const fetchLocation = async () => {
            setIsFetchingLocation(true);
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
                    setIsFetchingLocation(false);
                }
            }
        };

        fetchLocation();

        return () => controller.abort();
    }, []);

    // Cleanup effect for aborting speed test on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const runSpeedTest = useCallback(async () => {
        // If abortControllerRef has a controller, a test is running. So, cancel it.
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            // The currently running async function will handle state cleanup in its finally block.
            return;
        }

        // No test running, so let's start one.
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsTestingSpeed(true);
        setSpeed(0);
        setSpeedTestError(null);

        // Using a smaller 10MB file to reduce timeouts on slower connections.
        const testFileUrl = 'https://speed.cloudflare.com/__down?bytes=10000000';

        try {
            const response = await fetch(`${testFileUrl}&t=${Date.now()}`, {
                signal: controller.signal,
                cache: 'no-store'
            });

            if (!response.ok || !response.body) {
                throw new Error('Speed test file could not be downloaded.');
            }

            const reader = response.body.getReader();
            let receivedLength = 0;
            const startTime = Date.now();

            // Throttle UI updates to avoid excessive re-renders.
            let lastUiUpdateTime = 0;
            const uiUpdateInterval = 200; // ms

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                receivedLength += value.length;

                const now = Date.now();
                if (now - lastUiUpdateTime > uiUpdateInterval) {
                    const durationInSeconds = (now - startTime) / 1000;
                    if (durationInSeconds > 0) {
                        const speedMbps = (receivedLength * 8) / (durationInSeconds * 1024 * 1024);
                        setSpeed(speedMbps);
                    }
                    lastUiUpdateTime = now;
                }
            }

            const endTime = Date.now();
            const finalDuration = (endTime - startTime) / 1000;
            if (finalDuration > 0) {
                const finalSpeedMbps = (receivedLength * 8) / (finalDuration * 1024 * 1024);
                setSpeed(finalSpeedMbps);
            } else {
                setSpeed(0);
            }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Speed test failed:", error);
                setSpeedTestError("Test failed");
                setSpeed(0); // Show 0 on error.
            } else {
                // User cancelled the test. Reset speed to 0.
                setSpeedTestError(null);
                setSpeed(0);
            }
        } finally {
            // Only set testing to false and nullify the ref if this is the controller
            // that was running. This prevents race conditions where a user might
            // cancel and immediately start a new test.
            if (abortControllerRef.current === controller) {
                setIsTestingSpeed(false);
                abortControllerRef.current = null;
            }
        }
    }, []); // Empty dependency array makes the function stable

    const speedColorClass = speed > 25 ? 'text-green-500' : speed > 5 ? 'text-yellow-500' : 'text-red-500';

    const avatarUrl = userProfile?.custom_avatar_url || userProfile?.avatar_url;

    const ProfileSection = () => (
        <div className="flex items-center gap-3">
            {session && (
                <div className="w-10 h-10 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="h-7 w-7 text-gray-500 dark:text-gray-400" />
                    )}
                </div>
            )}
            <div className="min-w-0">
                <p className="font-bold text-gray-800 dark:text-white text-base truncate">
                    {session ? `Welcome, ${userProfile?.username || ''}!` : 'Welcome, Guest!'}
                </p>
                {session && !userProfile?.username && (
                    <p className="text-xs text-gray-500 dark:text-white">
                        Please set a nickname in your profile.
                    </p>
                )}
                {!session && (
                    <p className="text-sm text-gray-500 dark:text-white">Sign in to save your history.</p>
                )}
            </div>
        </div>
    );


    return (
        <div className="flex flex-col gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 w-full">
            <div data-tour-id="profile-section">
                {session ? (
                    <button
                        onClick={onProfileClick}
                        className="text-left w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                        aria-label="Open profile settings"
                    >
                        <ProfileSection />
                    </button>
                ) : (
                    <ProfileSection />
                )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                <div className="flex items-center justify-between text-sm" title={location ? `Location: ${location.country}` : 'Fetching location...'}>
                    <span className="font-semibold text-gray-600 dark:text-white">Location</span>
                    {isFetchingLocation ? (
                        <div className="h-5 w-12 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    ) : location ? (
                        <img
                            src={`https://flagcdn.com/h20/${location.code.toLowerCase()}.png`}
                            alt={`${location.country} flag`}
                            className="h-5 object-contain rounded-sm"
                        />
                    ) : <span className="text-gray-400">N/A</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-600 dark:text-white">Speed Test</span>
                    <button
                        onClick={runSpeedTest}
                        data-tour-id="speed-test"
                        className={`font-semibold transition-colors rounded-md px-2 -mx-2 py-1 -my-1 focus:outline-none focus-visible:ring-green-500 ${isTestingSpeed ? 'text-yellow-500' : (speed > 0 ? speedColorClass : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300')}`}
                        title={isTestingSpeed ? "Test in progress... Click to cancel" : "Click to check your internet speed"}
                    >
                        {isTestingSpeed ? (
                            <span className="flex items-center gap-2">
                                <span>{speed.toFixed(1)} <span className="text-xs font-normal text-gray-500 dark:text-white">Mbps</span></span>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                </span>
                            </span>
                        ) : speedTestError ? (
                            <span className="text-red-500">Failed! Retry?</span>
                        ) : speed > 0 ? (
                            <>
                                {speed.toFixed(1)} <span className="text-xs font-normal text-gray-500 dark:text-white">Mbps</span>
                            </>
                        ) : (
                            'Check Speed'
                        )}
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                {session && (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                        <LogoutIcon className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                )}
            </div>

        </div>
    );
};
