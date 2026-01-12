import { useState, useEffect } from 'react';
import { scanUrl, ScanResult } from '../../services/scannerService';

// ... (existing MessageItemProps interface)

const mainDownloadChunk = groundingChunks && groundingChunks.length > 0 ? groundingChunks[0] : null;

let verifiedDomain = '';
if (mainDownloadChunk) {
    try {
        verifiedDomain = new URL(mainDownloadChunk.web.uri).hostname.replace(/^www\./, '');
    } catch (e) {
        console.error("Invalid URL in grounding chunk:", mainDownloadChunk.web.uri);
    }
}

// Logic to parse for quick reply options
const optionsMatch = text.match(/\[OPTIONS\]:\s*(.*)/);
const optionsText = optionsMatch ? optionsMatch[1] : '';
// Use semicolon as a delimiter if present, otherwise fall back to comma.
const delimiter = optionsText.includes(';') ? ';' : ',';
const options = optionsText ? optionsText.split(delimiter).map(o => o.trim()) : [];
const baseText = text.replace(/\[OPTIONS\]:\s*(.*)/, '').trim();

// --- Consolidated logic for video guides and cleaning text ---
let videoUrl: string | null = null;
let processedText = baseText;

if (type === 'installation-guide') {
    const markdownRegex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/;
    const markdownMatch = processedText.match(markdownRegex);

    const isYoutubeUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');
    const rawUrlRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+)[^\s"<]*/g;

    if (markdownMatch && isYoutubeUrl(markdownMatch[2])) {
        videoUrl = markdownMatch[2];
        processedText = processedText.replace(markdownRegex, '').trim();
    } else if (mainDownloadChunk && isYoutubeUrl(mainDownloadChunk.web.uri)) {
        videoUrl = mainDownloadChunk.web.uri;
        processedText = processedText.replace(markdownRegex, '').trim();
        processedText = processedText.replace(rawUrlRegex, '').trim();
    } else {
        const rawUrlMatch = processedText.match(rawUrlRegex);
        if (rawUrlMatch && rawUrlMatch[0]) {
            videoUrl = rawUrlMatch[0];
            processedText = processedText.replace(rawUrlRegex, '').trim();
        }
    }
}

const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Optional: show a toast or confirmation
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};

const formatText = (inputText: string) => {
    let formattedText = inputText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>');
    const sha256Regex = /(<strong[^>]*>SHA256 Hash<\/strong>:\s*)([0-9a-fA-F]{64})/g;
    formattedText = formattedText.replace(sha256Regex, (_, prefix, hash) => {
        return `${prefix}<span class="font-mono text-xs break-all">${hash}</span> <button data-copy-hash="${hash}" class="copy-hash-btn" title="Copy SHA256 Hash"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>`;
    });
    return { __html: formattedText };
};

const attachCopyListeners = (container: HTMLDivElement | null) => {
    if (container) {
        const buttons = container.querySelectorAll('.copy-hash-btn');
        buttons.forEach(button => {
            const btn = button as HTMLButtonElement;
            btn.onclick = () => {
                const hash = btn.dataset.copyHash;
                if (hash) {
                    handleCopy(hash);
                }
            };
        });
    }
};

return (
    <div className={`flex items-start gap-2 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                <BotIcon />
            </div>
        )}
        <div className={`max-w-[90%] sm:max-w-2xl lg:max-w-4xl`}>
            <div className={`rounded-lg p-4 ${messageBgClass} ${type === 'driver-input-prompt' ? 'border-l-4 border-yellow-500' : ''}`}>

                {getHeader()}

                {type === 'driver-input-prompt' && (
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Your action is required:</p>
                )}

                <div
                    className="whitespace-pre-wrap prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={formatText(processedText)}
                    ref={attachCopyListeners}
                />

                {/* Rendering Clickable Options (Chips) */}
                {(message.options && message.options.length > 0) ? (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 flex flex-wrap gap-2">
                        {message.options.map((option) => (
                            <button
                                key={option}
                                onClick={() => onOptionSelect(option)}
                                // Disable if not latest or user has already acted (optimistic)
                                // For now, always enable on latest to allow correction
                                className="px-4 py-2 bg-primary-gradient text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                ) : (options.length > 0 && ( /* Fallback to regex parsed options */
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 flex flex-wrap gap-2">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => onOptionSelect(option)}
                                disabled={!isLatestBotMessage}
                                className="px-4 py-2 bg-primary-gradient text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                ))}

                {(type === 'software' || type === 'game') && text.includes('Would you like help installing this?') && isLatestBotMessage && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 flex flex-wrap gap-2">
                        <button
                            onClick={() => onOptionSelect('Yes, please')}
                            className="px-4 py-2 bg-primary-gradient text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Yes, please
                        </button>
                        <button
                            onClick={() => onOptionSelect('No, thank you')}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                            No, thank you
                        </button>
                    </div>
                )}

                {mainDownloadChunk && type !== 'installation-guide' && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                        {verifiedDomain && <SafetyScorecard />}
                        <DownloadLink />
                    </div>
                )}

                {videoUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                        <a
                            href={videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md"
                        >
                            <YouTubeIcon className="h-6 w-6" />
                            Watch Video
                        </a>
                    </div>
                )}

                {groundingChunks && groundingChunks.length > 1 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-white mb-2">Other Sources:</h4>
                        <ul className="space-y-1">
                            {groundingChunks.slice(1).map((chunk, index) => (
                                <li key={index}>
                                    <a
                                        href={chunk.web.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-2 text-xs text-[var(--color-primary-light)] hover:opacity-80 dark:text-[#69B870] dark:hover:text-[#85c78a] hover:underline"
                                    >
                                        <LinkIcon />
                                        <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
        {isUser && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                    <UserIcon />
                )}
            </div>
        )}
    </div>
);
};

export default MessageItem;
