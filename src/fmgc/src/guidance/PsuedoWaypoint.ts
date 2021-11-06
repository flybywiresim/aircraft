//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { NauticalMiles } from '../../../../typings';

/**
 * Types that tie pseudo waypoints to sequencing actions
 */
export enum PseudoWaypointSequencingAction {

    /**
     * Used to trigger "DECELERATE / T/D REACHED" message on EFIS (depending on EIS version and standard) eg. (T/D)
     */
    TOD_REACHED,

    /**
     * Used for approach phase auto-engagement condition eg. (DECEL)
     */
    APPROACH_PHASE_AUTO_ENGAGE,

}

export interface PseudoWaypoint {

    /**
     * The identifier of the PWP, like (T/C) or (DECEL)
     */
    ident: string,

    /**
     * The sequencing type of the pseudo waypoint, if applicable. This is used to determine what to do when the pseudo
     * waypoints is sequenced.
     */
    sequencingType?: PseudoWaypointSequencingAction,

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
