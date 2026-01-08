import React, { useState } from 'react';
import { RestoreIcon, CleanIcon, VirusScanIcon, UpdateIcon, ChevronLeftIcon, ChevronRightIcon, KeyboardIcon, UserPlusIcon, ShieldExclamationIcon, LockIcon, CloudUploadIcon } from '../ui/Icons';
import type { SafetyActionId } from '../../types';

interface QuickSafetyActionsProps {
    onActionClick: (action: SafetyActionId) => void;
}

type SafetyAction = {
    id: SafetyActionId;
    title: string;
    description: string;
    icon: React.ReactNode;
};

const QuickSafetyActions: React.FC<QuickSafetyActionsProps> = ({ onActionClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const safetyActions: SafetyAction[] = [
        {
            id: 'restore',
            title: "Create a Restore Point",
            description: "Create a system 'snapshot' before installing software. This safety net lets you undo changes if something goes wrong, without affecting your personal files.",
            icon: <RestoreIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'clean',
            title: "Clean Temporary Files",
            description: "Your PC accumulates temporary files over time. Cleaning them out frees up disk space and helps your computer run more efficiently, like decluttering a digital workspace.",
            icon: <CleanIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'virus-scan',
            title: "Run a Quick Virus Scan",
            description: "Windows includes Microsoft Defender to scan for malware. Running a quick scan is a fast, easy habit for peace of mind and is your first line of defense against threats.",
            icon: <VirusScanIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'check-updates',
            title: "Check for Updates",
            description: "Keeping Windows updated is critical for security. Updates include vital patches against the latest threats, plus performance improvements and bug fixes.",
            icon: <UpdateIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'shortcuts',
            title: "Learn Useful Shortcuts",
            description: "Boost your productivity with Windows keyboard shortcuts. Learning a few key combinations can streamline your workflow and save you time every day.",
            icon: <KeyboardIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'new-user',
            title: "Create a New User Account",
            description: "Sharing a PC? Create separate user accounts to keep everyone's files and settings private. It's also a great security practice.",
            icon: <UserPlusIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'wipe-pc',
            title: "Securely Wipe Your PC",
            description: "Selling or giving away your computer? Securely wipe your personal data first. Windows has a built-in feature to reset your PC and erase everything.",
            icon: <ShieldExclamationIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'recover-password',
            title: "Recover a Lost Password",
            description: "Forgot your Windows login? You can recover access using a Microsoft account online or a local account's security questions.",
            icon: <LockIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'backup-onedrive',
            title: "Back Up Your PC to OneDrive",
            description: "Protect your important files from hardware failure by backing them up to OneDrive. It's easy to sync your Desktop, Documents, and Pictures folders.",
            icon: <CloudUploadIcon className="h-5 w-5 text-green-600 dark:text-green-400" />,
        },
    ];

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? safetyActions.length - 1 : prevIndex - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex === safetyActions.length - 1 ? 0 : prevIndex + 1));
    };

    const currentAction = safetyActions[currentIndex];
    
    if (!currentAction) {
        return null;
    }

    return (
        <div className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-green-100 dark:bg-green-900/50 rounded-full">
                    {currentAction.icon}
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">{currentAction.title}</h4>
            </div>

            <p className="text-xs text-gray-600 dark:text-white flex-1 mt-2">
                {currentAction.description}
            </p>
            
            <button
                onClick={() => onActionClick(currentAction.id)}
                className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline self-start mt-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500"
            >
                Learn How →
            </button>

            <div className="flex items-center justify-between mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                 <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500" aria-label="Previous tip">
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-white" />
                </button>
                <div className="flex items-center gap-1.5">
                    {safetyActions.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                currentIndex === index ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                        />
                    ))}
                </div>
                <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500" aria-label="Next tip">
                    <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-white" />
                </button>
            </div>
        </div>
    );
};

export default QuickSafetyActions;
