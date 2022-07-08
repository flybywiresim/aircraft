//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';

export type RangeSetting = 10 | 20 | 40 | 80 | 160 | 320;
export const rangeSettings: RangeSetting[] = [10, 20, 40, 80, 160, 320];

export enum Mode {
    ROSE_ILS,
    ROSE_VOR,
    ROSE_NAV,
    ARC,
    PLAN,
}

export type EfisSide = 'L' | 'R'

export enum EfisOption {
    None = 0,
    Constraints = 1,
    VorDmes = 2,
    Waypoints = 3,
    Ndbs = 4,
    Airports = 5,
}

export enum NdSymbolTypeFlags {
    Vor = 1 << 0,
    VorDme = 1 << 1,
    Ndb = 1 << 2,
    Waypoint = 1 << 3,
    Airport = 1 << 4,
    Runway = 1 << 5,
    Tuned = 1 << 6,
    ActiveLegTermination = 1 << 7,
    EfisOption = 1 << 8,
    Dme = 1 << 9,
    ConstraintMet = 1 << 10,
    ConstraintMissed = 1 << 11,
    ConstraintUnknown = 1 << 12,
    SpeedChange = 1 << 13,
    FixInfo = 1 << 14,
    FlightPlan = 1 << 15,
    PwpDecel = 1 << 16,
    PwpTopOfDescent = 1 << 17,
    PwpCdaFlap1 = 1 << 18,
    PwpCdaFlap2 = 1 << 19,
    CourseReversalLeft = 1 << 20,
    CourseReversalRight = 1 << 21,
}

export interface BaseNdSymbol {
    databaseId: string,
    ident: string,
    location: Coordinates,
    type: NdSymbolTypeFlags,
    /** direction of runway or symbol, true degrees */
    direction?: number,
    /** runway length in metres */
    length?: number,
}

export interface NdSymbol extends BaseNdSymbol {
    constraints?: string[],
    // TODO factor these out into fix info symbol
    radials?: number[],
    radii?: number[],
}

export interface GeometryNdSymbol extends Omit<BaseNdSymbol, 'type'> {
    altConstraints?: [string, number][],
    speedConstraint?: number,
}

/**
 * Possible flight plan vector groups to be transmitted to the ND.
 *
 * **NOTE:** this does not necessarily represent the current function of a transmitted flight plan. Those groups are sometimes used for other purposes than their name
 * refers to, for example the DASHED flight plan being used to transmit the non-offset path of an active flight plan with an offset applied.
 */
export enum EfisVectorsGroup {
    /**
     * Solid green line
     */
    ACTIVE,

    /**
     * Dashed green line
     */
    DASHED,

    /**
     * Dashed green line
     */
    OFFSET,

    /**
     * Dashed yellow line
     */
    TEMPORARY,

    /**
     * Dimmed white line
     */
    SECONDARY,

    /**
     * Dashed dimmed white line
     */
    SECONDARY_DASHED,

    /**
     * Solid cyan line
     */
    MISSED,

    /**
     * Dashed cyan line
     */
    ALTERNATE,

    /**
     * Continuous yellow line
     */
    ACTIVE_EOSID,
}

export interface NdTraffic {
    alive?: boolean;
    ID: string;
    lat: number;
    lon: number;
    relativeAlt: number;
    bitfield: number;
    vertSpeed?: number;
    intrusionLevel?: number;
    posX?: number;
    posY?: number;
    // debug
    seen?: number;
    hidden?: boolean;
    raTau?: number;
    taTau?: number;
    vTau?: number;
    closureRate?: number;
    closureAccel?: number;
}
