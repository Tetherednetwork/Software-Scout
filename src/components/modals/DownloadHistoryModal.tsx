import React, { useState } from 'react';
import type { DownloadHistoryItem } from '../../types';
import { CloseIcon, DownloadIcon, HistoryIcon, SoftwareIcon, WrenchIcon, SuccessIcon, CloseCircleIcon, TrashIcon } from '../ui/Icons';

interface DownloadHistoryModalProps {
    history: DownloadHistoryItem[];
    onClose: () => void;
    onUpdateStatus: (itemId: string | number, status: 'verified' | 'failed') => void;
    onDeleteItem: (itemId: string | number) => void;
}

const DownloadHistoryModal: React.FC<DownloadHistoryModalProps> = ({ history, onClose, onUpdateStatus, onDeleteItem }) => {
    const [checkingId, setCheckingId] = useState<string | number | null>(null);

    const handleDownloadAttempt = async (item: DownloadHistoryItem) => {
        if (!item.url) return;
        setCheckingId(item.id);
        try {
            // Use 'no-cors' to avoid cross-origin issues. We can't read the response,
            // but a successful opaque response indicates the link is likely valid.
            await fetch(item.url, { mode: 'no-cors' });
            onUpdateStatus(item.id, 'verified');
            window.open(item.url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Download link check failed:', error);
            onUpdateStatus(item.id, 'failed');
        } finally {
            setCheckingId(null);
        }
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const StatusIndicator: React.FC<{ status?: 'verified' | 'failed' }> = ({ status }) => {
        if (!status) return null;

        if (status === 'verified') {
            return (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
                    <SuccessIcon className="h-4 w-4" />
                    <span>Verified</span>
                </div>
            );
        }

        if (status === 'failed') {
            return (
                <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">
                    <CloseCircleIcon className="h-4 w-4" />
                    <span>Failed</span>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-green-100 dark:bg-green-900/50 rounded-full">
                        <HistoryIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Download History</h2>
                        <p className="text-sm text-gray-500 dark:text-white">A record of all software and drivers you've downloaded.</p>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-2 sm:p-4 overflow-y-auto max-h-96">
                    {history.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {history.map((item) => (
                                <li key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="flex-shrink-0">
                                            {item.type === 'software' ? <SoftwareIcon /> : <WrenchIcon />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800 dark:text-white truncate" title={item.software_name}>{item.software_name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-sm text-gray-500 dark:text-white">{formatDate(item.timestamp)}</p>
                                                <StatusIndicator status={item.status} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {item.url ? (
                                            <button
                                                onClick={() => handleDownloadAttempt(item)}
                                                disabled={checkingId === item.id}
                                                aria-label={`Download ${item.software_name} again`}
                                                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-wait w-36"
                                            >
                                                {checkingId === item.id ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <DownloadIcon />
                                                        <span>Download Again</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <span
                                                aria-label="Download link is unavailable"
                                                title="Download link is unavailable"
                                                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-white text-sm font-semibold rounded-md cursor-not-allowed w-36"
                                            >
                                                <DownloadIcon />
                                                <span>Unavailable</span>
                                            </span>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete "${item.software_name}" from your history? This action cannot be undone.`)) {
                                                    onDeleteItem(item.id);
                                                }
                                            }}
                                            title="Delete from history"
                                            aria-label={`Delete ${item.software_name} from history`}
                                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-16 px-4">
                            <div className="w-16 h-16 mx-auto flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                                <HistoryIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white">No downloads yet</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-white">When you download software or a driver, it will appear here.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-right rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadHistoryModal;
