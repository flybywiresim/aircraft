// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Fix, NdbNavaid, VhfNavaid, Waypoint } from '@flybywiresim/fbw-sdk';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { WaypointFactory } from '@fmgc/flightplanning/waypoints/WaypointFactory';
import { DisplayInterface } from '@fmgc/flightplanning/interface/DisplayInterface';
import { Coordinates } from 'msfs-geo';
import { DataInterface } from '@fmgc/flightplanning/interface/DataInterface';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';

export class WaypointEntryUtils {
  /**
   * Gets or creates a waypoint based on user input
   *
   * @param fms    the FMS
   * @param place  the user input string
   * @param stored whether a created waypoint is to be stored
   *
   * @returns a waypoint, or `undefined` if the operation is cancelled
   */
  static async getOrCreateWaypoint(
    fms: DataInterface & DisplayInterface,
    place: string,
    stored: boolean,
    ident?: string,
  ): Promise<Fix | undefined> {
    if (WaypointEntryUtils.isLatLonFormat(place)) {
      const coordinates = WaypointEntryUtils.parseLatLon(place);

      return fms.createLatLonWaypoint(coordinates, stored, ident).waypoint;
    }
    if (WaypointEntryUtils.isPbxFormat(place)) {
      const [place1, bearing1, place2, bearing2] = await this.parsePbx(fms, place);

      return fms.createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored, ident).waypoint;
    }
    if (WaypointEntryUtils.isPdFormat(place)) {
      throw new FmsError(FmsErrorType.NotYetImplemented);
    } else if (WaypointEntryUtils.isPbdFormat(place)) {
      const [wp, bearing, dist] = await WaypointEntryUtils.parsePbd(fms, place);

      return fms.createPlaceBearingDistWaypoint(wp, bearing, dist, stored, ident).waypoint;
    } else if (WaypointEntryUtils.isPlaceFormat(place)) {
      return WaypointEntryUtils.parsePlace(fms, place).then((fix) => fix ?? fms.createNewWaypoint(place));
    }

    throw new FmsError(FmsErrorType.FormatError);
  }

  /**
   * Parse a place string into a position
   */
  static async parsePlace(fms: DisplayInterface & DataInterface, place: string): Promise<Fix> {
    if (WaypointEntryUtils.isRunwayFormat(place)) {
      return WaypointEntryUtils.parseRunway(place);
    }

    const airport = await NavigationDatabaseService.activeDatabase.searchAirport(place);
    const waypoints = await NavigationDatabaseService.activeDatabase.searchWaypoint(place);
    const navaids = await NavigationDatabaseService.activeDatabase.searchAllNavaid(place);

    if (airport !== undefined) {
      waypoints.push(WaypointFactory.fromAirport(airport));
    }

    const storedWaypoints = fms.getStoredWaypointsByIdent(place).map((stored) => stored.waypoint);
    waypoints.push(...storedWaypoints);

    // Sometimes navaids also exist as waypoints/intersections in the navdata (when they live on airways)
    // In this case, we only want to return the actual VOR facility
    const items = WaypointEntryUtils.mergeNavaidsWithWaypoints(navaids, waypoints);

    return fms.deduplicateFacilities(items);
  }

  static mergeNavaidsWithWaypoints(navaids: (VhfNavaid | NdbNavaid)[], waypoints: Waypoint[]): Fix[] {
    const items: Fix[] = [...navaids];

    for (const wp of waypoints) {
      if (items.findIndex((item) => item.databaseId === wp.databaseId) === -1) {
        items.push(wp);
      }
    }

    return items;
  }

  /**
   * Parse a runway string and return the location of the threshold
   * Returns undefined if invalid format or not in database
   */
  static async parseRunway(place: string): Promise<Waypoint> {
    const rwy = place.match(/^([A-Z]{4})([0-9]{2}[RCL]?)$/);

    if (rwy !== null) {
      const airport = await NavigationDatabaseService.activeDatabase.searchAirport(rwy[1]);

      if (airport) {
        const runways = await NavigationDatabaseService.activeDatabase.backendDatabase.getRunways(airport.ident);

        for (let i = 0; i < runways.length; i++) {
          const runway = runways[i];

          if (runway.ident === place) {
            return WaypointFactory.fromRunway(runway);
          }
        }
      }
    }

    throw new FmsError(FmsErrorType.NotInDatabase);
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
        throw new FmsError(FmsErrorType.FormatError);
      }

      if (latD > 90 || latM > 59.9 || lonD > 180 || lonM > 59.9) {
        throw new FmsError(FmsErrorType.EntryOutOfRange);
      }

      const lat = (latD + latM / 60) * (latB === 'S' ? -1 : 1);
      const long = (lonD + lonM / 60) * (lonB === 'W' ? -1 : 1);

      return { lat, long };
    }

    throw new FmsError(FmsErrorType.FormatError);
  }

  /**
   * Parse a place-bearing/place-bearing string
   *
   * @param fms the FMS
   * @param {string} str place-bearing/place-bearing
   *
   * @returns place and magnetic bearing
   */
  static async parsePbx(fms: DisplayInterface & DataInterface, str: string): Promise<[Fix, number, Fix, number]> {
    const pbx = str.match(/^([^\-/]+)-([0-9]{1,3})\/([^\-/]+)-([0-9]{1,3})$/);

    if (pbx === null) {
      throw new FmsError(FmsErrorType.FormatError);
    }

    const brg1 = parseInt(pbx[2]);
    const brg2 = parseInt(pbx[4]);

    if (brg1 > 360 || brg2 > 360) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    }

    const place1 = await WaypointEntryUtils.parsePlace(fms, pbx[1]);
    const place2 = await WaypointEntryUtils.parsePlace(fms, pbx[3]);

    return [place1, brg1, place2, brg2];
  }

  /**
   * Parse a place/bearing/distance string
   * @param fms the FMS
   * @param {string} s
   */
  static async parsePbd(
    fms: DataInterface & DisplayInterface,
    s: string,
  ): Promise<[wp: Fix, trueBearing: number, dist: number]> {
    const [place, brg, dist] = WaypointEntryUtils.splitPbd(s);

    if (brg > 360 || dist > 999.9) {
      throw new FmsError(FmsErrorType.EntryOutOfRange);
    }

    if (WaypointEntryUtils.isPlaceFormat(place)) {
      const wp = await WaypointEntryUtils.parsePlace(fms, place);

      return [wp, brg, dist];
    }

    throw new FmsError(FmsErrorType.FormatError);
  }

  /**
   * Split PBD format into components
   * @param {String} s PBD format string
   */
  static splitPbd(s: string): [string, number, number] {
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
  static isPlaceFormat(str: string) {
    return str.match(/^[A-Z0-9]{2,7}$/) !== null || WaypointEntryUtils.isRunwayFormat(str);
  }

  /**
   * Check if a place is the correct format for a runway
   *
   * @returns true if valid runway format
   */
  static isRunwayFormat(str: string) {
    return str.match(/^([A-Z]{4})([0-9]{2}[RCL]?)$/) !== null;
  }

  /**
   * Check if a place is the correct format for a latitude/longitude
   *
   * @returns true if valid lat/lon format
   */
  static isLatLonFormat(str: string) {
    return str.match(/^([NS])?([0-9]{2,4}\.[0-9])([NS])?\/([EW])?([0-9]{2,5}\.[0-9])([EW])?$/) !== null;
  }

  /**
   * Check if a string is a valid place-bearing/place-bearing format
   *
   * @returns true if valid place format
   */
  static isPbxFormat(str: string) {
    const pbx = str.match(/^([^\-/]+)-([0-9]{1,3})\/([^\-/]+)-([0-9]{1,3})$/);

    return pbx !== null && this.isPlaceFormat(pbx[1]) && this.isPlaceFormat(pbx[3]);
  }

  /**
   * Check if string is in place/bearing/distance format
   * @param {String} s
   * @returns true if pbd
   */
  static isPbdFormat(s: string) {
    const pbd = s.match(/^([^/]+)\/([0-9]{1,3})\/([0-9]{1,3}(\.[0-9])?)$/);

    return pbd !== null && this.isPlaceFormat(pbd[1]);
  }

  /**
   * Check if string is in place/distance format
   * @param s
   */
  static isPdFormat(s: string) {
    // bad rule - regex is easier to read with explicit escape
    // eslint-disable-next-line no-useless-escape
    const pd = s.match(/^([^\/]+)\/([\-\+]?[0-9]{1,3}(\.[0-9])?)$/);

    return pd !== null && this.isPlaceFormat(pd[1]);
  }
}
