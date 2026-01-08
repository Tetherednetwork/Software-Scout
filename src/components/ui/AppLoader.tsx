import React from 'react';

const AppLoader: React.FC = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="h-24 w-24">
        <img src="/images/logo22.png" alt="SoftMonk Loading" className="h-24 w-24 animate-pulse" />
      </div>
      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full animate-loader-bar"></div>
      </div>
    </div>
    <style>{`
      @keyframes loader-bar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-loader-bar {
        animation: loader-bar 2s ease-in-out infinite;
      }
    `}</style>
  </div>
);

export default AppLoader;