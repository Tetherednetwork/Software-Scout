import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { CloseIcon, GoogleIcon, EyeIcon, EyeOffIcon, SuccessIcon, CloseCircleIcon } from '../ui/Icons';

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    const [viewMode, setViewMode] = useState<'signIn' | 'signUp' | 'resetPassword'>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userRole, setUserRole] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
    const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);


    const checkPasswordStrength = (password: string) => {
        let score = 0;
        const feedback = { score: 0, text: '', color: 'bg-gray-300' };
        if (password.length === 0) return feedback;

        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++; // Special character

        feedback.score = Math.min(score, 4); // Cap score at 4 for the UI

        switch (feedback.score) {
            case 0:
            case 1:
                feedback.text = 'Weak';
                feedback.color = 'bg-red-500';
                break;
            case 2:
                feedback.text = 'Fair';
                feedback.color = 'bg-orange-500';
                break;
            case 3:
                feedback.text = 'Good';
                feedback.color = 'bg-yellow-500';
                break;
            case 4:
                feedback.text = 'Strong';
                feedback.color = 'bg-green-500';
                break;
            default:
                break;
        }
        return feedback;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (viewMode === 'signUp') {
            setPasswordStrength(checkPasswordStrength(newPassword));
        }
    };


    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setEmailNotConfirmed(false);

        if (viewMode === 'signUp' && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (viewMode === 'signUp' && !userRole) {
            setError("Please select your role.");
            return;
        }

        setIsLoading(true);

        try {
            if (viewMode === 'signUp') {
                // Generate a default username from the email to prevent DB trigger errors on profile creation.
                const username_from_email = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''); // Sanitize
                const random_suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
                const defaultUsername = `${username_from_email}${random_suffix}`;

                const { error } = await authService.signUp(email, password, {
                    username: defaultUsername,
                    role: userRole
                });
                if (error) throw error;
                setMessage("Account created! You can now sign in.");
            } else {
                const { error } = await authService.signIn(email, password);
                if (error) throw error;
                // The onAuthStateChange listener in App.tsx will handle closing the modal
            }
        } catch (err: any) {
            if (err.message && err.message.toLowerCase().includes('error sending confirmation email')) {
                // Graceful failure: Assume account was created and show success message with a note.
                setMessage("Check your email for a verification link to complete your sign-up! (If you don't receive it, please try signing in later to resend the verification link).");
            } else if (err.message && err.message.toLowerCase().includes('email not confirmed')) {
                setError('Your email has not been confirmed. Please check your inbox for the verification link.');
                setEmailNotConfirmed(true);
            } else if (err.message && err.message.toLowerCase().includes('user already registered')) {
                setError('An account with this email already exists. Please Sign In or use "Forgot Password?".');
            } else {
                setError(err.error_description || err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);
        try {
            // The `redirectTo` option is deprecated for password recovery and causes domain mismatch errors.
            // Instead, the Site URL must be set in the Supabase project dashboard under
            // Authentication -> URL Configuration. Supabase will use that URL for the redirect.
            const { error } = await authService.resetPassword(email);
            if (error) throw error;
            // This is a standard security practice. We don't want to reveal if an email is registered or not (email enumeration).
            setMessage("If an account exists for this email, password reset instructions have been sent.");
        } catch (err: any) {
            // Supabase's resetPasswordForEmail function does not throw an error for non-existent users for security reasons.
            // This catch block will handle other errors, such as network issues.
            setError(err.error_description || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setMessage(null);
        setIsLoading(true);
        try {
            const { error } = await authService.signInWithGoogle();
            if (error) throw error;
            // The existing onAuthStateChange listener in App.tsx is expected to handle the post-login state and close the modal.
        } catch (err: any) {
            if (err.code === 'auth/popup-closed-by-user') {
                // User closed popup, do nothing
                return;
            }
            setError(err.message || "Failed to sign in with Google.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!email) return;
        alert("Resend verification is handled automatically by Firebase on sign-up.");
        // Firebase handles this differently. 
        // We would need the user to be signed in to call sendEmailVerification.
    };

    const getTitle = () => {
        switch (viewMode) {
            case 'signUp': return 'Create Account';
            case 'resetPassword': return 'Reset Password';
            default: return 'Sign In';
        }
    };

    const resetAuthState = () => {
        setError(null);
        setEmailNotConfirmed(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                    <CloseIcon />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getTitle()}</h2>
                    <p className="text-sm text-gray-500 dark:text-white mt-1">
                        {viewMode === 'resetPassword' ? 'Enter your email to receive reset instructions.' : 'to save your chat history and downloads.'}
                    </p>

                    {message ? (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-center flex flex-col items-center gap-3">
                            <SuccessIcon className="h-10 w-10 text-green-500" />
                            <div>
                                <h3 className="font-semibold text-lg">{viewMode === 'resetPassword' ? 'Instructions Sent' : 'Check Your Email'}</h3>
                                <p className="text-sm">{message}</p>
                            </div>
                            <button
                                onClick={() => { setMessage(null); setViewMode('signIn'); resetAuthState(); }}
                                className="mt-2 text-sm font-semibold text-green-600 dark:text-green-400 hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'resetPassword' ? (
                                <form onSubmit={handlePasswordReset} className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Email</label>
                                        <input
                                            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4F8A54] focus:outline-none"
                                            placeholder="you@example.com" required
                                        />
                                    </div>
                                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                                    <button type="submit" disabled={isLoading} className="w-full px-6 py-3 bg-[#355E3B] text-white font-semibold rounded-lg hover:bg-[#2A482E] transition-colors disabled:bg-green-300 disabled:cursor-not-allowed">
                                        {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleAuth} className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Email</label>
                                        <input
                                            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4F8A54] focus:outline-none"
                                            placeholder="you@example.com" required
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-white">Password</label>
                                            {viewMode === 'signIn' && (
                                                <button type="button" onClick={() => { setViewMode('resetPassword'); resetAuthState(); }} className="text-sm font-semibold text-[#355E3B] dark:text-green-400 hover:underline">
                                                    Forgot Password?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={handlePasswordChange}
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
                                        {viewMode === 'signUp' && password.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 grid grid-cols-4 gap-1.5">
                                                    <div className={`h-1.5 rounded-full ${passwordStrength.score > 0 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                                                    <div className={`h-1.5 rounded-full ${passwordStrength.score > 1 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                                                    <div className={`h-1.5 rounded-full ${passwordStrength.score > 2 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                                                    <div className={`h-1.5 rounded-full ${passwordStrength.score > 3 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                                                </div>
                                                <span className={`text-xs font-semibold ${passwordStrength.score === 1 ? 'text-red-500' :
                                                    passwordStrength.score === 2 ? 'text-orange-500' :
                                                        passwordStrength.score === 3 ? 'text-yellow-500' :
                                                            passwordStrength.score === 4 ? 'text-green-500' : 'text-gray-500'
                                                    }`}>{passwordStrength.text}</span>
                                            </div>
                                        )}
                                    </div>

                                    {viewMode === 'signUp' && (
                                        <>
                                            <div>
                                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Confirm Password</label>
                                                <div className="relative">
                                                    <input
                                                        id="confirm-password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                                {confirmPassword.length > 0 && password.length > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-2 text-xs">
                                                        {password === confirmPassword ? (
                                                            <>
                                                                <SuccessIcon className="h-4 w-4 text-green-500" />
                                                                <span className="text-green-600 dark:text-green-400">Passwords match</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CloseCircleIcon className="h-4 w-4 text-red-500" />
                                                                <span className="text-red-600 dark:text-red-400">Passwords do not match</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label htmlFor="user_role" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">I am a...</label>
                                                <select
                                                    id="user_role" name="user_role" value={userRole} onChange={(e) => setUserRole(e.target.value)}
                                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4F8A54] focus:outline-none" required
                                                >
                                                    <option value="" disabled>Select a role...</option>
                                                    <option value="student">Student</option>
                                                    <option value="system_engineer">System Engineer</option>
                                                    <option value="user">User</option>
                                                    <option value="tester">Tester</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                                    {emailNotConfirmed && !isLoading && (
                                        <div className="text-center">
                                            <button
                                                type="button"
                                                onClick={handleResendVerification}
                                                className="text-sm font-semibold text-green-600 dark:text-green-400 hover:underline"
                                            >
                                                Resend verification email
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        type="submit" disabled={isLoading}
                                        className="w-full px-6 py-3 bg-[#355E3B] text-white font-semibold rounded-lg hover:bg-[#2A482E] transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Processing...' : (viewMode === 'signUp' ? 'Create Account' : 'Sign In')}
                                    </button>
                                    <div className="relative flex items-center justify-center my-4">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600"></div></div>
                                        <div className="relative bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-white">OR</div>
                                    </div>
                                    <button
                                        type="button" onClick={handleGoogleSignIn}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <GoogleIcon /> Sign in with Google
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    <p className="text-center text-sm text-gray-500 dark:text-white mt-6">
                        {viewMode === 'signIn' && (
                            <>Don't have an account? <button onClick={() => { setViewMode('signUp'); resetAuthState(); }} className="font-semibold text-[#355E3B] hover:underline ml-1">Sign Up</button></>
                        )}
                        {viewMode === 'signUp' && (
                            <>Already have an account? <button onClick={() => { setViewMode('signIn'); resetAuthState(); }} className="font-semibold text-[#355E3B] hover:underline ml-1">Sign In</button></>
                        )}
                        {viewMode === 'resetPassword' && (
                            <>Remembered your password? <button onClick={() => { setViewMode('signIn'); resetAuthState(); }} className="font-semibold text-[#355E3B] hover:underline ml-1">Sign In</button></>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
