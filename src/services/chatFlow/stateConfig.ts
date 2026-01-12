import { ChatStateConfig, SessionContext, FlowState, Intent } from './types';

// Helper to check if we have enough info to save a device
const hasEnoughDeviceToSave = (ctx: SessionContext): boolean => {
    const { manufacturer, model, osFamily } = ctx.device;
    return !!(manufacturer && model && osFamily);
};

const needsSerialForDriverPortal = (ctx: SessionContext): boolean => {
    const { intent } = ctx;
    const { manufacturer } = ctx.device;
    if (intent !== 'driver') return false;
    const brand = manufacturer?.toLowerCase() || '';
    return ['dell', 'hp', 'lenovo'].includes(brand);
};

// Partial config map - strict typing would be better but for speed/flexibility we use record
export const stateConfig: Record<FlowState, ChatStateConfig> = {
    'S0_START': {
        id: 'S0_START',
        nextState: () => 'S1_DETECT_INTENT'
    },
    'S1_DETECT_INTENT': {
        id: 'S1_DETECT_INTENT',
        message: () => "Do you need a driver, a software app, or a game?",
        ui: {
            type: 'buttons',
            options: ['Driver', 'Software', 'Game']
        },
        processInput: (ctx, input) => {
            const lower = input.toLowerCase();
            let intent: Intent = null;
            let queryName = null;

            if (lower.includes('driver')) intent = 'driver';
            else if (lower.includes('game')) intent = 'game';
            else if (lower.includes('software') || lower.includes('app')) intent = 'software';

            // Basic extraction if user typed "I need vlc"
            if (!intent && lower.length > 2) {
                // Heuristic: default to software if ambiguous text
                intent = 'software';
                queryName = input;
            }

            return { intent, request: { ...ctx.request, queryName: queryName || ctx.request.queryName } };
        },
        nextState: (ctx) => {
            if (ctx.intent) return 'S2_CHECK_SAVED_DEVICES';
            return 'S1_DETECT_INTENT'; // Loop if unclear
        }
    },
    'S2_CHECK_SAVED_DEVICES': {
        id: 'S2_CHECK_SAVED_DEVICES',
        nextState: (_ctx) => {
            // In a real app, this would check the redux store or context for loaded devices
            // For now, we assume the engine injects this knowledge effectively or we transition
            // logic resides in the engine. 
            // If we have saved devices (passed in context elsewhere), go S3.
            return 'S4_ASK_DEVICE_TYPE'; // Default fallback, engine overrides if devices exist
        }
    },
    'S3_ASK_SELECT_DEVICE': {
        id: 'S3_ASK_SELECT_DEVICE',
        message: () => "Is this for one of your saved devices?",
        ui: {
            type: 'select',
            // Options provided by engine at runtime
            options: ['Yes, use saved device', 'No, different device']
        },
        helpTopics: ["What is a saved device?"],
        processInput: (_ctx, input) => {
            // Logic handled by engine mostly to Hydrate context from DB
            if (input.includes('No') || input.includes('different')) {
                return { deviceSelectedFromProfile: false };
            }
            return { deviceSelectedFromProfile: true };
        },
        nextState: (_ctx, input) => {
            if (input.includes('No')) return 'S4_ASK_DEVICE_TYPE';
            return 'S10_ASK_REQUEST_DETAILS';
        }
    },
    'S4_ASK_DEVICE_TYPE': {
        id: 'S4_ASK_DEVICE_TYPE',
        message: () => "What device are you using?",
        ui: {
            type: 'buttons',
            options: ['Laptop', 'Desktop', 'Phone', 'Tablet']
        },
        helpTopics: ["I'm not sure"],
        processInput: (ctx, input) => ({
            device: { ...ctx.device, type: input as any }
        }),
        nextState: () => 'S5_ASK_OS_FAMILY'
    },
    'S5_ASK_OS_FAMILY': {
        id: 'S5_ASK_OS_FAMILY',
        message: () => "Which operating system is on the device?",
        ui: {
            type: 'select',
            options: ['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'ChromeOS']
        },
        helpTopics: ["Find OS on Windows", "Find OS on Mac"],
        processInput: (ctx, input) => ({
            device: { ...ctx.device, osFamily: input as any }
        }),
        nextState: () => 'S6_ASK_OS_VERSION'
    },
    'S6_ASK_OS_VERSION': {
        id: 'S6_ASK_OS_VERSION',
        message: (ctx) => `What version of ${ctx.device.osFamily} is it? (e.g. 11, 10, Sequoia)`,
        ui: { type: 'text' },
        helpTopics: ["Find Windows version", "Find macOS version"],
        processInput: (ctx, input) => ({
            device: { ...ctx.device, osVersion: input }
        }),
        nextState: () => 'S7_ASK_MANUFACTURER'
    },
    'S7_ASK_MANUFACTURER': {
        id: 'S7_ASK_MANUFACTURER',
        message: () => "What is the device manufacturer?",
        ui: {
            type: 'select',
            options: ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS', 'Acer', 'Microsoft', 'Other']
        },
        helpTopics: ["Where to find manufacturer"],
        processInput: (ctx, input) => ({
            device: { ...ctx.device, manufacturer: input }
        }),
        nextState: () => 'S8_ASK_MODEL'
    },
    'S8_ASK_MODEL': {
        id: 'S8_ASK_MODEL',
        message: () => "What is the model name? (e.g. XPS 15, Pavilion 15)",
        ui: { type: 'text' },
        helpTopics: ["Find model on Windows", "Check the label under the laptop"],
        processInput: (ctx, input) => ({
            device: { ...ctx.device, model: input }
        }),
        nextState: (ctx) => {
            if (needsSerialForDriverPortal(ctx)) return 'S9_ASK_SERIAL_CONDITIONAL';
            return 'S10_ASK_REQUEST_DETAILS';
        }
    },
    'S9_ASK_SERIAL_CONDITIONAL': {
        id: 'S9_ASK_SERIAL_CONDITIONAL',
        message: () => "Do you know the serial number or service tag? It helps find the exact driver.",
        ui: {
            type: 'buttons',
            options: ["I have it", "I don't know"]
        },
        helpTopics: ["Find serial on Dell", "Find serial on HP"],
        processInput: (ctx, input) => {
            if (input === "I have it") return {}; // Wait for text? Or UI handles prompt?
            // Assuming next input is the serial if they didn't click "Don't know"
            // For simplicity here, we assume standard flow text input if not button click
            if (input !== "I don't know" && input !== "I have it") {
                return { device: { ...ctx.device, serial: input } };
            }
            return { device: { ...ctx.device, serial: null } };
        },
        nextState: () => 'S10_ASK_REQUEST_DETAILS'
    },
    'S10_ASK_REQUEST_DETAILS': {
        id: 'S10_ASK_REQUEST_DETAILS',
        message: (ctx) => {
            if (ctx.intent === 'driver') return "Which driver do you need?";
            if (ctx.intent === 'game') return "What game do you want?";
            return "What software do you want?";
        },
        ui: {
            type: (ctx: SessionContext): 'select' | 'text' => ctx.intent === 'driver' ? 'select' : 'text',
            options: (ctx: SessionContext) => ctx.intent === 'driver' ?
                ['Wi-Fi', 'Audio', 'Graphics', 'Bluetooth', 'Chipset', 'BIOS', 'Touchpad', 'Camera'] : []
        },
        processInput: (ctx, input) => {
            if (ctx.intent === 'driver') return { request: { ...ctx.request, driverType: input } };
            return { request: { ...ctx.request, queryName: input } };
        },
        nextState: () => 'S11_CONFIRM_SUMMARY'
    },
    'S11_CONFIRM_SUMMARY': {
        id: 'S11_CONFIRM_SUMMARY',
        message: (ctx) => {
            const dev = ctx.deviceSelectedFromProfile ? 'Saved Device' : `${ctx.device.manufacturer} ${ctx.device.model}`;
            const req = ctx.request.driverType || ctx.request.queryName;
            return `Confirm: ${dev}, ${ctx.device.osFamily} ${ctx.device.osVersion}. Request: ${req}. Proceed?`;
        },
        ui: {
            type: 'buttons',
            options: ['Yes', 'Edit']
        },
        processInput: (ctx, input) => {
            if (input === 'Yes') return { confirmation: { ...ctx.confirmation, confirmed: true } };
            return {};
        },
        nextState: (_ctx, input) => {
            if (input === 'Yes') return 'S12_SEARCH_AND_EXTRACT';
            return 'S0_START'; // Simplistic "Edit" -> Start Over for now (MVP)
        }
    },
    // ... Placeholder for searching states
    'S12_SEARCH_AND_EXTRACT': { id: 'S12_SEARCH_AND_EXTRACT', nextState: () => 'S15_PRESENT_RESULT' },
    'S12_NO_RESULTS': { id: 'S12_NO_RESULTS' },
    'S13_SAFETY_CHECK_URL': { id: 'S13_SAFETY_CHECK_URL' },
    'S14_QUEUE_DOWNLOAD_HISTORY': { id: 'S14_QUEUE_DOWNLOAD_HISTORY' },
    'S15_PRESENT_RESULT': {
        id: 'S15_PRESENT_RESULT',
        message: () => "I found a safe option based on your details.",
        ui: { type: 'card' }, // Special UI handling
        nextState: (ctx) => {
            if (!ctx.deviceSelectedFromProfile && hasEnoughDeviceToSave(ctx)) return 'S16_OFFER_SAVE_DEVICE';
            return 'S19_OFFER_INSTALL_HELP';
        }
    },
    'S16_OFFER_SAVE_DEVICE': {
        id: 'S16_OFFER_SAVE_DEVICE',
        message: () => "Save this device to your profile for faster searches next time?",
        ui: { type: 'buttons', options: ['Save device', 'Not now'] },
        nextState: (_ctx, input) => {
            if (input === 'Save device') return 'S17_SAVE_DEVICE_NAME';
            return 'S19_OFFER_INSTALL_HELP';
        }
    },
    'S17_SAVE_DEVICE_NAME': {
        id: 'S17_SAVE_DEVICE_NAME',
        message: () => "What name do you want to call this device? (e.g. Work Laptop)",
        ui: { type: 'text' },
        processInput: (ctx, input) => ({ device: { ...ctx.device, deviceName: input } }),
        nextState: () => 'S18_SAVE_DEVICE_COMMIT'
    },
    'S18_SAVE_DEVICE_COMMIT': { id: 'S18_SAVE_DEVICE_COMMIT', nextState: () => 'S19_OFFER_INSTALL_HELP' },
    'S19_OFFER_INSTALL_HELP': {
        id: 'S19_OFFER_INSTALL_HELP',
        message: () => "Need help installing it?",
        ui: { type: 'buttons', options: ['Yes', 'No'] },
        nextState: (_ctx, input) => input === 'Yes' ? 'S20_INSTALL_GUIDE' : 'S_END'
    },
    'S20_INSTALL_GUIDE': { id: 'S20_INSTALL_GUIDE', message: () => "Here is a quick guide...", nextState: () => 'S_END' },
    'S21_OFFER_VIDEO_GUIDES': { id: 'S21_OFFER_VIDEO_GUIDES' },
    'S22_PRESENT_GUIDES': { id: 'S22_PRESENT_GUIDES' },
    'S_END': {
        id: 'S_END',
        message: () => "Anything else you want to install or fix?",
        ui: { type: 'buttons', options: ['New request', 'Done'] },
        nextState: (_ctx, input) => input === 'New request' ? 'S0_START' : 'S_END' // Handled by engine mostly
    },
    'S_ERR': { id: 'S_ERR' }
};
