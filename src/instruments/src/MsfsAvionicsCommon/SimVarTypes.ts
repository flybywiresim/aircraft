import { SimVarDefinition, SimVarValueType } from 'msfssdk';

export interface DisplayVars {
    elec: number;
    elecFo: number;
    potentiometerCaptain: number;
    potentiometerFo: number;
}

export interface AdirsSimVars {
    pitch: number;
    roll: number;
    heading: number;
    altitude: number;
    speed: number;
    vsInert: number;
    vsBaro: number;
    groundTrack: number;
    groundSpeed: number;
    fpaRaw: number;
    daRaw: number;
    mach: number;
}

export enum AdirsVars {
    pitch = 'L:A32NX_ADIRS_IR_1_PITCH',
    roll = 'L:A32NX_ADIRS_IR_1_ROLL',
    heading = 'L:A32NX_ADIRS_IR_1_HEADING',
    altitude = 'L:A32NX_ADIRS_ADR_1_ALTITUDE',
    speed = 'L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED',
    vsInert = 'L:A32NX_ADIRS_IR_1_VERTICAL_SPEED',
    vsBaro = 'L:A32NX_ADIRS_ADR_1_BAROMETRIC_VERTICAL_SPEED',
    groundTrack = 'L:A32NX_ADIRS_IR_1_TRACK',
    groundSpeed = 'L:A32NX_ADIRS_IR_1_GROUND_SPEED',
    fpaRaw = 'L:A32NX_ADIRS_IR_1_FLIGHT_PATH_ANGLE',
    daRaw = 'L:A32NX_ADIRS_IR_1_DRIFT_ANGLE',
    mach = 'L:A32NX_ADIRS_ADR_1_MACH',
}

export const AdirsSimVarDefinitions = new Map<keyof AdirsSimVars, SimVarDefinition>([
    ['pitch', { name: AdirsVars.pitch, type: SimVarValueType.Number }],
    ['roll', { name: AdirsVars.roll, type: SimVarValueType.Number }],
    ['heading', { name: AdirsVars.heading, type: SimVarValueType.Number }],
    ['altitude', { name: AdirsVars.altitude, type: SimVarValueType.Number }],
    ['speed', { name: AdirsVars.speed, type: SimVarValueType.Number }],
    ['groundTrack', { name: AdirsVars.groundTrack, type: SimVarValueType.Number }],
    ['groundSpeed', { name: AdirsVars.groundSpeed, type: SimVarValueType.Number }],
    ['fpaRaw', { name: AdirsVars.fpaRaw, type: SimVarValueType.Number }],
    ['daRaw', { name: AdirsVars.daRaw, type: SimVarValueType.Number }],
    ['mach', { name: AdirsVars.mach, type: SimVarValueType.Number }],
]);

export interface SwitchingPanelVSimVars {
    attHdgKnob: number;
    airKnob: number;
}

export enum SwitchingPanelVars {
    attHdgKnob = 'L:A32NX_ATT_HDG_SWITCHING_KNOB',
    airKnob = 'L:A32NX_AIR_DATA_SWITCHING_KNOB',
}

export const SwitchingPanelSimVarsDefinitions = new Map<keyof SwitchingPanelVSimVars, SimVarDefinition>([
    ['attHdgKnob', { name: SwitchingPanelVars.attHdgKnob, type: SimVarValueType.Enum }],
    ['airKnob', { name: SwitchingPanelVars.airKnob, type: SimVarValueType.Enum }],
]);
