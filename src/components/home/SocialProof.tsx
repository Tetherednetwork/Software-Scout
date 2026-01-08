
import React from 'react';

const SocialProof: React.FC = () => {
    return (
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 w-fit" aria-live="polite">
            <div className="flex -space-x-4" aria-hidden="true">
                <img 
                    className="w-10 h-10 border-2 border-white rounded-full object-cover avatar-float" 
                    src="/images/boy.png" 
                    alt="Happy user boy"
                    style={{ animationDelay: '0s' }}
                />
                <img 
                    className="w-10 h-10 border-2 border-white rounded-full object-cover avatar-float" 
                    src="/images/rabbit.png" 
                    alt="Happy user rabbit" 
                    style={{ animationDelay: '0.5s' }}
                />
                <img 
                    className="w-10 h-10 border-2 border-white rounded-full object-cover avatar-float" 
                    src="/images/girl.png" 
                    alt="Happy user girl" 
                    style={{ animationDelay: '1s' }}
                />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm pr-2">Join 10,000+ happy users!</p>
        </div>
    );
};

export default SocialProof;
