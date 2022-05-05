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

export function isOnGround(): boolean {
    return SimVar.GetSimVarValue('L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED', 'bool')
        || SimVar.GetSimVarValue('L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED', 'bool');
}

function isEngineOn(index: number): boolean {
    return SimVar.GetSimVarValue(`L:A32NX_ENGINE_N2:${index}`, 'number') > 20;
}

export function isAnEngineOn(): boolean {
    return isEngineOn(1) || isEngineOn(2);
}

export function isAllEngineOn(): boolean {
    return isEngineOn(1) && isEngineOn(2);
}
