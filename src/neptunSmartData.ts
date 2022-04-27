export enum Register {
    // 13-bit value
    Config = 0,
    // 4-bit value
    WiredSensorsStatus = 3,
    // Number of wireless sensors connected
    WirelessSensorsCount = 6,
    // First wireless sensor register
    WirelessSenorStatus = 57
}

// Neptun Smart device config
export interface Config {
    floorWashMode: boolean; // 0
    alarmFirstGroup: boolean; // 1
    alarmSecondGroup: boolean; // 2
    wirelessSensorsLowBattery: boolean; // 3
    wirelessSensorsConnectionLost: boolean; // 4
    valveCloseOnFirstGroupLostConnection: boolean; // 5
    valveCloseOnSecondGroupLostConnection: boolean; // 6
    paringModeActive: boolean; // 7
    valveOpenFirstGroup: boolean; // 8
    valveOpenSecondGroup: boolean; // 9
    groupsEnabled: boolean; // A
    valveCloseOnLostConnection: boolean; // B
    keyboardLocked: boolean; // C
}

// Wired sensors status
export interface WiredSensorsStatus {
    alarmDetectedLineOne: boolean; // 0
    alarmDetectedLineTwo: boolean; // 1
    alarmDetectedLineThree: boolean; // 2
    alarmDetectedLineFour: boolean; // 3
}

// Number of wireless sensors connected
export interface WirelessSensorsCount {
    wirelessSensorsCount: number;
}

// Structure of each wireless sensor status
export interface WirelessSenorStatus {
    alarmDetected: boolean; // 0
    connectionLost: boolean; // 2
    batteryLevel: number; // F-8
}