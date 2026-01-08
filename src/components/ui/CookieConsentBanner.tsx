import React from 'react';

interface CookieConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  onOpenCookiePolicy: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onDecline, onOpenCookiePolicy }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title">
      <div className="max-w-screen-xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-800 dark:text-gray-200">
          <h2 id="cookie-consent-title" className="font-bold text-lg">We use cookies</h2>
          <p className="text-sm mt-1">
            This website uses cookies and local storage to ensure you get the best experience, including for authentication and saving your chat history. You can learn more by reading our{' '}
            <button onClick={onOpenCookiePolicy} className="font-semibold text-green-600 dark:text-green-400 hover:underline">
              Cookie Policy
            </button>.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3">
          <button
            onClick={onDecline}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
