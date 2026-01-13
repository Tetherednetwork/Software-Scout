import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { Message, SoftwareFilter, DownloadHistoryItem, Session, SavedDevice } from '../../types';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import FilterControls from './FilterControls';
import { ChatWindowRef } from '../../App';
import { dbService } from '../../services/dbService';
import { useChatFlow } from '../../services/chatFlow/engine';
import { findSoftware } from '../../services/aiService';

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

    // State Machine Hook
    const flow = useChatFlow();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initialMessage: Message = {
        id: 'init',
        text: "Hello! I'm SoftMonk. I can help you find safe software, games, and drivers. What are you looking for today?",
        sender: 'bot',
        type: 'standard',
        options: ['Driver', 'Software', 'Game'] // Init options matching S0->S1 flow approximately or generic
    };

    // Load chat history or init state
    useEffect(() => {
        // Logic to update placeholder based on conversation context
        if (isLoading) {
            setInputPlaceholder('SoftMonk is typing...');
        } else {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.sender === 'bot') {
                const text = lastMessage.text.toLowerCase();
                // Check keywords to set a helpful placeholder
                if (text.includes('model') || text.includes('serial') || text.includes('service tag')) {
                    setInputPlaceholder('Enter your device model or serial...');
                } else if (text.includes('manufacturer') || text.includes('brand')) {
                    // Usually buttons, but fallback text input
                    setInputPlaceholder('Type the manufacturer name...');
                } else if (text.includes('operating system') || text.includes('os version') || text.includes('which version')) {
                    setInputPlaceholder('e.g. Windows 11, macOS Sequoia...');
                } else if (text.includes('driver') && text.includes('need')) {
                    setInputPlaceholder('e.g. Wi-Fi, Audio, Graphics...');
                } else if (text.includes('name do you want to call')) {
                    setInputPlaceholder('e.g. My Work Laptop...');
                } else if (text.includes('save this device')) {
                    setInputPlaceholder('Type "Save device" or "Not now"...');
                } else {
                    setInputPlaceholder('Ask for software...');
                }
            } else {
                // Reset placeholder if the last message is from the user or it's the start of the chat
                setInputPlaceholder('Ask for software...');
            }
        };
        const fetchHistory = async () => {
            if (!session) {
                // Initial State Machine Start
                const { message, ui } = flow.transition(''); // S0 -> Next (S1) essentially
                if (message) {
                    setMessages([{ ...initialMessage, text: message, options: normalizeOptions(ui?.options) }]);
                } else {
                    setMessages([initialMessage]);
                }
                return;
            }

            try {
                const { data, error } = await dbService.getChatHistory(session.user.id);
                if (error || !data || data.length === 0) {
                    const { message, ui } = flow.transition('');
                    if (message) {
                        setMessages([{ ...initialMessage, text: message, options: normalizeOptions(ui?.options) }]);
                    } else {
                        setMessages([initialMessage]);
                    }
                } else {
                    setMessages(data as Message[]);
                }
            } catch (e) {
                console.error("Critical error loading history:", e);
                setMessages([initialMessage]);
            }
        };
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, isLoading, messages]); // Run once on session change

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Helper to normalize options from state config (string[] | func) to string[]
    const normalizeOptions = (opts: any): string[] | undefined => {
        if (!opts) return undefined;
        if (typeof opts === 'function') return opts(flow.context);
        return opts;
    };

    // --- MAIN LOGIC: Observe State Machine for Side Effects (Like Searching S12) ---
    useEffect(() => {
        const performAsyncSearch = async () => {
            if (flow.currentState === 'S12_SEARCH_AND_EXTRACT' && !isLoading) {
                setIsLoading(true);

                // synthesize query
                const ctx = flow.context;
                const deviceStr = ctx.deviceSelectedFromProfile
                    ? 'my saved device'
                    : `${ctx.device.manufacturer || ''} ${ctx.device.model || ''} ${ctx.device.osFamily || ''}`;

                const query = `Find ${ctx.intent || 'software'}: ${ctx.request.driverType || ctx.request.queryName || ''} for ${deviceStr}.`;

                // Use Injectable Context Pattern for accuracy
                const systemContext = `[SYSTEM CONTEXT: The user wants ${ctx.intent}. Dev: ${ctx.device.manufacturer} ${ctx.device.model}, OS: ${ctx.device.osFamily}. Req: ${ctx.request.driverType || ctx.request.queryName}.]`;

                // Add a temporary user message representing this synthesized intent (invisible or visible? Visible is better for history)
                // Actually the user just clicked "Yes" to confirm summary. We don't need to add another user message.
                // We will just call the AI service.

                try {
                    // We construct a specific history for the AI Service to force it to respect our context
                    // We take the current visual history + our strong system context
                    const searchHistory = [
                        ...messages,
                        {
                            id: 'sys-context',
                            text: systemContext + "\n" + query,
                            sender: 'user',
                            type: 'standard'
                        } as Message
                    ];

                    const response = await findSoftware(searchHistory, filter, session);

                    // Now we have the result. We need to manually advance the state machine to S15 or S12_NO_RESULTS
                    // We can mock an input to the machine to force it, or exposes a set method. 
                    // Current machine relies on 'transition'.
                    // Looking at stateConfig: S12->S15 is unconditional in nextState.
                    // So we just call transition once to move it.

                    const { ui } = flow.transition('success'); // Input doesn't matter for S12->S15

                    const botMessage: Message = {
                        id: `bot-${Date.now()}`,
                        text: response.text, // Use the AI's rich response instead of the generic S15 message if valid
                        sender: 'bot',
                        groundingChunks: response.groundingChunks,
                        type: response.type,
                        platform: response.platform,
                        suggestedDevice: response.suggestedDevice,
                        options: normalizeOptions(ui?.options) // S15 options (Save device, etc)
                    };

                    setMessages(prev => [...prev, botMessage]);

                    if (session) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { suggestedDevice, options, ...msgForDb } = botMessage;
                        await dbService.addChatMessage(session.user.id, msgForDb);
                    }

                } catch (error) {
                    console.error("Search failed", error);
                    setMessages(prev => [...prev, {
                        id: `err-${Date.now()}`,
                        text: "I encountered an error searching for that. Please try again.",
                        sender: 'bot'
                    }]);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        performAsyncSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flow.currentState]);


    const handleUserTurn = async (inputText: string) => {
        if (!inputText.trim()) return;

        // 1. Add User Message to UI
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            text: inputText,
            sender: 'user',
            user_id: session?.user.id
        };
        const newHistory = [...messages, userMessage];
        setMessages(newHistory);

        if (session) await dbService.addChatMessage(session.user.id, { ...userMessage, type: 'standard' });

        // 2. Transition State Machine
        const { message, ui, state: nextState } = flow.transition(inputText);

        // 3. Handle specific states that DON'T require async wait (everything except S12)
        if (nextState !== 'S12_SEARCH_AND_EXTRACT' && message) {
            // Simulate "Thinking" brief delay for better UX if not immediate
            setIsLoading(true);
            setTimeout(async () => {
                const botMessage: Message = {
                    id: `bot-${Date.now()}`,
                    text: message,
                    sender: 'bot',
                    type: 'standard', // We could map state to types if needed
                    options: normalizeOptions(ui?.options)
                };
                setMessages(prev => [...prev, botMessage]);
                setIsLoading(false);

                if (session) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { options, ...msgForDb } = botMessage;
                    await dbService.addChatMessage(session.user.id, msgForDb);
                }
            }, 600);
        }
    };

    // Public API
    useImperativeHandle(ref, () => ({
        sendMessage: (text: string) => {
            if (!session) { onLoginRequest(); return; }
            handleUserTurn(text);
        }
    }));

    const handleOptionSelect = (optionText: string) => {
        handleUserTurn(optionText);
    };

    const handleUserSaveDevice = async (device: Partial<SavedDevice>) => {
        if (!session) return;
        // Use flow context if available to fill gaps
        const fullDevice = {
            ...device,
            name: device.name || `${device.brand} ${device.model}`,
            type: 'other' as const,
            brand: device.brand || flow.context.device.manufacturer || 'Unknown',
            model: device.model || flow.context.device.model || 'Unknown',
            os_family: device.os_family || flow.context.device.osFamily || 'Windows',
            os_version: device.os_version || flow.context.device.osVersion || '',
            serial_number: device.serial_number || flow.context.device.serial || ''
        };

        const { error } = await dbService.addDevice(session.user.id, fullDevice as any);
        if (error) {
            onShowToast("Failed to save device. Please try again.");
        } else {
            onShowToast(`Successfully saved ${fullDevice.name}!`);
            const currentMessages = [...messages];
            const lastMsg = currentMessages[currentMessages.length - 1];
            if (lastMsg && lastMsg.suggestedDevice) {
                const updatedLastMsg = { ...lastMsg, suggestedDevice: undefined };
                currentMessages[currentMessages.length - 1] = updatedLastMsg;
                setMessages(currentMessages);
            }
            // Auto advance flow if we are in S16/S17
            if (flow.currentState === 'S16_OFFER_SAVE_DEVICE') {
                handleUserTurn('Save device');
            }
        }
    };

    const handleClearHistory = async () => {
        if (!session) return;
        if (window.confirm("Clear history?")) {
            await dbService.clearChatHistory(session.user.id);
            setMessages([initialMessage]);
            flow.reset(); // Reset state machine
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
                <div ref={messagesEndRef} />
            </div>

            {/* Input is effectively driven by the State Machine's needs for S12 or standard input */}
            <ChatInput
                onSendMessage={handleUserTurn}
                isLoading={isLoading}
                placeholder={inputPlaceholder}
            />
            {/* Note: We rely on MessageItem to render the 'options' bubbles which are passed from the machine */}
        </div>
    );
});

export default ChatWindow;