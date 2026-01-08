
import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationsAsRead } from '../../services/notificationService';
import type { Notification, Session } from '../../types';

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    return `${Math.floor(seconds)}s`;
};

interface NotificationDropdownProps {
    session: Session;
    onClose: () => void;
    onNotificationsRead: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ session, onClose, onNotificationsRead }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndMark = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedNotifications = await getNotifications(session.user.id);
                setNotifications(fetchedNotifications);
                await markNotificationsAsRead(session.user.id);
                onNotificationsRead(); // Notify parent to update count immediately
            } catch (error: any) {
                console.error("Failed to fetch notifications:", error);
                // Use the specific error message from the service layer if available
                setError(error.message || "Could not load notifications.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndMark();
    }, [session.user.id, onNotificationsRead]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        // Handle only internal links, let browser handle external links and anchors on the same page
        if (url.startsWith('/')) {
            e.preventDefault(); // Prevent full page reload for internal links
            
            // Navigate using history API
            window.history.pushState({}, '', url);
            // Dispatch a popstate event to make App.tsx's router react to the change
            window.dispatchEvent(new PopStateEvent('popstate'));
            
            onClose();
        } else {
            // For external links or anchor links, just close the dropdown
            onClose();
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>;
        }
        if (error) {
            return <p className="p-4 text-center text-sm text-red-500">{error}</p>;
        }
        if (notifications.length === 0) {
            return <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No new notifications.</p>;
        }
        return (
            <ul>
                {notifications.map(notification => {
                    const path = notification.link_url || '#';
                    return (
                        <li key={notification.id} className={`border-b dark:border-gray-700 last:border-b-0 ${!notification.is_read ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                            <a href={path} onClick={(e) => handleLinkClick(e, path)} className="block p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div className="flex items-start gap-3">
                                    <img src={notification.actor?.avatar_url || '/images/logo.png'} alt="Actor avatar" className="h-8 w-8 rounded-full object-cover" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 dark:text-gray-200">{notification.content}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTimeAgo(notification.created_at)}</p>
                                    </div>
                                </div>
                            </a>
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
            <div className="p-3 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default NotificationDropdown;
