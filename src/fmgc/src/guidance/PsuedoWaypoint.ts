//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { NauticalMiles } from '../../../../typings';

export interface PseudoWaypoint {

    /**
     * The identifier of the PWP, like (T/C) or (DECEL)
     */
    ident: string,

    /**
     * The index of the leg the pseudo waypoint is on
     */
    alongLegIndex: number,

    /**
     * The distance from the termination of the leg at index {@link alongLegIndex} the PWP is on
     */
    distanceFromLegTermination: NauticalMiles,

    /**
     * A bitfield for the EFIS symbol associated with this PWP
     */
    efisSymbolFlag: number,

    /**
     * lla for the position of the EFIS symbol
     */
    efisSymbolLla: Coordinates,

    /**
     * Whether the pseudo waypoint is displayed on the MCDU
     */
    displayedOnMcdu: boolean,

    /**
     * Waypoint stats for the PWP
     */
    stats: WaypointStats,

}
