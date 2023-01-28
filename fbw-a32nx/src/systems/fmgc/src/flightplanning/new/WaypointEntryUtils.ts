// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Waypoint } from 'msfs-navdata';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { WaypointFactory } from '@fmgc/flightplanning/new/waypoints/WaypointFactory';
import { runwayIdent } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';
import { DisplayInterface } from '@fmgc/flightplanning/new/interface/DisplayInterface';
import { Coordinates } from 'msfs-geo';
import { DataInterface } from '@fmgc/flightplanning/new/interface/DataInterface';
import { MagVar } from '@shared/MagVar';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';

export class WaypointEntryUtils {
    /**
     * Gets or creates a waypoint based on user input
     *
     * @param fms    the FMS
     * @param s      the user input string
     * @param stored whether a created waypoint is to be stored
     *
     * @returns a waypoint, or `undefined` if the operation is cancelled
     */
    static async getOrCreateWaypoint(fms: DataInterface & DisplayInterface, s, stored = true): Promise<Waypoint | undefined> {
        if (WaypointEntryUtils.isLatLonFormat(s)) {
            const coordinates = WaypointEntryUtils.parseLatLon(s);

            return fms.createLatLonWaypoint(coordinates, stored);
        } if (WaypointEntryUtils.isPbxFormat(s)) {
            const [place1, bearing1, place2, bearing2] = await this.parsePbx(fms, s);

            return fms.createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored);
        } if (WaypointEntryUtils.isPdFormat(s)) {
            throw new FmsError(FmsErrorType.NotYetImplemented);
        } else if (WaypointEntryUtils.isPbdFormat(s)) {
            const [wp, bearing, dist] = await WaypointEntryUtils.parsePbd(fms, s);

            return fms.createPlaceBearingDistWaypoint(wp, bearing, dist, stored);
        } else if (WaypointEntryUtils.isPlaceFormat(s)) {
            try {
                return await WaypointEntryUtils.parsePlace(fms, s);
            } catch (err) {
                if (err instanceof FmsError) {
                    fms.showFmsErrorMessage(err.type);

                    if (err.type === FmsErrorType.NotInDatabase) {
                        return fms.createNewWaypoint(s);
                    }
                }
            }
        } else {
            throw new FmsError(FmsErrorType.FormatError);
        }

        throw new FmsError(FmsErrorType.FormatError);
    }

    /**
     * Parse a place string into a position
     */
    static async parsePlace(fms: DisplayInterface, place: string): Promise<Waypoint> {
        if (WaypointEntryUtils.isRunwayFormat(place)) {
            return WaypointEntryUtils.parseRunway(place);
        }

        const items = await NavigationDatabaseService.activeDatabase.searchFix(place);

        if (items.length === 0) {
            throw new Error('NOT IN DATABASE');
        }

        const chosen = await fms.deduplicateFacilities(items);

        return chosen;
    }

    /**
     * Parse a runway string and return the location of the threshold
     * Returns undefined if invalid format or not in database
     */
    static async parseRunway(place: string): Promise<Waypoint> {
        const rwy = place.match(/^([A-Z]{4})([0-9]{2}[RCL]?)$/);

        if (rwy !== null) {
            const airport = await NavigationDatabaseService.activeDatabase.searchAirport(rwy[1]);
            const runways = await NavigationDatabaseService.activeDatabase.backendDatabase.getRunways(airport.ident);

            if (airport) {
                for (let i = 0; i < runways.length; i++) {
                    const runway = runways[i];

                    const actualIdent = runwayIdent(runway);
                    const requestedIdent = rwy[2];

                    if (actualIdent === requestedIdent) {
                        return WaypointFactory.fromAirportAndRunway(airport, runway);
                    }
                }
            }
        }

        throw new Error('NOT IN DATABASE');
    }

    /**
     * Parse a lat/lon string into a position
     *
     * @returns coordinates
     */
    static parseLatLon(place: string): Coordinates {
        const latlon = place.match(/^([NS])?([0-9]{2,4}\.[0-9])([NS])?\/([EW])?([0-9]{2,5}\.[0-9])([EW])?$/);

        if (latlon !== null) {
            const latB = (latlon[1] || '') + (latlon[3] || '');
            const lonB = (latlon[4] || '') + (latlon[6] || '');
            const latDigits = latlon[2].length === 4 ? 3 : 4;
            const latD = parseInt(latlon[2].substring(0, latlon[2].length - latDigits));
            const latM = parseFloat(latlon[2].substring(latlon[2].length - latDigits));
            const lonDigits = latlon[5].length === 4 ? 3 : 4;
            const lonD = parseInt(latlon[5].substring(0, latlon[5].length - lonDigits));
            const lonM = parseFloat(latlon[5].substring(latlon[5].length - lonDigits));

            if (latB.length !== 1 || lonB.length !== 1 || !Number.isFinite(latM) || !Number.isFinite(lonM)) {
                throw new Error('FORMAT ERROR');
            }

            if (latD > 90 || latM > 59.9 || lonD > 180 || lonM > 59.9) {
                throw new Error('ENTRY OUT OF RANGE');
            }

            const lat = (latD + latM / 60) * (latB === 'S' ? -1 : 1);
            const long = (lonD + lonM / 60) * (lonB === 'W' ? -1 : 1);

            return { lat, long };
        }

        throw new Error('FORMAT ERROR');
    }

    /**
     * Parse a place-bearing/place-bearing string
     *
     * @param fms the FMS
     * @param {string} str place-bearing/place-bearing
     *
     * @returns place and true bearing * 2
     */
    static async parsePbx(fms: DisplayInterface, str: string): Promise<[Waypoint, number, Waypoint, number]> {
        const pbx = str.match(/^([^\-/]+)-([0-9]{1,3})\/([^\-/]+)-([0-9]{1,3})$/);

        if (pbx === null) {
            throw new Error('FORMAT ERROR');
        }

        const brg1 = parseInt(pbx[2]);
        const brg2 = parseInt(pbx[4]);

        if (brg1 > 360 || brg2 > 360) {
            throw new Error('ENTRY OUT OF RANGE');
        }

        const place1 = await WaypointEntryUtils.parsePlace(fms, pbx[1]);
        const magVar1 = Facilities.getMagVar(place1.location.lat, place1.location.long);
        const place2 = await WaypointEntryUtils.parsePlace(fms, pbx[3]);
        const magVar2 = Facilities.getMagVar(place2.location.lat, place2.location.long);

        return [place1, MagVar.magneticToTrue(brg1, magVar1), place2, MagVar.magneticToTrue(brg2, magVar2)];
    }

    /**
     * Parse a place/bearing/distance string
     * @param fms the FMS
     * @param {string} s
     */
    static async parsePbd(fms: DataInterface & DisplayInterface, s: string): Promise<[wp: Waypoint, trueBearing: number, dist: number]> {
        const [place, brg, dist] = WaypointEntryUtils.splitPbd(s);

        if (brg > 360 || dist > 999.9) {
            throw new Error('ENTRY OUT OF RANGE');
        }

        if (WaypointEntryUtils.isPlaceFormat(place)) {
            const wp = await WaypointEntryUtils.parsePlace(fms, place);
            const magVar = Facilities.getMagVar(wp.location.lat, wp.location.long);

            return [wp, MagVar.magneticToTrue(brg, magVar), dist];
        }

        throw new Error('FORMAT ERROR');
    }

    /**
     * Split PBD format into components
     * @param {String} s PBD format string
     */
    private static splitPbd(s: string): [string, number, number] {
        const [place, brgStr, distStr] = s.split('/');

        const brg = parseInt(brgStr);
        const dist = parseFloat(distStr);

        return [place, brg, dist];
    }

    /**
     * Check if a place is the correct format
     *
     * @returns true if valid place format
     */
    private static isPlaceFormat(str: string) {
        return str.match(/^[A-Z0-9]{2,7}$/) !== null || WaypointEntryUtils.isRunwayFormat(str);
    }

    /**
     * Check if a place is the correct format for a runway
     *
     * @returns true if valid runway format
     */
    private static isRunwayFormat(str: string) {
        return str.match(/^([A-Z]{4})([0-9]{2}[RCL]?)$/) !== null;
    }

    /**
     * Check if a place is the correct format for a latitude/longitude
     *
     * @returns true if valid lat/lon format
     */
    private static isLatLonFormat(str: string) {
        return str.match(/^([NS])?([0-9]{2,4}\.[0-9])([NS])?\/([EW])?([0-9]{2,5}\.[0-9])([EW])?$/) !== null;
    }

    /**
     * Check if a string is a valid place-bearing/place-bearing format
     *
     * @returns true if valid place format
     */
    private static isPbxFormat(str: string) {
        const pbx = str.match(/^([^\-/]+)-([0-9]{1,3})\/([^\-/]+)-([0-9]{1,3})$/);

        return pbx !== null && this.isPlaceFormat(pbx[1]) && this.isPlaceFormat(pbx[3]);
    }

    /**
     * Check if string is in place/bearing/distance format
     * @param {String} s
     * @returns true if pbd
     */
    private static isPbdFormat(s) {
        const pbd = s.match(/^([^/]+)\/([0-9]{1,3})\/([0-9]{1,3}(\.[0-9])?)$/);

        return pbd !== null && this.isPlaceFormat(pbd[1]);
    }

    /**
     * Check if string is in place/distance format
     * @param s
     */
    private static isPdFormat(s) {
        const pd = s.match(/^([^/]+)\/([0-9]{1,3}(\.[0-9])?)$/);

        return pd !== null && this.isPlaceFormat(pd[1]);
    }
}
