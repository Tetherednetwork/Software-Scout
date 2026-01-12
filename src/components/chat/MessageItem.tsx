import { useState, useEffect } from 'react';
import { scanUrl, ScanResult } from '../../services/scannerService';

// ... (existing MessageItemProps interface)

const MessageItem: React.FC<MessageItemProps> = ({ message, onOptionSelect, isLatestBotMessage, onDownload, userAvatarUrl }) => {
    // ... (existing destructuring)

    // State for Security Scanning
    const [scanStatus, setScanStatus] = useState<'queued' | 'scanning' | 'verified' | 'warned' | 'blocked'>('queued');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    const mainDownloadChunk = groundingChunks && groundingChunks.length > 0 ? groundingChunks[0] : null;

    // Trigger Scan on Mount if link exists
    useEffect(() => {
        if (mainDownloadChunk && mainDownloadChunk.web.uri) {
            setScanStatus('scanning');
            scanUrl(mainDownloadChunk.web.uri).then(result => {
                setScanResult(result);
                // Map scanner verdict to UI status
                if (result.verdict === 'malicious') setScanStatus('blocked');
                else if (result.verdict === 'suspicious') setScanStatus('warned');
                else setScanStatus('verified');
            });
        }
    }, [mainDownloadChunk]);

    // ... (getHeader logic remains the same)

    const DownloadLink = () => {
        if (!mainDownloadChunk) return null;

        if (scanStatus === 'scanning' || scanStatus === 'queued') {
            return (
                <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg cursor-wait">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scanning Link...
                </button>
            );
        }

        if (scanStatus === 'blocked') {
            return (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg border border-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 6.89a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                    Blocked: Unsafe Source
                </div>
            );
        }

        return (
            <a
                href={mainDownloadChunk.web.uri}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onDownload({
                    software_name: mainDownloadChunk.web.title || 'Unknown Download',
                    url: mainDownloadChunk.web.uri,
                    type: type === 'driver' ? 'driver' : (type === 'game' ? 'game' : 'software'),
                    platform: platform
                })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-gradient text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md"
            >
                <DownloadIcon />
                Download Safe File
            </a>
        );
    };

    const SafetyScorecard = () => {
        if (!scanResult) return null;

        // Dynamic styling based on verdict
        const isSafe = scanResult.verdict === 'safe' || scanResult.verdict === 'unknown';
        const colorClass = isSafe ? 'green' : (scanResult.verdict === 'blocked' ? 'red' : 'yellow');

        return (
            <div className={`flex flex-col gap-1 bg-${colorClass}-50 dark:bg-${colorClass}-900/20 border border-${colorClass}-200 dark:border-${colorClass}-800 rounded-lg p-3 mb-4`}>
                <div className="flex items-center gap-3">
                    <ShieldCheckIcon className={`h-6 w-6 flex-shrink-0 text-${colorClass}-600`} />
                    <div>
                        <h4 className={`font-semibold text-${colorClass}-800 dark:text-${colorClass}-200`}>
                            {isSafe ? 'SoftMonk Verified Safe' : 'Security Warning'}
                        </h4>
                        <p className={`text-xs text-${colorClass}-700 dark:text-${colorClass}-300`}>
                            {scanResult.details}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // ... (Return statement: update to use new components)

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
