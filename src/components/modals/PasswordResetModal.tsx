import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { CloseIcon, EyeIcon, EyeOffIcon, SuccessIcon } from '../ui/Icons';

interface PasswordResetModalProps {
    onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password should be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        // Use authService (Firebase) to update password
        const { error: updateError } = await authService.updatePassword(password);

        setIsLoading(false);

        if (updateError) {
            setError(updateError.message);
        } else {
            setMessage("Your password has been updated successfully. You can now close this and sign in.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                    <CloseIcon />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Set New Password</h2>

                    {message ? (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-center flex flex-col items-center gap-3">
                            <SuccessIcon className="h-10 w-10 text-green-500" />
                            <div>
                                <h3 className="font-semibold text-lg">Password Updated!</h3>
                                <p className="text-sm">{message}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-2 text-sm font-semibold text-green-600 dark:text-green-400 hover:underline"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordReset} className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        id="new-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg p-3 pr-10 focus:ring-2 focus:ring-[#4F8A54] focus:outline-none"
                                        placeholder="••••••••" required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        id="confirm-new-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg p-3 pr-10 focus:ring-2 focus:ring-[#4F8A54] focus:outline-none"
                                        placeholder="••••••••" required
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                            <button type="submit" disabled={isLoading} className="w-full px-6 py-3 bg-[#355E3B] text-white font-semibold rounded-lg hover:bg-[#2A482E] transition-colors disabled:bg-green-300 disabled:cursor-not-allowed">
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PasswordResetModal;
