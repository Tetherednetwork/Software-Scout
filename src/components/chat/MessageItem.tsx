import React from 'react';
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
}


const MessageItem: React.FC<MessageItemProps> = ({ message, onOptionSelect, isLatestBotMessage, onDownload, userAvatarUrl }) => {
    const { text, sender, groundingChunks, type, platform } = message;
    const isUser = sender === 'user';
    const messageBgClass = isUser 
        ? 'bg-[#355E3B] text-white rounded-br-none' 
        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none';
    
    // --- Special renderer for software lists ---
    if (type === 'software-list') {
        const introText = text.split('[START_ITEM]')[0].trim();
        const itemStrings = text.split('[START_ITEM]').slice(1);

        const parsedItems: SoftwareListItem[] = itemStrings.map(itemStr => {
            const nameMatch = itemStr.match(/\*\*(.*?)\*\*/);
            const descMatch = itemStr.match(/\*Description\*:\s*(.*?)(?=\n*\*Official Source\*|\[END_ITEM\])/);
            const urlMatch = itemStr.match(/\*Official Source\*:\s*(https?:\/\/[^\s]+)/);

            return {
                name: nameMatch ? nameMatch[1].replace(/^\d+\.\s*/, '').trim() : 'Unknown Software',
                description: descMatch ? descMatch[1].trim() : 'No description available.',
                url: urlMatch ? urlMatch[1].trim() : ''
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
                                <div key={index} className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{item.name}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">{item.description}</p>
                                    <a 
                                        href={item.url}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={() => onDownload({
                                            name: item.name,
                                            url: item.url,
                                            type: 'software',
                                            platform: platform
                                        })}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#4F8A54] text-white font-semibold rounded-md hover:bg-[#355E3B] transition-colors shadow text-sm"
                                    >
                                        <DownloadIcon />
                                        Download
                                    </a>
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

    // Simple markdown to HTML for bolding and adding a copy button for SHA256 hash
    const formatText = (inputText: string) => {
        let formattedText = inputText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
        
        // Find SHA256 hash and add a copy button
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
            title = 'Driver Support Page'; // Drivers are Windows-only per geminiService
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
        } else {
            return null;
        }

        return (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-300 dark:border-gray-600">
                {icon}
                {secondaryIcon}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            </div>
        );
    };

    const DownloadLink = () => (
         <a 
            href={mainDownloadChunk!.web.uri}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => onDownload({
                name: mainDownloadChunk!.web.title || 'Unknown Download',
                url: mainDownloadChunk!.web.uri,
                type: type === 'driver' ? 'driver' : (type === 'game' ? 'game' : 'software'),
                platform: platform
            })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F8A54] text-white font-semibold rounded-lg hover:bg-[#355E3B] transition-colors shadow-md"
        >
            <DownloadIcon />
            Download
        </a>
    );
    
    const SafetyScorecard = () => (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <ShieldCheckIcon className="h-8 w-8 flex-shrink-0" />
            <h4 className="font-semibold text-green-800 dark:text-green-200">Source Verified</h4>
        </div>
    );

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
                    
                    {options.length > 0 && (
                         <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 flex flex-wrap gap-2">
                            {options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => onOptionSelect(option)}
                                    disabled={!isLatestBotMessage}
                                    className="px-4 py-2 bg-[#4F8A54] text-white font-semibold rounded-lg hover:bg-[#355E3B] transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {(type === 'software' || type === 'game') && text.includes('Would you like help installing this?') && isLatestBotMessage && (
                        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 flex flex-wrap gap-2">
                            <button
                                onClick={() => onOptionSelect('Yes, please')}
                                className="px-4 py-2 bg-[#4F8A54] text-white font-semibold rounded-lg hover:bg-[#355E3B] transition-colors"
                            >
                                Yes, please
                            </button>
                            <button
                                onClick={() => onOptionSelect('No, thank you')}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
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
                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Other Sources:</h4>
                            <ul className="space-y-1">
                                {groundingChunks.slice(1).map((chunk, index) => (
                                    <li key={index}>
                                        <a 
                                            href={chunk.web.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start gap-2 text-xs text-[#355E3B] hover:text-[#2A482E] dark:text-[#69B870] dark:hover:text-[#85c78a] hover:underline"
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
                 <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
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
