import React from 'react';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

export default LoadingSpinner;
