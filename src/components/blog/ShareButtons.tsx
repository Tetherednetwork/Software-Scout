import React, { useState } from 'react';

interface ShareButtonsProps {
    url: string;
    title: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ url, title }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopySuccess('Link copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Share:</span>
            <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Share on X">
                <img src="/images/x.png" alt="Share on X" className="h-5 w-5"/>
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Share on Facebook">
                 <img src="/images/facebook.png" alt="Share on Facebook" className="h-5 w-5"/>
            </a>
            <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Share on LinkedIn">
                 <img src="/images/linkedin.png" alt="Share on LinkedIn" className="h-5 w-5"/>
            </a>
            <button onClick={copyToClipboard} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative" title="Copy link">
                 <img src="/images/copy-link.png" alt="Copy link" className="h-5 w-5"/>
                {copySuccess && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md">{copySuccess}</span>}
            </button>
        </div>
    );
};

export default ShareButtons;