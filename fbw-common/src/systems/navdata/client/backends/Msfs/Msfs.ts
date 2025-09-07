// Copyright (c) 2021, 2022, 2024-2025 FlyByWire Simulations
// Copyright (c) Microsoft Corporation
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-await-in-loop */

import { Coordinates } from 'msfs-geo';
import {
  AirportCommunication,
  Airway,
  DatabaseIdent,
  Fix,
  IlsNavaid,
  iso8601CalendarDate,
  NdbNavaid,
  ProcedureLeg,
  VhfNavaid,
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
import { FacilityCache, LoadType } from './FacilityCache';
import { MsfsMapping } from './Mapping';
import { Gate } from '../../../shared/types/Gate';
import { NearbyFacilityType, NearbyFacilityMonitor } from '../../NearbyFacilityMonitor';
import { isMsfs2024 } from '../../../../shared/src/MsfsDetect';
import { Msfs2020NearbyFacilityMonitor, MsfsNearbyFacilityMonitor } from './MsfsNearbyFacilityMonitor';
import { ErrorLogger } from '../../../shared/types/ErrorLogger';

export class MsfsBackend implements DataInterface {
  private static readonly AIRPORT_LOAD_TIMEOUT = 15_000_000;

  /** Duration of an AIRAC cycle (28 days) in milliseconds. */
  public static readonly CYCLE_DURATION = 86400_000 * 28;

  private static readonly MSFS_DATE_RANGE_REGEX = /([A-Z]{3})(\d\d?)([A-Z]{3})(\d\d?)\/(\d\d)/;

  private static dateCache = new Date();

  private cache: FacilityCache;

  private mapping: MsfsMapping;

  constructor(private readonly logError: ErrorLogger) {
    this.cache = new FacilityCache(this.logError);
    this.mapping = new MsfsMapping(this.cache, this.logError);

    RegisterViewListener('JS_LISTENER_FACILITY', EmptyCallback.Void, true);
  }

  /** @inheritdoc */
  public async getDatabaseIdent(): Promise<DatabaseIdent> {
    const out = {
      provider: 'Msfs',
      airacCycle: '',
      effectiveFrom: '',
      effectiveTo: '',
    };

    // "APR21MAY18/22"
    const facilitiesDateRange = SimVar.GetGameVarValue('FLIGHT NAVDATA DATE RANGE', 'string');

    const match = facilitiesDateRange.match(MsfsBackend.MSFS_DATE_RANGE_REGEX);
    if (match === null) {
      this.logError(`[MsfsBackend]: Failed to parse facilitiesDateRange: ${facilitiesDateRange}`);
      return out;
    }

    const [, effMonth, effDay, expMonth, expDay, expYear] = match;

    const effDate = new Date(`${effMonth}-${effDay}-${expYear} UTC`);
    const expDate = new Date(`${expMonth}-${expDay}-${expYear} UTC`);

    // We need to work around a bug where the sim gives the year of the expiration date rather than the effective date.
    if (effDate.getTime() > expDate.getTime()) {
      effDate.setUTCFullYear(effDate.getUTCFullYear() - 1);
    }

    const effectiveTimestamp = effDate.getTime();
    MsfsBackend.dateCache.setTime(effectiveTimestamp);
    const expirationTimestamp = effectiveTimestamp + MsfsBackend.CYCLE_DURATION;
    const realExpDate = new Date(expirationTimestamp);
    const january1 = Date.UTC(MsfsBackend.dateCache.getUTCFullYear(), 0, 1);
    const january1Delta = effectiveTimestamp - january1;
    const cycle = Math.trunc(january1Delta / MsfsBackend.CYCLE_DURATION) + 1;

    out.airacCycle = `${(MsfsBackend.dateCache.getUTCFullYear() % 100).toString().padStart(2, '0')}${cycle.toString().padStart(2, '0')}`;
    // For reasons of brain death JS date month is 0-based while day is 1-based, so we add 1 to the month.
    out.effectiveFrom = iso8601CalendarDate(effDate.getUTCFullYear(), effDate.getUTCMonth() + 1, effDate.getUTCDate());
    out.effectiveTo = iso8601CalendarDate(
      realExpDate.getUTCFullYear(),
      realExpDate.getUTCMonth() + 1,
      realExpDate.getUTCDate(),
    );

    return out;
  }

  public createNearbyFacilityMonitor(type: NearbyFacilityType): NearbyFacilityMonitor {
    return isMsfs2024() ? new MsfsNearbyFacilityMonitor(type) : new Msfs2020NearbyFacilityMonitor(type);
  }

  /** @inheritdoc */
  public async getAirports(idents: string[]): Promise<Airport[]> {
    // firstly fetch all the facilities from the MSFS database
    const icaos = idents.map((ident) => `A      ${ident}`);

    const airports = await this.cache.getFacilities(icaos, LoadType.Airport, MsfsBackend.AIRPORT_LOAD_TIMEOUT);

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

  public async getHolds(airportIdentifier: string): Promise<ProcedureLeg[]> {
    const airport = await this.fetchMsfsAirport(airportIdentifier);

    if (!airport) {
      return [];
    }

    return this.mapping.mapHolds(airport);
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
  public async getLsMarkers(
    _airportIdentifier: string,
    _runwayIdentifier: string,
    _lsIdentifier: string,
  ): Promise<Marker[]> {
    return [];
  }

  /** @inheritdoc */
  public async getWaypoints(
    idents: string[],
    _ppos?: Coordinates,
    _icaoCode?: string,
    _airportIdent?: string,
  ): Promise<Waypoint[]> {
    const results = new Map<string, Waypoint>();

    for (const ident of idents) {
      (await this.cache.searchByIdent(ident, IcaoSearchFilter.Intersections, 100)).forEach((v) => {
        results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
      });
    }

    return [...results.values()];
  }

  /** @inheritdoc */
  public async getNdbNavaids(
    idents: string[],
    _ppos?: Coordinates,
    _icaoCode?: string,
    _airportIdent?: string,
  ): Promise<NdbNavaid[]> {
    const results = new Map<string, NdbNavaid>();

    for (const ident of idents) {
      (await this.cache.searchByIdent(ident, IcaoSearchFilter.Ndbs, 100)).forEach((v) => {
        results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
      });
    }

    return [...results.values()];
  }

  /** @inheritdoc */
  public async getVhfNavaids(
    idents: string[],
    _ppos?: Coordinates,
    _icaoCode?: string,
    _airportIdent?: string,
  ): Promise<VhfNavaid[]> {
    const results = new Map<string, VhfNavaid>();

    for (const ident of idents) {
      (await this.cache.searchByIdent(ident, IcaoSearchFilter.Vors, 100)).forEach((v) => {
        results.set(v.icao, this.mapping.mapFacilityToWaypoint(v));
      });
    }

    return [...results.values()];
  }

  /** @inheritdoc */
  public async getIlsNavaids(
    idents: string[],
    _ppos?: Coordinates,
    _icaoCode?: string,
    _airportIdent?: string,
  ): Promise<IlsNavaid[]> {
    const results = new Map<string, IlsNavaid>();

    for (const ident of idents) {
      await Promise.all(
        (await this.cache.searchByIdent(ident, IcaoSearchFilter.Vors, 100))
          .filter((v) => v.type === VorType.ILS)
          .map(async (v) => {
            const airportIcao = v.icao.slice(3, 7).trim();
            // I'm aware that we might be fetching the same airport multiple times for different VORs,
            // but there is a cache in place, so it should be fine
            const airport = await this.fetchMsfsAirport(airportIcao);
            if (airport) {
              results.set(v.icao, await this.mapping.mapVorIls(airport, v));
            }
          }),
      );
    }

    return [...results.values()];
  }

  /** @inheritdoc */
  public async getFixes(
    idents: string[],
    ppos?: Coordinates,
    icaoCode?: string,
    airportIdent?: string,
  ): Promise<Fix[]> {
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
  public async getAirwayByFix(ident: string, icaoCode: string, airwayIdent: string): Promise<Airway[]> {
    return this.mapping.getAirway(ident, icaoCode, airwayIdent);
  }

  public async getVhfNavaidFromId(databaseId: string): Promise<VhfNavaid> {
    const fac = await this.cache.getFacility(databaseId, LoadType.Vor);
    if (!fac) {
      throw new Error(`Could not fetch facility "${databaseId}"!`);
    }

    return this.mapping.mapFacilityToWaypoint(fac);
  }

  private async fetchMsfsAirport(ident: string): Promise<JS_FacilityAirport | undefined> {
    if (ident.trim().length !== 4) {
      return undefined;
    }

    const icao = `A      ${ident}`;

    return this.cache.getFacility(icao, LoadType.Airport, MsfsBackend.AIRPORT_LOAD_TIMEOUT);
  }
}
