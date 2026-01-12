

export type Intent = 'software' | 'game' | 'driver' | null;
export type FlowState =
    | 'S0_START'
    | 'S1_DETECT_INTENT'
    | 'S2_CHECK_SAVED_DEVICES'
    | 'S3_ASK_SELECT_DEVICE'
    | 'S4_ASK_DEVICE_TYPE'
    | 'S5_ASK_OS_FAMILY'
    | 'S6_ASK_OS_VERSION'
    | 'S7_ASK_MANUFACTURER'
    | 'S8_ASK_MODEL'
    | 'S9_ASK_SERIAL_CONDITIONAL'
    | 'S10_ASK_REQUEST_DETAILS'
    | 'S11_CONFIRM_SUMMARY'
    | 'S12_SEARCH_AND_EXTRACT'
    | 'S12_NO_RESULTS'
    | 'S13_SAFETY_CHECK_URL'
    | 'S14_QUEUE_DOWNLOAD_HISTORY'
    | 'S15_PRESENT_RESULT'
    | 'S16_OFFER_SAVE_DEVICE'
    | 'S17_SAVE_DEVICE_NAME'
    | 'S18_SAVE_DEVICE_COMMIT'
    | 'S19_OFFER_INSTALL_HELP'
    | 'S20_INSTALL_GUIDE'
    | 'S21_OFFER_VIDEO_GUIDES'
    | 'S22_PRESENT_GUIDES'
    | 'S_END'
    | 'S_ERR';

export interface SessionContext {
    intent: Intent;
    deviceSelectedFromProfile: boolean;
    deviceId: string | null;
    device: {
        deviceName: string | null;
        manufacturer: string | null;
        model: string | null;
        serial: string | null;
        osFamily: 'Windows' | 'macOS' | 'ChromeOS' | 'Linux' | 'Android' | 'iOS' | null;
        osVersion: string | null;
        arch: 'x64' | 'arm64' | 'x86' | null;
        type?: 'Laptop' | 'Desktop' | 'Phone' | 'Tablet' | 'Other' | null;
    };
    request: {
        queryName: string | null;
        driverType: string | null; // 'wifi' | 'audio' | ...
        platform: 'Steam' | 'Epic' | 'Standalone' | 'AppStore' | 'PlayStore' | null;
        versionPreference: 'latest' | 'specific' | null;
        specificVersion: string | null;
    };
    confirmation: {
        summary: string | null;
        confirmed: boolean;
    };
    outcomes: {
        candidateLinks: any[];
        selectedLink: any | null;
        riskStatus: 'verified' | 'warned' | 'quarantined' | 'blocked' | null;
        downloadHistoryId: string | null;
    };
    saveDeviceOffer: {
        eligible: boolean;
        userChoice: 'save' | 'not_now' | null;
        needsDeviceName: boolean;
    };
    installHelp: {
        offered: boolean;
        accepted: boolean;
    };
}

export interface ChatStateConfig {
    id: FlowState;
    message?: (ctx: SessionContext) => string;
    ui?: {
        type?: 'text' | 'select' | 'buttons' | 'card' | 'none' | ((ctx: SessionContext) => 'text' | 'select' | 'buttons' | 'card' | 'none');
        options?: string[] | ((ctx: SessionContext) => string[]);
        component?: string; // For special UI like 'DeviceCard'
    };
    helpTopics?: string[];
    processInput?: (ctx: SessionContext, input: string) => Partial<SessionContext>;
    nextState?: (ctx: SessionContext, input: string) => FlowState;
}
