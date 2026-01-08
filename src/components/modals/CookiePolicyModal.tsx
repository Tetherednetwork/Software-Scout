
import React from 'react';
import { CloseIcon } from '../ui/Icons';

interface CookiePolicyModalProps {
    onClose: () => void;
}

const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({ onClose }) => {
    
    const PolicySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
            <div className="space-y-2 text-gray-600 dark:text-white">{children}</div>
        </div>
    );

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cookie Policy</h2>
                    <p className="text-sm text-gray-500 dark:text-white">Last Updated: {new Date().toLocaleDateString()}</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    <PolicySection title="1. What Are Cookies?">
                        <p>Cookies are small text files stored on your device (computer, tablet, mobile phone) by a website you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>
                        <p>This application primarily uses your browser's <code>localStorage</code> to function, which is a modern equivalent of cookies used for storing data on your device. For the purpose of this policy, we will refer to both cookies and <code>localStorage</code> as "cookies."</p>
                    </PolicySection>
                    
                    <PolicySection title="2. How We Use Cookies">
                        <p>We use cookies for essential functionalities to provide you with our Service. We do not use cookies for tracking, advertising, or analytics purposes.</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Strictly Necessary Cookies:</strong> These are required for the operation of our Service. They include, for example, cookies that enable you to log into secure areas of our Service. Our authentication is handled by Google Firebase, which uses cookies to manage your login session securely.</li>
                            <li><strong>Functionality Cookies:</strong> We use your browser's <code>localStorage</code> to remember your chat history and preferences. This is essential for the application to work as intended, allowing you to continue your conversations about software, games, and drivers across sessions.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="3. Types of Cookies We Use">
                         <ul className="list-disc list-inside space-y-2">
                            <li><strong>Session Cookies:</strong> These are temporary and are erased when you close your browser.</li>
                            <li><strong>Persistent Cookies:</strong> These remain on your device for a set period or until you delete them. Firebase authentication may use persistent cookies to keep you logged in.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="4. Your Choices Regarding Cookies">
                         <p>Most web browsers allow some control of most cookies through the browser settings. You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this Service may become inaccessible or not function properly.</p>
                         <p>You can clear all data stored by our application, including your chat history and login status, by clearing your browser's cache and site data for this domain.</p>
                    </PolicySection>

                     <PolicySection title="5. Contact Us">
                         <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@softmonk.co" className="text-green-600 hover:underline dark:text-green-400 dark:hover:text-green-300">privacy@softmonk.co</a>.</p>
                    </PolicySection>
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

export default CookiePolicyModal;
