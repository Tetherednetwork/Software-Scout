
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { Message, SoftwareFilter, DownloadHistoryItem, AIProvider, Session } from '../types';
import { findSoftware } from '../services/aiService';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import FilterControls from './FilterControls';
import SuggestedPrompts from './SuggestedPrompts';
import { ChatWindowRef } from '../App';
import { supabase } from '../services/supabase';

interface ChatWindowProps {
    onDownload: (item: Omit<DownloadHistoryItem, 'id' | 'timestamp' | 'status'>) => void;
    session: Session | null;
    onLoginRequest: () => void;
}

// Check for API keys at the module level.
const isOpenAIEnabled = !!process.env.OPENAI_API_KEY;
const isCopilotEnabled = !!process.env.COPILOT_API_KEY;
const isDeepSeekEnabled = !!process.env.DEEPSEEK_API_KEY;


const ChatWindow = forwardRef<ChatWindowRef, ChatWindowProps>(({ onDownload, session, onLoginRequest }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState<SoftwareFilter>('all');
    const [provider, setProvider] = useState<AIProvider>('gemini');
    const [inputPlaceholder, setInputPlaceholder] = useState('Ask for software...');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const initialMessage: Message = {
        id: 'init',
        text: "Hello! I can help you find safe software, games, and drivers for Windows, macOS, Linux, and Android. What are you looking for today?",
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

            setIsLoading(true);
            const { data, error } = await supabase
                .from('chat_history')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching chat history:", error);
                setMessages([initialMessage]);
            } else {
                if (data.length === 0) {
                    setMessages([initialMessage]);
                } else {
                    setMessages(data as Message[]);
                }
            }
            setIsLoading(false);
        };

        fetchHistory();
    }, [session]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        // Logic to update placeholder based on conversation context
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.sender === 'bot' && !isLoading) {
             if (lastMessage.type === 'driver-input-prompt' || lastMessage.type === 'driver-device-prompt' || lastMessage.type === 'driver-device-selection') {
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
        } else if (isLoading) {
            // Optional: You could set a 'waiting' placeholder here
        } else {
            // Reset placeholder if the last message is from the user or it's the start of the chat
            setInputPlaceholder('Ask for software...');
        }
    }, [messages, isLoading]);

    const getBotResponse = async (history: Message[], currentFilter: SoftwareFilter, currentSession: Session | null) => {
        setIsLoading(true);

        const providers = {
            openai: { enabled: isOpenAIEnabled, name: "OpenAI" },
            copilot: { enabled: isCopilotEnabled, name: "Microsoft Copilot" },
            deepseek: { enabled: isDeepSeekEnabled, name: "DeepSeek" },
        };
        
        if (provider !== 'gemini' && !providers[provider as keyof typeof providers].enabled) {
            const errorMessage: Message = {
                id: `err-${Date.now()}`,
                text: `The ${providers[provider as keyof typeof providers].name} API key is not configured. Please switch to an enabled provider.`,
                sender: 'bot',
                type: 'standard',
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
        }


        try {
            const botResponse = await findSoftware(provider, history, currentFilter, currentSession);
            const botMessage: Message = {
                id: `bot-${Date.now()}`,
                text: botResponse.text,
                sender: 'bot',
                groundingChunks: botResponse.groundingChunks,
                type: botResponse.type,
                platform: botResponse.platform,
            };
            setMessages(prev => [...prev, botMessage]);

            // Save bot message to DB if user is logged in
            if (session) {
                await supabase.from('chat_history').insert({
                    user_id: session.user.id,
                    text: botMessage.text,
                    sender: 'bot',
                    grounding_chunks: botMessage.groundingChunks || null,
                    type: botMessage.type || 'standard',
                    platform: botMessage.platform || null,
                });
            }

        } catch (error) {
            console.error("Failed to get response:", error);
            const errorMessage: Message = {
                id: `err-${Date.now()}`,
                text: "Sorry, something went wrong. Please try again.",
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
        await supabase.from('chat_history').insert({
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
    
    const handleProviderChange = (newProvider: AIProvider) => {
        setProvider(newProvider);

        const providerAvailability = {
            openai: isOpenAIEnabled,
            copilot: isCopilotEnabled,
            deepseek: isDeepSeekEnabled,
        };

        const providerNames = {
            openai: 'OpenAI',
            copilot: 'Microsoft Copilot',
            deepseek: 'DeepSeek',
        };

        if (newProvider !== 'gemini' && !providerAvailability[newProvider as keyof typeof providerAvailability]) {
            const errorMessage: Message = {
                id: `err-${Date.now()}`,
                text: `${providerNames[newProvider as keyof typeof providerNames]} is not available. The API key is not configured.`,
                sender: 'bot',
                type: 'standard',
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
    };


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

        await supabase.from('chat_history').insert({
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
            const { error } = await supabase
                .from('chat_history')
                .delete()
                .eq('user_id', session.user.id);
            
            if (error) {
                console.error("Error clearing chat history:", error);
                alert("Could not clear your history. Please try again.");
            } else {
                setMessages([initialMessage]);
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
                activeProvider={provider}
                onProviderChange={handleProviderChange}
                isOpenAIEnabled={isOpenAIEnabled}
                isCopilotEnabled={isCopilotEnabled}
                isDeepSeekEnabled={isDeepSeekEnabled}
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
                        userAvatarUrl={session?.user?.user_metadata?.avatar_url}
                    />
                ))}

                {isLoading && <TypingIndicator />}

                {!isLoading && messages.length <= 1 && (
                    <SuggestedPrompts onPromptClick={handleSendMessage} />
                )}

                <div ref={messagesEndRef} />
            </div>
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} placeholder={inputPlaceholder} />
        </div>
    );
});

export default ChatWindow;
