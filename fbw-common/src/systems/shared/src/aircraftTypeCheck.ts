// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export enum AircraftType {
    A320_251N = 0,
    A380_842 = 1
}

/**
 * Determine the aircraft type using the Aircraft Title SimVar.
 * @returns {string} - the aircraft type (a32nx, a380x, other)
 */
export function getAircraftType(): string {
    const aircraftType :AircraftType = SimVar.GetSimVarValue('L:A32NX_AIRCRAFT_TYPE', 'enum');
    let aircraft: string;

    switch (aircraftType) {
    case AircraftType.A320_251N:
        aircraft = 'a32nx';
        break;
    case AircraftType.A380_842:
        aircraft = 'a380x';
        break;
    default:
        aircraft = 'other';
    }

    return aircraft;
}
