import { useState, useCallback } from 'react';
import { FlowState, SessionContext } from './types';
import { stateConfig } from './stateConfig';

const initialContext: SessionContext = {
    intent: null,
    deviceSelectedFromProfile: false,
    deviceId: null,
    device: {
        deviceName: null,
        manufacturer: null,
        model: null,
        serial: null,
        osFamily: null,
        osVersion: null,
        arch: null
    },
    request: {
        queryName: null,
        driverType: null,
        platform: null,
        versionPreference: null,
        specificVersion: null
    },
    confirmation: {
        summary: null,
        confirmed: false
    },
    outcomes: {
        candidateLinks: [],
        selectedLink: null,
        riskStatus: null,
        downloadHistoryId: null
    },
    saveDeviceOffer: {
        eligible: false,
        userChoice: null,
        needsDeviceName: false
    },
    installHelp: {
        offered: false,
        accepted: false
    }
};

export const useChatFlow = () => {
    const [currentState, setCurrentState] = useState<FlowState>('S0_START');
    const [context, setContext] = useState<SessionContext>(initialContext);

    // Main transition function
    const transition = useCallback((input: string) => {
        const config = stateConfig[currentState];

        let newContext = { ...context };

        // 1. Process Input into Context
        if (config.processInput) {
            const updates = config.processInput(context, input);
            newContext = {
                ...newContext,
                ...updates,
                // Deep merge careful handling needed in real app, simple spread here
                device: { ...newContext.device, ...(updates.device || {}) },
                request: { ...newContext.request, ...(updates.request || {}) },
                confirmation: { ...newContext.confirmation, ...(updates.confirmation || {}) }
            };
        }

        // 2. Determine Next State
        let nextStateId: FlowState = currentState;
        if (config.nextState) {
            nextStateId = config.nextState(newContext, input);
        }

        // 3. Update State
        setContext(newContext);
        setCurrentState(nextStateId);

        // 4. Return Output (Message & UI for the *new* state)
        // We return the config of the NEXT state so the UI knows what to render
        const nextConfig = stateConfig[nextStateId];

        // Auto-advance states loop (e.g. S12->S15 logic without user input)
        // For MVP we just return the state and let UI trigger 'transition' again if needed or use Effect.

        return {
            state: nextStateId,
            message: nextConfig.message ? nextConfig.message(newContext) : null,
            ui: nextConfig.ui,
            context: newContext
        };

    }, [currentState, context]);

    const reset = useCallback(() => {
        setCurrentState('S0_START');
        setContext(initialContext);
    }, []);

    return {
        currentState,
        context,
        transition,
        reset
    };
};
