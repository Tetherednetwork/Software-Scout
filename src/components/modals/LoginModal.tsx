import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { CloseIcon, GoogleIcon } from '../ui/Icons';

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage("Check your email for a verification link to complete your sign-up!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // The onAuthStateChange listener in App.tsx will handle closing the modal
            }
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            setError(error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                    <CloseIcon />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">to save your chat history and downloads.</p>
                    
                    {message ? (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-center">
                            <h3 className="font-semibold text-lg">Check Your Email</h3>
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: message }}></p>
                             <button
                                onClick={() => { setMessage(null); setIsSignUp(false); }}
                                className="mt-4 text-sm font-semibold text-[#355E3B] hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleAuth} className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#4F8A54] focus:outline-none"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#4F8A54] focus:outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            
                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-6 py-3 bg-[#355E3B] text-white font-semibold rounded-lg hover:bg-[#2A482E] transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                            </button>
                            
                            <div className="relative flex items-center justify-center my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                <div className="relative bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">OR</div>
                            </div>
                            
                             <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <GoogleIcon />
                                Sign in with Google
                            </button>

                        </form>
                    )}

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="font-semibold text-[#355E3B] hover:underline ml-1">
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
