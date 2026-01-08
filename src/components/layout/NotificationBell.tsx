import React, { useState, useEffect, useRef } from 'react';
import { getUnreadCount } from '../../services/notificationService';
import type { Session } from '../../types';
import NotificationDropdown from './NotificationDropdown';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const BellIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const NotificationBell: React.FC<{ session: Session }> = ({ session }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Create a persistent audio context
    const audioContextRef = useRef<AudioContext | null>(null);
    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }, []);

    // Function to play a sound
    const playNotificationSound = () => {
        const audioCtx = audioContextRef.current;
        if (audioCtx && audioCtx.state !== 'closed') {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Low volume
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
        }
    };

    // Initial fetch of unread count
    useEffect(() => {
        const fetchCount = async () => {
            const count = await getUnreadCount(session.user.id);
            setUnreadCount(count);
        };
        fetchCount();
    }, [session.user.id]);

    // Realtime subscription for new notifications
    useEffect(() => {
        const q = query(
            collection(db, 'notifications'),
            where('recipient_user_id', '==', session.user.id),
            where('is_read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    playNotificationSound();
                }
            });
        });

        return () => {
            unsubscribe();
        };
    }, [session.user.id]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsDropdownOpen(prev => !prev);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className="p-3 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
                aria-label={`Notifications (${unreadCount} unread)`}
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-gray-800">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {isDropdownOpen && (
                <NotificationDropdown
                    session={session}
                    onClose={() => setIsDropdownOpen(false)}
                    onNotificationsRead={() => setUnreadCount(0)}
                />
            )}
        </div>
    );
};

export default NotificationBell;
