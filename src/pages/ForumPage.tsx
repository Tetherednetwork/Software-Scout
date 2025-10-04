import React from 'react';

const ForumPage: React.FC = () => {
    return (
        <div className="p-6 sm:p-10 text-center flex flex-col items-center justify-center h-full">
             <img 
                src="/images/SoftMonks_forum.png" 
                alt="A friendly monk character sitting at a computer, representing the SoftMonk community." 
                className="w-full max-w-sm mb-8 rounded-lg shadow-lg"
             />
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">SoftMonk Community Forum</h1>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-4">Coming Soon!</p>
            <p className="max-w-xl text-lg text-gray-600 dark:text-gray-300">
                Connect with other SoftMonks, ask questions, and share your favorite software finds. Our community forum is currently under development. Check back soon!
            </p>
        </div>
    );
};

export default ForumPage;