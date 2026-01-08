


import React, { useState } from 'react';
import { RestoreIcon, CleanIcon, VirusScanIcon, UpdateIcon, ChevronLeftIcon, ChevronRightIcon, KeyboardIcon, UserPlusIcon, ShieldExclamationIcon, LockIcon, CloudUploadIcon } from './Icons';
import type { SafetyActionId } from '../types';

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
            description: "Before installing new software, it's wise to create a restore point. This acts like a 'snapshot' of your system's most important files at a specific moment in time. Think of it as a safety net that lets you undo system changes if an installation causes unexpected problems. If something goes wrong, you can revert your computer back to its previous state without affecting your personal files like documents or photos. It's a simple, powerful way to protect your PC from potential issues.",
            icon: <RestoreIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'clean',
            title: "Clean Temporary Files",
            description: "Over time, your PC accumulates temporary files from applications and web browsing that are no longer needed. While mostly harmless, these files can take up valuable disk space and eventually contribute to a slower system. Regularly cleaning them out is a simple housekeeping task that can free up storage and help your computer run more efficiently. It's like decluttering your digital workspace, ensuring everything stays tidy and performs at its best. Taking a moment to do this can make a noticeable difference.",
            icon: <CleanIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'virus-scan',
            title: "Run a Quick Virus Scan",
            description: "Your PC's security is paramount in protecting your personal information from threats. Windows includes a powerful built-in tool called Microsoft Defender that can scan for viruses, malware, and other malicious software. Running a quick scan regularly is an excellent habit to ensure no threats are hiding on your system. This process is fast, runs in the background, and provides essential peace of mind. Keeping your antivirus active and scanning periodically is your first line of defense against online dangers.",
            icon: <VirusScanIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'check-updates',
            title: "Check for Updates",
            description: "Keeping Windows up-to-date is one of the most critical things you can do for your PC's security and stability. These updates from Microsoft include vital security patches that protect you from the latest online threats and vulnerabilities. They also often include performance improvements, bug fixes, and occasionally new features to enhance your experience. Neglecting updates can leave your system exposed and cause compatibility issues with new software. Always ensure your system is current to keep it running safely and smoothly.",
            icon: <UpdateIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'shortcuts',
            title: "Learn Useful Shortcuts",
            description: "Boost your productivity with Windows keyboard shortcuts. Many common tasks can be done much faster without reaching for the mouse. Learning a few key combinations can streamline your workflow and save you time every day. From managing windows to quickly accessing system tools, these simple tricks are easy to learn and can make a big difference in how you use your PC. Impress your friends with your new-found speed and efficiency.",
            icon: <KeyboardIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'new-user',
            title: "Create a New User Account",
            description: "Sharing your PC? Create a separate user account for family members or guests. This keeps everyone's files, settings, and browsing history private and separate. It's also a great security practice, as you can create standard accounts without administrative rights, preventing accidental system changes. Each user gets their own personalized desktop and documents, making for a cleaner and more organized shared computer experience for everyone.",
            icon: <UserPlusIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'wipe-pc',
            title: "Securely Wipe Your PC",
            description: "Selling or giving away your computer? It's crucial to securely wipe your personal data first. Simply deleting files doesn't permanently remove them, and they can often be recovered. Windows has a built-in feature to reset your PC and securely erase all your personal information, applications, and settings. This ensures your private data doesn't fall into the wrong hands. Taking this step provides peace of mind when parting with an old device.",
            icon: <ShieldExclamationIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'recover-password',
            title: "Recover a Lost Password",
            description: "Forgot your Windows login password? Don't panic, there are ways to get back into your account. The recovery process depends on whether you use a Microsoft account or a local account to log in. For Microsoft accounts, you can reset your password online from any device. For local accounts, you can use a password reset disk if you created one beforehand. Following the correct steps can help you regain access to your PC without losing your files.",
            icon: <LockIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
        },
        {
            id: 'backup-onedrive',
            title: "Back Up Your PC to OneDrive",
            description: "Protect your important files from hardware failure or accidental deletion by backing them up to the cloud. Microsoft OneDrive is integrated into Windows, making it easy to automatically sync your Desktop, Documents, and Pictures folders. This ensures your most critical data is safe and accessible from any device. Setting up a backup is a simple, one-time process that provides continuous protection and peace of mind. Don't wait until it's too late to secure your precious memories and important work.",
            icon: <CloudUploadIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
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
        <div className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-green-100 dark:bg-green-900/50 rounded-full">
                    {currentAction.icon}
                </div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200">{currentAction.title}</h4>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 min-h-[120px] mt-3">
                {currentAction.description.substring(0, 310)}...
            </p>
            
            <button
                onClick={() => onActionClick(currentAction.id)}
                className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline self-start mt-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500"
            >
                Learn How →
            </button>

            <div className="flex items-center justify-between mt-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                 <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-green-500" aria-label="Previous tip">
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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
                    <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
            </div>
        </div>
    );
};

export default QuickSafetyActions;