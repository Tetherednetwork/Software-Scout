
import React from 'react';
import { CloseIcon } from '../ui/Icons';

interface GdprModalProps {
    onClose: () => void;
}

const GdprModal: React.FC<GdprModalProps> = ({ onClose }) => {
    
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">GDPR Compliance</h2>
                    <p className="text-sm text-gray-500 dark:text-white">Last Updated: {new Date().toLocaleDateString()}</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    <PolicySection title="1. Our Commitment to GDPR">
                        <p>SoftMonk is committed to the principles of data protection and privacy as outlined in the General Data Protection Regulation (GDPR). We have designed our Service with privacy as a core component ("privacy by design").</p>
                    </PolicySection>
                    
                    <PolicySection title="2. Your Rights Under GDPR">
                        <p>As a user of our Service, you have specific rights concerning your personal data:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>The Right to Access:</strong> You can access all data related to you (profile, chat history) at any time, as it is stored within your own browser's <code>localStorage</code>.</li>
                            <li><strong>The Right to Rectification:</strong> You can correct or update your personal information (e.g., name, profile picture) through the service you used to sign in, such as your Google Account.</li>
                            <li><strong>The Right to Erasure (Right to be Forgotten):</strong> You have the right to delete all your personal data. You can do this instantly by clearing your browser's site data for our domain. This will permanently remove your chat history and profile information from your device.</li>
                             <li><strong>The Right to Data Portability:</strong> Since your data is stored locally, you can manually copy and save your chat history from your browser's developer tools if you wish to keep a record.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="3. How We Comply">
                         <p>Our application architecture is designed to empower you with control over your data.</p>
                         <ul className="list-disc list-inside space-y-2">
                            <li><strong>Data Storage:</strong> We do not store your chat history or personal profile information on our servers. All this data resides exclusively in your browser's <code>localStorage</code>, giving you full control.</li>
                            <li><strong>Data Processing:</strong> For the chat functionality, your conversation history (containing your requests for software, games, drivers, and guides across various platforms) is sent to the OpenAI API to generate responses. We do not include your personal profile information (name, email) in these API requests.</li>
                            <li><strong>Lawful Basis for Processing:</strong> We process your data based on your consent, which you provide by using our Service.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="4. Data Protection Officer">
                         <p>Given the nature of our operations, where we do not store user data on our servers, we have not appointed a formal Data Protection Officer. However, for any privacy-related questions, we are your point of contact.</p>
                    </PolicySection>

                     <PolicySection title="5. Contact Us">
                         <p>For more details, please review our full Privacy Policy. If you have any questions about your GDPR rights or how we handle your data, please contact us at <a href="mailto:privacy@softmonk.co" className="text-green-600 hover:underline dark:text-green-400 dark:hover:text-green-300">privacy@softmonk.co</a>.</p>
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

export default GdprModal;
