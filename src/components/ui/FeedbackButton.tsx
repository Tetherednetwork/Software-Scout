import React, { useState } from 'react';
import { MessageBubbleIcon } from './Icons';
import FeedbackModal from '../modals/FeedbackModal';
import type { Session, FullUserProfile } from '../../types';

interface FeedbackButtonProps {
    session: Session | null;
    userProfile: FullUserProfile | null;
    onSuccess: (message: string) => void;
    onLoginClick: () => void;
    onProfileClick: () => void;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ session, userProfile, onSuccess, onLoginClick, onProfileClick }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-5 right-5 z-40 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                aria-label="Open feedback form"
            >
                <MessageBubbleIcon className="h-6 w-6" />
            </button>
            <FeedbackModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                session={session}
                userProfile={userProfile}
                onSuccess={onSuccess}
                onLoginClick={onLoginClick}
                onProfileClick={onProfileClick}
            />
        </>
    );
};

export default FeedbackButton;
