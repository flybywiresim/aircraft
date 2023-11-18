// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GlsNavaid, IlsNavaid, NdbNavaid, VhfNavaid, Waypoint } from 'msfs-navdata';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { NavigationDatabaseService } from '../../NavigationDatabaseService';

/**
 * Loads waypoints with a specified ident from the nav database, returning all matches
 */
export async function loadWaypoints(waypointIdent: string): Promise<Fix[]> {
    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    const waypoints = await db.getWaypoints([waypointIdent]);

    return waypoints;
}

/**
 * Loads a particular waypoint with a certain database ID from the nav database
 *
 * @throws if no results are found or none have the specified database ID
 */
export async function loadSingleWaypoint(waypointIdent: string, databaseId: string): Promise<Waypoint> {
    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    const waypoints = await db.getWaypoints([waypointIdent]);

    if (waypoints.length === 0) {
        throw new Error(`[FMS/FPM] Found no waypoints with ident '${waypointIdent}'`);
    }

    const matchingWaypoint = waypoints.find((waypoint) => waypoint.databaseId === databaseId);

    if (!matchingWaypoint) {
        throw new Error(`[FMS/FPM] None of the waypoints with ident '${waypointIdent}' had database id '${databaseId}'`);
    }

    return matchingWaypoint;
}

export type Fix = Waypoint | VhfNavaid | NdbNavaid | IlsNavaid | GlsNavaid

/**
 * Loads fixes (either a waypoint, VHF navaid, NDB, ILS or GLS) with a specified ident from the nav database, returning all matches
 */
export async function loadFixes(fixIDent: string): Promise<Fix[]> {
    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    const navaids = await db.getNavaids([fixIDent]);
    const ndbs = await db.getNDBs([fixIDent]);
    const waypoints = await db.getWaypoints([fixIDent]);

    return [...navaids, ...ndbs, ...waypoints];
}

/**
 * Loads a particular fix (either a waypoint, VHF navaid, NDB, ILS or GLS) with a certain database ID from the nav database
 *
 * @throws if no results are found or none have the specified database ID
 */
export async function loadSingleFix(fixIdent: string, databaseId: string): Promise<Fix> {
    const results = await loadFixes(fixIdent);

    if (results.length === 0) {
        throw new Error(`[FMS/FPM] Found no fixes with ident '${fixIdent}'`);
    }

    const matchingFix = results.find((fix) => fix.databaseId === databaseId);

    if (!matchingFix) {
        throw new Error(`[FMS/FPM] None of the fixes with ident '${fixIdent}' had database id '${databaseId}'`);
    }

    return matchingFix;
}
