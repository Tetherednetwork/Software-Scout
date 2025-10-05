import { findSoftware as findSoftwareGemini } from './geminiService';
import { findSoftware as findSoftwareOpenAI } from './openAIService';
import { findSoftware as findSoftwareAzure } from './copilotService';
import { findSoftware as findSoftwareDeepSeek } from './deepseekService';
import type { AIProvider, Message, SoftwareFilter, Session } from '../types';
import type { BotResponse } from './geminiService';

/**
 * A central function to route the user's request to the selected AI provider.
 * This abstracts the logic away from the main component, allowing for easy
 * addition of new providers in the future.
 *
 * @param provider - The selected AI provider ('gemini', 'openai', 'azure', or 'deepseek').
 * @param history - The current chat history.
 * @param filter - The active software filter.
 * @param session - The user's current session, or null if not logged in.
 * @returns A promise that resolves to the bot's response.
 */
export const findSoftware = (
    provider: AIProvider, 
    history: Message[], 
    filter: SoftwareFilter,
    session: Session | null
): Promise<BotResponse> => {
    if (provider === 'openai') {
        // Route to the OpenAI service if selected.
        return findSoftwareOpenAI(history, filter, session);
    } else if (provider === 'azure') {
        // Route to the Azure AI Foundry service if selected.
        return findSoftwareAzure(history, filter, session);
    } else if (provider === 'deepseek') {
        // Route to the DeepSeek service if selected.
        return findSoftwareDeepSeek(history, filter, session);
    }
    // Default to the Gemini service.
    return findSoftwareGemini(history, filter, session);
};