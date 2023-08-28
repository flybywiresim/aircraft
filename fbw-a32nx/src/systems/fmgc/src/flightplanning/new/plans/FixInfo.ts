// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdbNavaid, VhfNavaid, Waypoint } from 'msfs-navdata';

export interface FixInfoRadial {
    trueBearing: DegreesTrue,
    magneticBearing: DegreesMagnetic,
    time?: number,
    dtg?: number,
    alt?: number,
}

export interface FixInfoRadius {
    radius: NauticalMiles,
    time?: number,
    dtg?: number,
    alt?: number,
}

/**
 * A FIX INFO entry in a flight plan
 */
export interface FixInfoEntry {
    /** The fix concerned by the fix info */
    fix: Waypoint | VhfNavaid | NdbNavaid,

    /** The radii contained in the fix info */
    radii?: FixInfoRadius[],

    /** The radials contained in the fix ino */
    radials?: FixInfoRadial[],
}
