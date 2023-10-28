// Copyright (c) 2021, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable camelcase */

import { Coordinates, NauticalMiles } from 'msfs-geo';
import {
    AirportCommunication,
    Airway,
    AirwayLevel,
    ControlledAirspace,
    DatabaseIdent,
    Fix,
    IlsNavaid,
    iso8601CalendarDate,
    NdbClass,
    NdbNavaid,
    ProcedureLeg,
    RestrictiveAirspace,
    VhfNavaid,
    VhfNavaidType,
    VorClass,
    Waypoint,
} from '../../../shared';
import { Airport } from '../../../shared/types/Airport';
import { Approach } from '../../../shared/types/Approach';
import { Arrival } from '../../../shared/types/Arrival';
import { Departure } from '../../../shared/types/Departure';
import { Runway, RunwaySurfaceType } from '../../../shared/types/Runway';
import { DataInterface } from '../../../shared/DataInterface';
import { Marker } from '../../../shared/types/Marker';
import { IcaoSearchFilter, JS_FacilityAirport } from './FsTypes';
import { FacilityCache, LoadType } from './FacilityCache';
import { MsfsMapping } from './Mapping';
import { Gate } from '../../../shared/types/Gate';

export class MsfsBackend implements DataInterface {
    private cache: FacilityCache;

    private mapping: MsfsMapping;

    constructor() {
        this.cache = new FacilityCache();
        this.mapping = new MsfsMapping(this.cache);
    }

    /** @inheritdoc */
    public async getDatabaseIdent(): Promise<DatabaseIdent> {
        // "APR21MAY18/22"
        const range = SimVar.GetGameVarValue('FLIGHT NAVDATA DATE RANGE', 'string');
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const fromMonth = months.indexOf(range.substring(0, 3)) + 1;
        const fromDay = parseInt(range.substring(3, 5));
        const toMonth = months.indexOf(range.substring(5, 8)) + 1;
        const toDay = parseInt(range.substring(8, 10));
        const fromYear = parseInt(range.substring(11, 13));

        let toYear = fromYear;
        if (fromMonth === 12 && toMonth < 12) {
            toYear++;
        }

        // the to date is supposed to overlap the next cycle
        const toDate = new Date(Date.UTC(toYear, toMonth - 1, toDay));
        toDate.setUTCDate(toDay + 1);

        return {
            provider: 'Msfs', // TODO navi or navblue
            airacCycle: '', // TODO
            effectiveFrom: iso8601CalendarDate(fromYear, fromMonth, fromDay),
            effectiveTo: iso8601CalendarDate(toDate.getUTCFullYear(), toDate.getUTCMonth() + 1, toDate.getUTCDate()),
        };
    }

    /** @inheritdoc */
    public async getAirports(idents: string[]): Promise<Airport[]> {
        // firstly fetch all the facilities from the MSFS database
        const icaos = idents.map((ident) => `A      ${ident}`);

        const airports = await this.cache.getFacilities(icaos, LoadType.Airport);

        return Array.from(airports.values()).map((airport) => this.mapping.mapAirport(airport));
    }

    /** @inheritdoc */
    public async getDepartures(airportIdentifier: string): Promise<Departure[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapDepartures(airport);
    }

    /** @inheritdoc */
    public async getArrivals(airportIdentifier: string): Promise<Arrival[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapArrivals(airport);
    }

    /** @inheritdoc */
    public async getApproaches(airportIdentifier: string): Promise<Approach[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapApproaches(airport);
    }

    public async getGates(airportIdentifier: string): Promise<Gate[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapGates(airport);
    }

    /** MSFS database does not contain enroute holds */
    public async getHolds(_airportIdentifier: string): Promise<ProcedureLeg[]> {
        return [];
    }

    /** @inheritdoc */
    public async getRunways(airportIdentifier: string): Promise<Runway[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapAirportRunways(airport);
    }

    /** @inheritdoc */
    public async getWaypointsAtAirport(airportIdentifier: string): Promise<Waypoint[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapAirportWaypoints(airport);
    }

    /** @inheritdoc */
    public async getNdbsAtAirport(airportIdentifier: string): Promise<NdbNavaid[]> {
        return [];
    }

    /** @inheritdoc */
    public async getIlsAtAirport(airportIdentifier: string): Promise<IlsNavaid[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapAirportIls(airport);
    }

    /** @inheritdoc */
    public async getCommunicationsAtAirport(airportIdentifier: string): Promise<AirportCommunication[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapAirportCommunications(airport);
    }

    /** not supported */
    public async getLsMarkers(airportIdentifier: string, runwayIdentifier: string, lsIdentifier: string): Promise<Marker[]> {
        return [];
    }

    /** @inheritdoc */
    public async getWaypoints(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<Waypoint[]> {
        const results = new Map<string, Waypoint>();

        for (const ident of idents) {
            (await this.cache.searchByIdent(ident, IcaoSearchFilter.Intersections, 100)).forEach((v) => {
                results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
            });
        }

        return [...results.values()];
    }

    /** @inheritdoc */
    public async getNdbNavaids(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<NdbNavaid[]> {
        const results = new Map<string, NdbNavaid>();

        for (const ident of idents) {
            (await this.cache.searchByIdent(ident, IcaoSearchFilter.Ndbs, 100)).forEach((v) => {
                results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
            });
        }

        return [...results.values()];
    }

    /** @inheritdoc */
    public async getVhfNavaids(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<VhfNavaid[]> {
        const results = new Map<string, VhfNavaid>();

        for (const ident of idents) {
            (await this.cache.searchByIdent(ident, IcaoSearchFilter.Vors, 100)).forEach((v) => {
                results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
            });
        }

        return [...results.values()];
    }

    /** @inheritdoc */
    public async getFixes(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<Fix[]> {
        return [
            ...(await this.getWaypoints(idents, ppos, icaoCode, airportIdent)),
            ...(await this.getNdbNavaids(idents, ppos, icaoCode, airportIdent)),
            ...(await this.getVhfNavaids(idents, ppos, icaoCode, airportIdent)),
        ];
    }

    /** not supported... maybe */
    public async getAirways(idents: string[]): Promise<Airway[]> {
        return [];
    }

    /** @inheritdoc */
    public async getAirwaysByFix(ident: string, icaoCode: string): Promise<Airway[]> {
        return this.mapping.getAirways(ident, icaoCode);
    }

    /** @inheritdoc */
    public async getNearbyAirports(center: Coordinates, range: NauticalMiles, limit?: number, longestRunwaySurfaces?: RunwaySurfaceType): Promise<Airport[]> {
        return [];
    }

    /** @inheritdoc */
    public async getNearbyAirways(center: Coordinates, range: NauticalMiles, limit?: number, levels?: AirwayLevel): Promise<Airway[]> {
        return [];
    }

    /** @inheritdoc */
    public async getNearbyVhfNavaids(centre: Coordinates, range: number, limit?: number, classes?: VorClass, types?: VhfNavaidType): Promise<VhfNavaid[]> {
        return [];
    }

    /** @inheritdoc */
    public async getNearbyNdbNavaids(center: Coordinates, range: NauticalMiles, limit?: number, classes?: NdbClass): Promise<NdbNavaid[]> {
        return [];
    }

    /** @inheritdoc */
    public async getNearbyWaypoints(center: Coordinates, range: NauticalMiles, limit?: number): Promise<Waypoint[]> {
        return [];
    }

    /** @inheritdoc */
    public async getNearbyFixes(center: Coordinates, range: NauticalMiles, limit?: number): Promise<Fix[]> {
        return [];
    }

    /** @inheritdoc */
    public async getControlledAirspaceInRange(center: Coordinates, range: NauticalMiles): Promise<ControlledAirspace[]> {
        return [];
    }

    /** @inheritdoc */
    public async getRestrictiveAirspaceInRange(center: Coordinates, range: NauticalMiles): Promise<RestrictiveAirspace[]> {
        return [];
    }

    private async fetchMsfsAirport(ident: string): Promise<JS_FacilityAirport | undefined> {
        if (ident.trim().length !== 4) {
            return undefined;
        }

        const icao = `A      ${ident}`;

        return this.cache.getFacility(icao, LoadType.Airport);
    }
}
