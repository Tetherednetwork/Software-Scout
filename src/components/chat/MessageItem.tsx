import { useState, useEffect } from 'react';
import { scanUrl, ScanResult } from '../../services/scannerService';
import type { Message, DownloadHistoryItem, Platform } from '../../types';
import { UserIcon, BotIcon, DownloadIcon, LinkIcon, SoftwareIcon, WrenchIcon, ShieldCheckIcon, YouTubeIcon, AppleIcon, LinuxIcon, AndroidIcon, GameIcon, WindowsIcon } from '../ui/Icons';

interface MessageItemProps {
    message: Message;
    onOptionSelect: (optionText: string) => void;
    isLatestBotMessage: boolean;
    onDownload: (item: Omit<DownloadHistoryItem, 'id' | 'timestamp' | 'status'>) => void;
    userAvatarUrl?: string;
}

interface SoftwareListItem {
    name: string;
    description: string;
    url: string;
    logo?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onOptionSelect, isLatestBotMessage, onDownload, userAvatarUrl }) => {
    const { text, sender, groundingChunks, type, platform } = message;
    const isUser = sender === 'user';
    const messageBgClass = isUser
        ? 'bg-primary-gradient text-white rounded-br-none'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none';

    // State for Security Scanning
    const [scanStatus, setScanStatus] = useState<'queued' | 'scanning' | 'verified' | 'warned' | 'blocked'>('queued');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    // --- Special renderer for software lists ---
    if (type === 'software-list') {
        const introText = text.split('[START_ITEM]')[0].trim();
        const itemStrings = text.split('[START_ITEM]').slice(1);

        const parsedItems: SoftwareListItem[] = itemStrings.map(itemStr => {
            const nameMatch = itemStr.match(/\*\*(.*?)\*\*/);
            const descMatch = itemStr.match(/\*Description\*:\s*(.*?)(?=\n*\*Official Source\*|\[END_ITEM\])/);
            const urlMatch = itemStr.match(/\*Official Source\*:\s*(https?:\/\/[^\s]+)/);

            const url = urlMatch ? urlMatch[1].trim() : '';
            let logo = '';
            try {
                if (url) {
                    const hostname = new URL(url).hostname;
                    logo = `https://logo.clearbit.com/${hostname}`;
                }
            } catch (e) { }

            return {
                name: nameMatch ? nameMatch[1].replace(/^\d+\.\s*/, '').trim() : 'Unknown Software',
                description: descMatch ? descMatch[1].trim() : 'No description available.',
                url: url,
                logo: logo
            };
        }).filter(item => item.url);

        return (
            <div className={`flex items-start gap-2 sm:gap-4 justify-start`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                    <BotIcon />
                </div>
                <div className="max-w-[90%] sm:max-w-2xl lg:max-w-4xl">
                    <div className={`rounded-lg p-4 ${messageBgClass}`}>
                        {introText && <p className="whitespace-pre-wrap mb-4" dangerouslySetInnerHTML={{ __html: introText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />}
                        <div className="space-y-4">
                            {parsedItems.map((item, index) => (
                                <div key={index} className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-600 flex gap-4 items-start">
                                    {item.logo && (
                                        <div className="w-12 h-12 bg-white rounded-lg shadow-sm p-1 flex items-center justify-center flex-shrink-0">
                                            <img src={item.logo} alt={item.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.ico' }} />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-white mt-1 mb-3">{item.description}</p>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => onDownload({
                                                software_name: item.name,
                                                url: item.url,
                                                type: 'software',
                                                platform: platform
                                            })}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-gradient text-white font-semibold rounded-md hover:opacity-90 transition-opacity shadow text-sm"
                                        >
                                            <DownloadIcon />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    // --- End of special renderer ---

    const mainDownloadChunk = groundingChunks && groundingChunks.length > 0 ? groundingChunks[0] : null;

    let verifiedDomain = '';
    if (mainDownloadChunk) {
        try {
            verifiedDomain = new URL(mainDownloadChunk.web.uri).hostname.replace(/^www\./, '');
        } catch (e) {
            console.error("Invalid URL in grounding chunk:", mainDownloadChunk.web.uri);
        }
    }

    // Trigger Scan on Mount if link exists
    useEffect(() => {
        if (mainDownloadChunk && mainDownloadChunk.web.uri) {
            setScanStatus('scanning');
            scanUrl(mainDownloadChunk.web.uri).then(result => {
                setScanResult(result);
                if (result.verdict === 'malicious') setScanStatus('blocked');
                else if (result.verdict === 'suspicious') setScanStatus('warned');
                else setScanStatus('verified');
            });
        }
    }, [mainDownloadChunk]);

    // Logic to parse for quick reply options
    const optionsMatch = text.match(/\[OPTIONS\]:\s*(.*)/);
    const optionsText = optionsMatch ? optionsMatch[1] : '';
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

    const getHeader = () => {
        let icon: React.ReactNode;
        let secondaryIcon: React.ReactNode | null = null;
        let title = "Recommendation";

        const platformName = platform ? {
            'windows': 'Windows',
            'macos': 'macOS',
            'linux': 'Linux',
            'android': 'Android'
        }[platform] : '';

        const getPlatformIcon = (p: Platform | undefined) => {
            switch (p) {
                case 'macos': return <AppleIcon />;
                case 'linux': return <LinuxIcon />;
                case 'android': return <AndroidIcon />;
                case 'windows': return <WindowsIcon />;
                default: return null;
            }
        };

        if (type === 'driver') {
            icon = <WrenchIcon />;
            title = 'Driver Support Page';
        } else if (type === 'game') {
            icon = <GameIcon />;
            title = platformName ? `${platformName} Game` : 'Game Recommendation';
            secondaryIcon = getPlatformIcon(platform);
        } else if (type === 'software') {
            icon = <SoftwareIcon />;
            secondaryIcon = getPlatformIcon(platform);

            switch (platform) {
                case 'macos':
                    title = 'macOS Software';
                    break;
                case 'linux':
                    title = 'Linux Software';
                    break;
                case 'android':
                    title = 'Android App';
                    break;
                default:
                    title = 'Windows Software';
            }
        } else if (type === 'installation-guide') {
            icon = <YouTubeIcon />;
            title = platformName ? `Installation Help for ${platformName}` : 'Installation Help';
            secondaryIcon = getPlatformIcon(platform);
        } else if (mainDownloadChunk) {
            icon = <SoftwareIcon />;
            title = 'Software Found';
        } else {
            return null;
        }

        let logoUrl = '';
        if (mainDownloadChunk) {
            try {
                const hostname = new URL(mainDownloadChunk.web.uri).hostname;
                logoUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
            } catch (e) { }
        }

        return (
            <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                    {secondaryIcon}
                </div>

                {logoUrl ? (
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm p-1.5 flex items-center justify-center flex-shrink-0 border border-gray-100">
                        <img
                            src={logoUrl}
                            alt={`${title} logo`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 flex items-center justify-center text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        {icon}
                    </div>
                )}
            </div>
        );
    };

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

        const isSafe = scanResult.verdict === 'safe' || scanResult.verdict === 'unknown';
        const colorClass = isSafe ? 'green' : (scanResult.verdict === 'malicious' ? 'red' : 'yellow');

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
