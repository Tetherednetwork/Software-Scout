import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { Message, SoftwareFilter, DownloadHistoryItem, Session, SavedDevice } from '../../types';
import { findSoftware } from '../../services/aiService';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import FilterControls from './FilterControls';
import SuggestedPrompts from '../home/SuggestedPrompts';
import { ChatWindowRef } from '../../App';
import { dbService } from '../../services/dbService';

interface ChatWindowProps {
    onDownload: (item: Omit<DownloadHistoryItem, 'id' | 'timestamp' | 'status'>) => void;
    session: Session | null;
    onLoginRequest: () => void;
    onShowToast: (message: string) => void;
}

const ChatWindow = forwardRef<ChatWindowRef, ChatWindowProps>(({ onDownload, session, onLoginRequest, onShowToast }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState<SoftwareFilter>('all');
    const [inputPlaceholder, setInputPlaceholder] = useState('Ask for software...');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initialMessage: Message = {
        id: 'init',
        text: "Hello! I'm SoftMonk. I can help you find safe software, games, and drivers for Windows, macOS, Linux, and Android. What are you looking for today?",
        sender: 'bot',
        type: 'standard'
    };

    // Load chat history from Supabase when session changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!session) {
                setMessages([initialMessage]); // Show greeting to guests
                return;
            }

            // This is a background task and should not trigger a user-facing loading indicator.
            // The 'isLoading' state is reserved for when the bot is replying to user input.
            try {
                const { data, error } = await dbService.getChatHistory(session.user.id);

                if (error) {
                    console.error("Error fetching chat history:", error);
                    setMessages([initialMessage]);
                } else {
                    setMessages(data && data.length > 0 ? (data as Message[]) : [initialMessage]);
                }
            } catch (e) {
                console.error("A critical error occurred while fetching chat history:", e);
                // In case of a critical failure, reset to a safe state.
                setMessages([initialMessage]);
            }
        };

        fetchHistory();
    }, [session]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        // Logic to update placeholder based on conversation context
        if (isLoading) {
            setInputPlaceholder('SoftMonk is typing...');
        } else {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.sender === 'bot') {
                if (['driver-input-prompt', 'driver-device-prompt', 'driver-device-selection', 'platform-prompt', 'software-clarification-prompt'].includes(lastMessage.type || '')) {
                    const text = lastMessage.text.toLowerCase();
                    if (text.includes('model') || text.includes('serial')) {
                        setInputPlaceholder('Enter your PC model or serial number...');
                    } else if (text.includes('manufacturer')) {
                        setInputPlaceholder('Choose or type a manufacturer...');
                    } else if (text.includes('operating system')) {
                        setInputPlaceholder('Choose your OS from the options...');
                    } else if (text.includes('component')) {
                        setInputPlaceholder('Choose a component from the options...');
                    } else {
                        setInputPlaceholder('Please provide the requested information...');
                    }
                } else {
                    setInputPlaceholder('Ask for software...');
                }
            } else {
                // Reset placeholder if the last message is from the user or it's the start of the chat
                setInputPlaceholder('Ask for software...');
            }
        }
    }, [messages, isLoading]);

    const getBotResponse = async (history: Message[], currentFilter: SoftwareFilter, currentSession: Session | null) => {
        setIsLoading(true);
        try {
            const botResponse = await findSoftware(history, currentFilter, currentSession);

            const botMessage: Message = {
                id: `bot-${Date.now()}`,
                text: botResponse.text,
                sender: 'bot',
                groundingChunks: botResponse.groundingChunks,
                type: botResponse.type,
                platform: botResponse.platform,
                suggestedDevice: botResponse.suggestedDevice,
            };
            setMessages(prev => [...prev, botMessage]);

            // Save bot message to DB if user is logged in
            if (session) {
                // Remove suggestedDevice before saving to DB as it's a transient UI hint
                // Remove suggestedDevice before saving to DB as it's a transient UI hint
                await dbService.addChatMessage(session.user.id, {
                    user_id: session.user.id,
                    text: botMessage.text,
                    sender: 'bot',
                    grounding_chunks: botMessage.groundingChunks || null,
                    type: botMessage.type || 'standard',
                    platform: botMessage.platform || null,
                });
            }

        } catch (error: any) {
            console.error("Failed to get response:", error);
            const errorMessage: Message = {
                id: `err-${Date.now()}`,
                text: error.message || "Sorry, something went wrong. Please try again.",
                sender: 'bot',
                type: 'standard',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (inputText: string) => {
        if (!inputText.trim()) return;

        if (!session) {
            onLoginRequest();
            return;
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            text: inputText,
            sender: 'user',
            user_id: session.user.id
        };
        const newHistory = [...messages, userMessage];
        setMessages(newHistory);

        // Save user message to DB
        await dbService.addChatMessage(session.user.id, {
            user_id: session.user.id,
            text: userMessage.text,
            sender: 'user',
            type: 'standard'
        });

        await getBotResponse(newHistory, filter, session);
    };

    // Expose the sendMessage function via the ref
    useImperativeHandle(ref, () => ({
        sendMessage: (text: string) => {
            if (!session) {
                onLoginRequest();
                return;
            }
            handleSendMessage(text);
        }
    }));

    const handleOptionSelect = async (optionText: string) => {
        if (!session) {
            onLoginRequest();
            return;
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            text: optionText,
            sender: 'user',
            user_id: session.user.id
        };
        const newHistory = [...messages, userMessage];
        setMessages(newHistory);

        await dbService.addChatMessage(session.user.id, {
            user_id: session.user.id,
            text: userMessage.text,
            sender: 'user',
            type: 'standard'
        });

        await getBotResponse(newHistory, filter, session);
    };

    const handleClearHistory = async () => {
        if (!session) return; // Can't clear guest history

        const confirmed = window.confirm(
            "Are you sure you want to clear your entire chat history? This action cannot be undone."
        );
        if (confirmed) {
            const { error } = await dbService.clearChatHistory(session.user.id);

            if (error) {
                console.error("Error clearing chat history:", error);
                onShowToast("Could not clear your history. Please try again.");
            } else {
                setMessages([initialMessage]);
            }
        }
    };

    const handleUserSaveDevice = async (device: Partial<SavedDevice>) => {
        if (!session) return;

        // Ensure required fields exist
        if (!device.name || !device.brand || !device.model) {
            onShowToast("Could not save device: missing information.");
            return;
        }

        const newDevice = {
            name: `${device.brand} ${device.model}`, // Default name
            type: 'other' as const, // Default type, user can edit later
            brand: device.brand,
            model: device.model,
            os_family: device.os_family || 'Windows',
            os_version: device.os_version || '',
            serial_number: device.serial_number || '',
            ...device // Spread to override defaults if present
        };

        const { error } = await dbService.addDevice(session.user.id, newDevice as any); // Cast as any because AddDevice might expect strict types

        if (error) {
            console.error("Error saving device:", error);
            onShowToast("Failed to save device. Please try again.");
        } else {
            onShowToast(`Successfully saved ${newDevice.name}!`);
            // Hide the prompt card optimistically
            const currentMessages = [...messages];
            const lastMsg = currentMessages[currentMessages.length - 1];
            if (lastMsg && lastMsg.suggestedDevice) {
                // We modify the message in state to remove the suggestion so it doesn't show again
                const updatedLastMsg = { ...lastMsg, suggestedDevice: undefined };
                currentMessages[currentMessages.length - 1] = updatedLastMsg;
                setMessages(currentMessages);
            }
        }
    };

    const latestBotMessageId = [...messages].reverse().find(m => m.sender === 'bot')?.id;

    return (
        <div className="w-full flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <FilterControls
                activeFilter={filter}
                onFilterChange={setFilter}
                onClearHistory={handleClearHistory}
                isHistoryEnabled={!!session}
            />
            <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto" aria-live="polite" aria-atomic="false">
                {messages.map((msg) => (
                    <MessageItem
                        key={msg.id}
                        message={msg}
                        onOptionSelect={handleOptionSelect}
                        isLatestBotMessage={!isLoading && msg.id === latestBotMessageId}
                        onDownload={onDownload}
                        userAvatarUrl={session?.user?.user_metadata?.custom_avatar_url || session?.user?.user_metadata?.avatar_url}
                        onSaveDevice={handleUserSaveDevice}
                    />
                ))}

                {isLoading && <TypingIndicator />}

                {!isLoading && messages.length <= 1 && (
                    <SuggestedPrompts onPromptClick={handleSendMessage} />
                )}

                <div ref={messagesEndRef} />
            </div>
            <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={inputPlaceholder}
            />
        </div>
    );
});

export default ChatWindow;