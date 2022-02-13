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

export function isAnEngineOn(): boolean {
    return Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
}

export function isAllEngineOn(): boolean {
    return Simplane.getEngineActive(0) && Simplane.getEngineActive(1);
}
