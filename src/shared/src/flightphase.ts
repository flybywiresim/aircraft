import { VerticalMode } from '@shared/autopilot';

export enum FmgcFlightPhase {
    Preflight,
    Takeoff,
    Climb,
    Cruise,
    Descent,
    Approach,
    GoAround,
    Done,
}

export function isReady(): boolean {
    return SimVar.GetSimVarValue('L:A32NX_IS_READY', 'number') === 1;
}

export function isSlewActive(): boolean {
    return SimVar.GetSimVarValue('IS SLEW ACTIVE', 'bool');
}

export function isOnGround(): boolean {
    return SimVar.GetSimVarValue('L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED', 'bool')
        || SimVar.GetSimVarValue('L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED', 'bool');
}

function isEngineOn(index: number): boolean {
    return SimVar.GetSimVarValue(`L:A32NX_ENGINE_N2:${index}`, 'number') > 20;
}

function isEngineOnTakeOffThrust(index: number): boolean {
    return SimVar.GetSimVarValue(`L:A32NX_ENGINE_N1:${index}`, 'number') >= 70;
}

export function isAnEngineOn(): boolean {
    return isEngineOn(1) || isEngineOn(2);
}

export function isAllEngineOn(): boolean {
    return isEngineOn(1) && isEngineOn(2);
}

export function getAutopilotVerticalMode(): VerticalMode {
    return SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');
}

export function conditionTakeOff(): boolean {
    return (
        (getAutopilotVerticalMode() === VerticalMode.SRS && isEngineOnTakeOffThrust(1) && isEngineOnTakeOffThrust(2))
        || Math.abs(Simplane.getGroundSpeed()) > 90
    );
}
