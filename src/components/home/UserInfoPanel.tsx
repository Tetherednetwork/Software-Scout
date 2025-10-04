import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';
import type { Session } from '../../types';
import { UserIcon, SignInIcon, LogoutIcon } from '../ui/Icons';

interface UserInfoPanelProps {
    session: Session | null;
    onLoginClick: () => void;
    onProfileClick: () => void;
}

const SpeedIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5 text-gray-600' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);


export const UserInfoPanel: React.FC<UserInfoPanelProps> = ({ session, onLoginClick, onProfileClick }) => {
    const [speed, setSpeed] = useState<number>(0);
    const [isTestingSpeed, setIsTestingSpeed] = useState<boolean>(false);
    const [location, setLocation] = useState<{ country: string; code: string; } | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
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

        // Using a reliable, CORS-enabled public