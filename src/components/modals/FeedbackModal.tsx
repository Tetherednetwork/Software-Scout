import React, { useState, useEffect } from 'react';
import { submitFeedback } from '../../services/feedbackService';
import type { Session, FullUserProfile } from '../../types';
import { CloseIcon } from '../ui/Icons';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session | null;
    userProfile: FullUserProfile | null;
    onSuccess: (message: string) => void;
    onLoginClick: () => void;
    onProfileClick: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, session, userProfile, onSuccess, onLoginClick, onProfileClick }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [category, setCategory] = useState<'Bug Report' | 'Feature Request' | 'General Feedback' | 'Software Request' | 'Other'>('General Feedback');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (session && userProfile) {
            setName(userProfile.username || '');
            setEmail(session.user.email || '');
        } else {
            setName('');
            setEmail('');
        }
    }, [session, userProfile, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        if (!message.trim() || !category) {
            setError('Category and message are required.');
            return;
        }
        setIsLoading(true);
        try {
            await submitFeedback({
                user_id: session?.user.id,
                name: name || null,
                email: email || null,
                category,
                message,
            });
            onSuccess('Thank you for your feedback!');
            onClose();
            // Reset form
            setMessage('');
            setCategory('General Feedback');
        } catch (err: any) {
            setError(err.message || 'Failed to submit feedback. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;
    
    // If the user is not logged in, prompt them to sign in.
    if (!session) {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative">
                     <div className="p-8 text-center space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sign In to Leave Feedback</h3>
                        <p className="text-gray-600 dark:text-gray-300">Please sign in to your account to submit feedback. This helps us track issues and get in touch if we have any questions.</p>
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    onLoginClick();
                                }}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // If the user is logged in but has no nickname, prompt them to set one.
    if (session && !userProfile?.username) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative">
                     <div className="p-8 text-center space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Set a Nickname to Continue</h3>
                        <p className="text-gray-600 dark:text-gray-300">Please set a nickname in your profile before submitting feedback. This helps our community and team address you properly.</p>
                        <div className="flex justify-center gap-4 mt-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    onProfileClick();
                                }}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                            >
                                Go to Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Submit Feedback</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Help us improve SoftMonk!</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="feedback-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                            <input 
                                id="feedback-name" 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                readOnly={!!session} 
                                placeholder={session ? "Nickname (from profile)" : "Your Name (Optional)"}
                                className={`w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 ${session ? 'text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''}`} 
                            />
                        </div>
                        <div>
                            <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input 
                                id="feedback-email" 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                readOnly={!!session} 
                                placeholder={session ? "Email (from profile)" : "Your Email (Optional)"} 
                                className={`w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2 ${session ? 'text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''}`} 
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="feedback-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                        <select id="feedback-category" value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2">
                            <option value="General Feedback">General Feedback</option>
                            <option value="Bug Report">Bug Report</option>
                            <option value="Feature Request">Feature Request</option>
                            <option value="Software Request" title="For people looking for software the app cannot find yet">Software Request</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                         <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                         <textarea id="feedback-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required placeholder="Tell us what you think..." className="w-full bg-gray-100 dark:bg-gray-700 rounded-md p-2"></textarea>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg disabled:bg-green-400">
                                {isLoading ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                         {error && <p className="text-red-500 text-sm text-right mt-2">{error}</p>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
