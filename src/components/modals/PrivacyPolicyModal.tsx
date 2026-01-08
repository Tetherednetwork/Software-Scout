

import React from 'react';
import { CloseIcon } from '../ui/Icons';

interface PrivacyPolicyModalProps {
    onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose }) => {

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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Privacy Policy</h2>
                    <p className="text-sm text-gray-500 dark:text-white">Last Updated: {new Date().toLocaleDateString()}</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    <PolicySection title="1. Introduction">
                        <p>Welcome to SoftMonk. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI-powered chatbot (the "Service"), which helps you find software, games, drivers, and installation guides for platforms including Windows, macOS, Linux, and Android. By using the Service, you agree to the collection and use of information in accordance with this policy. This policy is written to comply with the General Data Protection Regulation (GDPR).</p>
                    </PolicySection>

                    <PolicySection title="2. Information We Collect">
                        <p>We collect information to provide and improve our Service to you.</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Information You Provide Directly:</strong> This includes your chat history, any feedback you provide, and account information (name, email) if you sign up directly.</li>
                            <li><strong>Information from Third-Party Services (Google Sign-In):</strong> When you sign in using Google, we receive your name, email address, and profile picture to create your user profile.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="3. How We Use Your Information">
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>To Provide the Service:</strong> Your chat history is sent to the OpenAI API to generate relevant responses for your cross-platform software, game, driver, and installation guide inquiries.</li>
                            <li><strong>To Personalize Your Experience:</strong> Your account information is used to display your profile and associate your chat history with you.</li>
                            <li><strong>For Functionality:</strong> All collected data (profile, chat history, feedback) is stored in our secure database, associated with your user account.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="4. Data Sharing and Third Parties">
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>OpenAI API:</strong> To generate responses, your chat history is sent to OpenAI's API for processing. We do not send your personal profile information (name, email) with these requests.</li>
                            <li><strong>No Sale of Data:</strong> We do not sell, trade, or rent your personal identification information to others.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="5. Data Storage, Security, and Retention">
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Database Storage:</strong> Your user profile, chat history, and feedback are stored in our secure Firebase database.</li>
                            <li><strong>Security:</strong> We implement security measures to protect your data. However, no method of electronic storage is 100% secure.</li>
                            <li><strong>Retention and Deletion:</strong> Your data is retained as long as your account is active. You can request account deletion through your profile settings.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="6. Your Data Protection Rights Under GDPR">
                        <p>As a user, you have rights over your data. You can manage your data through your profile or by contacting us.</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>The right to access & erasure:</strong> You can access your data in your profile and request deletion by contacting support.</li>
                            <li><strong>The right to rectification:</strong> You can manage your profile information in your profile settings.</li>
                        </ul>
                    </PolicySection>

                    <PolicySection title="7. Children's Privacy">
                        <p>Our Service is not intended for use by anyone under the age of 16. We do not knowingly collect personally identifiable information from children under 16.</p>
                    </PolicySection>

                    <PolicySection title="8. Changes to This Privacy Policy">
                        <p>We may update our Privacy Policy from time to time. You are advised to review this Privacy Policy periodically for any changes.</p>
                    </PolicySection>

                    <PolicySection title="9. Contact Us">
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

export default PrivacyPolicyModal;