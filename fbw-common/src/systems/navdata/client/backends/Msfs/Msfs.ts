// Copyright (c) 2021, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-await-in-loop */

import { Coordinates, NauticalMiles } from 'msfs-geo';
import {
    FacilitySearchType,
    NearestAirportSearchSession,
    NearestIntersectionSearchSession,
    NearestSearchResults,
    NearestSearchSession,
    NearestVorSearchSession,
    UnitType,
    Wait,
} from '@microsoft/msfs-sdk';
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
import { Runway } from '../../../shared/types/Runway';
import { DataInterface } from '../../../shared/DataInterface';
import { Marker } from '../../../shared/types/Marker';
import { IcaoSearchFilter, JS_FacilityAirport, VorType } from './FsTypes';
import {
    FacilityCache,
    FacilitySearchTypeToDatabaseItem,
    LoadType,
    SupportedFacilitySearchType,
} from './FacilityCache';
import { MsfsMapping } from './Mapping';
import { Gate } from '../../../shared/types/Gate';

// @microsoft/msfs-sdk does not export this, so we declare it
declare class CoherentNearestSearchSession implements NearestSearchSession<string, string> {
    public searchNearest(lat: number, lon: number, radius: number, maxItems: number): Promise<NearestSearchResults<string, string>>;

    public onSearchCompleted(results: NearestSearchResults<string, string>): void;
}

export class MsfsBackend implements DataInterface {
    private cache: FacilityCache;

    private mapping: MsfsMapping;

    private facilitySearchTypeToSearchSessionMap = new Map<SupportedFacilitySearchType, CoherentNearestSearchSession>([]);

    private facilitySearchTypeToCachedSearchResultsMap: { [k in SupportedFacilitySearchType]: FacilitySearchTypeToDatabaseItem[k][] } = {
        [FacilitySearchType.Airport]: [],
        [FacilitySearchType.Intersection]: [],
        [FacilitySearchType.Vor]: [],
        [FacilitySearchType.Ndb]: [],
    }

    private airportSearchSession: NearestAirportSearchSession | undefined;

    private waypointSearchSession: NearestIntersectionSearchSession | undefined;

    private vorSearchSession: NearestVorSearchSession | undefined;

    private ndbSearchSession: NearestSearchSession<string, string> | undefined;

    constructor() {
        this.cache = new FacilityCache();
        this.mapping = new MsfsMapping(this.cache);

        RegisterViewListener('JS_LISTENER_FACILITY', () => {
            this.cache.startNearestSearchSession(FacilitySearchType.Airport).then((session) => {
                this.airportSearchSession = session;
                this.facilitySearchTypeToSearchSessionMap.set(FacilitySearchType.Airport, session);
            });
            this.cache.startNearestSearchSession(FacilitySearchType.Intersection).then((session) => {
                this.waypointSearchSession = session;
                this.facilitySearchTypeToSearchSessionMap.set(FacilitySearchType.Intersection, session);
            });
            this.cache.startNearestSearchSession(FacilitySearchType.Vor).then((session) => {
                this.vorSearchSession = session;
                this.facilitySearchTypeToSearchSessionMap.set(FacilitySearchType.Vor, session);
            });
            this.cache.startNearestSearchSession(FacilitySearchType.Ndb).then((session) => {
                this.ndbSearchSession = session;
                this.facilitySearchTypeToSearchSessionMap.set(FacilitySearchType.Ndb, session);
            });
        });
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
    public async getNdbsAtAirport(_airportIdentifier: string): Promise<NdbNavaid[]> {
        return [];
    }

    /** @inheritdoc */
    public async getIlsAtAirport(airportIdentifier: string, ident?: string, lsIcaoCode?: string): Promise<IlsNavaid[]> {
        const airport = await this.fetchMsfsAirport(airportIdentifier);

        if (!airport) {
            return [];
        }

        return this.mapping.mapAirportIls(airport, ident, lsIcaoCode);
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
    public async getLsMarkers(_airportIdentifier: string, _runwayIdentifier: string, _lsIdentifier: string): Promise<Marker[]> {
        return [];
    }

    /** @inheritdoc */
    public async getWaypoints(idents: string[], _ppos?: Coordinates, _icaoCode?: string, _airportIdent?: string): Promise<Waypoint[]> {
        const results = new Map<string, Waypoint>();

        for (const ident of idents) {
            (await this.cache.searchByIdent(ident, IcaoSearchFilter.Intersections, 100)).forEach((v) => {
                results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
            });
        }

        return [...results.values()];
    }

    /** @inheritdoc */
    public async getNdbNavaids(idents: string[], _ppos?: Coordinates, _icaoCode?: string, _airportIdent?: string): Promise<NdbNavaid[]> {
        const results = new Map<string, NdbNavaid>();

        for (const ident of idents) {
            (await this.cache.searchByIdent(ident, IcaoSearchFilter.Ndbs, 100)).forEach((v) => {
                results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
            });
        }

        return [...results.values()];
    }

    /** @inheritdoc */
    public async getVhfNavaids(idents: string[], _ppos?: Coordinates, _icaoCode?: string, _airportIdent?: string): Promise<VhfNavaid[]> {
        const results = new Map<string, VhfNavaid>();

        for (const ident of idents) {
            (await this.cache.searchByIdent(ident, IcaoSearchFilter.Vors, 100)).forEach((v) => {
                results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
            });
        }

        return [...results.values()];
    }

    /** @inheritdoc */
    public async getIlsNavaids(idents: string[], _ppos?: Coordinates, _icaoCode?: string, _airportIdent?: string): Promise<IlsNavaid[]> {
        const results = new Map<string, IlsNavaid>();

        for (const ident of idents) {
            await Promise.all((await this.cache.searchByIdent(ident, IcaoSearchFilter.Vors, 100))
                .filter((v) => v.type === VorType.ILS)
                .map(async (v) => {
                    const airportIcao = v.icao.slice(3, 7).trim();
                    // I'm aware that we might be fetching the same airport multiple times for different VORs,
                    // but there is a cache in place, so it should be fine
                    const airport = await this.fetchMsfsAirport(airportIcao);
                    if (airport) {
                        results.set(v.icao, await this.mapping.mapVorIls(airport, v));
                    }
                }));
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
    public async getAirways(_idents: string[]): Promise<Airway[]> {
        return [];
    }

    /** @inheritdoc */
    public async getAirwaysByFix(ident: string, icaoCode: string, airwayIdent?: string): Promise<Airway[]> {
        return this.mapping.getAirways(ident, icaoCode, airwayIdent);
    }

    private async searchForFacilities<T extends SupportedFacilitySearchType>(
        type: T,
        center: Coordinates,
        range: NauticalMiles,
        limit?: number,
    ): Promise<readonly (FacilitySearchTypeToDatabaseItem[T])[]> {
        const nearbyFacilities = await this.facilitySearchTypeToSearchSessionMap.get(type)!.searchNearest(
            center.lat,
            center.long,
            UnitType.METER.convertFrom(range, UnitType.NMILE),
            limit ?? Number.MAX_SAFE_INTEGER,
        );

        // Update our results
        const addedFacilities = await this.cache.getFacilities(nearbyFacilities.added, FacilityCache.FACILITY_SEARCH_TYPE_TO_LOAD_TYPE[type]);

        for (const facility of addedFacilities.values()) {
            let dbItem: FacilitySearchTypeToDatabaseItem[T];
            // eslint-disable-next-line no-underscore-dangle
            if (facility.__Type === 'JS_FacilityAirport') {
                dbItem = this.mapping.mapAirport(facility) as FacilitySearchTypeToDatabaseItem[T];
            } else {
                dbItem = this.mapping.mapFacilityToWaypoint(facility) as any;
            }

            this.facilitySearchTypeToCachedSearchResultsMap[type].push(dbItem);
        }

        for (let i = 0; i < this.facilitySearchTypeToCachedSearchResultsMap[type].length; i++) {
            const dbItem = this.facilitySearchTypeToCachedSearchResultsMap[type][i];

            if (nearbyFacilities.removed.includes(dbItem.databaseId)) {
                this.facilitySearchTypeToCachedSearchResultsMap[type].splice(i, 1);
                i--;
            }
        }

        return this.facilitySearchTypeToCachedSearchResultsMap[type];
    }

    /** @inheritdoc */
    public async getNearbyAirports(center: Coordinates, range: NauticalMiles, limit?: number, longestRunwaySurfaces?: number, longestRunwayLength?: number): Promise<readonly Airport[]> {
        await Wait.awaitCondition(() => this.airportSearchSession !== undefined);

        const surface = longestRunwaySurfaces !== undefined
            ? this.mapping.mapRunwaySurfaceMsfsAirportClassBitmask(longestRunwaySurfaces)
            : NearestAirportSearchSession.Defaults.SurfaceTypeMask;

        this.airportSearchSession!.setAirportFilter(
            NearestAirportSearchSession.Defaults.ShowClosed,
            surface, // This filters by `AirportClass`
        );
        this.airportSearchSession!.setExtendedAirportFilters(
            NearestAirportSearchSession.Defaults.SurfaceTypeMask, // I believe this filters by MSFS' `RunwaySurfaceType`
            NearestAirportSearchSession.Defaults.ApproachTypeMask,
            NearestAirportSearchSession.Defaults.ToweredMask,
            longestRunwayLength ?? NearestAirportSearchSession.Defaults.MinimumRunwayLength,
        );

        return this.searchForFacilities(FacilitySearchType.Airport, center, range, limit);
    }

    /** @inheritdoc */
    public async getNearbyAirways(_center: Coordinates, _range: NauticalMiles, _limit?: number, _levels?: AirwayLevel): Promise<readonly Airway[]> {
        return [];
    }

    /** @inheritdoc */
    public async getNearbyVhfNavaids(center: Coordinates, range: number, limit?: number, _classes?: VorClass, _types?: VhfNavaidType): Promise<readonly VhfNavaid[]> {
        await Wait.awaitCondition(() => this.vorSearchSession !== undefined);

        // TODO take care of classes, types

        return this.searchForFacilities(FacilitySearchType.Vor, center, range, limit);
    }

    /** @inheritdoc */
    public async getNearbyNdbNavaids(center: Coordinates, range: NauticalMiles, limit?: number, _classes?: NdbClass): Promise<readonly NdbNavaid[]> {
        await Wait.awaitCondition(() => this.ndbSearchSession !== undefined);

        // TODO take care of classes

        return this.searchForFacilities(FacilitySearchType.Ndb, center, range, limit);
    }

    /** @inheritdoc */
    public async getNearbyWaypoints(center: Coordinates, range: NauticalMiles, limit?: number): Promise<readonly Waypoint[]> {
        await Wait.awaitCondition(() => this.waypointSearchSession !== undefined);

        return this.searchForFacilities(FacilitySearchType.Intersection, center, range, limit);
    }

    /** @inheritdoc */
    public async getNearbyFixes(center: Coordinates, range: NauticalMiles, _limit?: number): Promise<readonly Fix[]> {
        const [waypoints, vors, ndbs] = await Promise.all([
            this.getNearbyWaypoints(center, range),
            this.getNearbyVhfNavaids(center, range),
            this.getNearbyNdbNavaids(center, range),
        ]);

        const res = [...waypoints, ...vors, ...ndbs];

        return res;
    }

    /** @inheritdoc */
    public async getControlledAirspaceInRange(_center: Coordinates, _range: NauticalMiles): Promise<readonly ControlledAirspace[]> {
        return [];
    }

    /** @inheritdoc */
    public async getRestrictiveAirspaceInRange(_center: Coordinates, _range: NauticalMiles): Promise<readonly RestrictiveAirspace[]> {
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
