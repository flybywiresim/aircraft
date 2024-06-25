// Copyright (c) 2021, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */

import {
  FacilitySearchType,
  NearestAirportSearchSession,
  NearestIntersectionSearchSession,
  NearestSearchResults,
  NearestSearchSession,
  NearestVorSearchSession,
} from '@microsoft/msfs-sdk';
import {
  IcaoSearchFilter,
  JS_Facility,
  JS_FacilityAirport,
  JS_FacilityIntersection,
  JS_FacilityNDB,
  JS_FacilityVOR,
} from './FsTypes';
import { Airport, NdbNavaid, VhfNavaid, Waypoint } from '../../../shared';

// @microsoft/msfs-sdk does not export this, so we declare it
declare class CoherentNearestSearchSession implements NearestSearchSession<string, string> {
  public searchNearest(
    lat: number,
    lon: number,
    radius: number,
    maxItems: number,
  ): Promise<NearestSearchResults<string, string>>;

  public onSearchCompleted(results: NearestSearchResults<string, string>): void;
}

export enum LoadType {
  Airport = 'A',
  Intersection = 'W',
  Ndb = 'N',
  Vor = 'V',
}

const LoadCall: Readonly<Record<LoadType, string>> = {
  [LoadType.Airport]: 'LOAD_AIRPORTS',
  [LoadType.Intersection]: 'LOAD_INTERSECTIONS',
  [LoadType.Ndb]: 'LOAD_NDBS',
  [LoadType.Vor]: 'LOAD_VORS',
};

type FacilityType<T> = T extends LoadType.Airport
  ? JS_FacilityAirport
  : T extends LoadType.Intersection
    ? JS_FacilityIntersection
    : T extends LoadType.Ndb
      ? JS_FacilityNDB
      : T extends LoadType.Vor
        ? JS_FacilityVOR
        : never;

export type SearchedFacilityTypeMap = {
  [IcaoSearchFilter.Airports]: never;
  [IcaoSearchFilter.Intersections]: JS_FacilityIntersection[];
  [IcaoSearchFilter.Ndbs]: JS_FacilityNDB[];
  [IcaoSearchFilter.Vors]: JS_FacilityVOR[];
  [IcaoSearchFilter.Vors]: JS_FacilityVOR[];
  [IcaoSearchFilter.None]: (JS_FacilityAirport | JS_FacilityIntersection | JS_FacilityNDB | JS_FacilityVOR)[];
};

export type SupportedFacilitySearchType =
  | FacilitySearchType.Airport
  | FacilitySearchType.Intersection
  | FacilitySearchType.Vor
  | FacilitySearchType.Ndb;

type FacilitySearchTypeToSessionClass = {
  [FacilitySearchType.Airport]: NearestAirportSearchSession;
  [FacilitySearchType.Intersection]: NearestIntersectionSearchSession;
  [FacilitySearchType.Vor]: NearestVorSearchSession;
  [FacilitySearchType.Ndb]: CoherentNearestSearchSession;
};

export type FacilitySearchTypeToDatabaseItem = {
  [FacilitySearchType.Airport]: Airport;
  [FacilitySearchType.Intersection]: Waypoint;
  [FacilitySearchType.Vor]: VhfNavaid;
  [FacilitySearchType.Ndb]: NdbNavaid;
};

export class FacilityCache {
  public static readonly FACILITY_SEARCH_TYPE_TO_SESSION_CLASS: Record<
    SupportedFacilitySearchType,
    new (sessionID: number) => CoherentNearestSearchSession
  > = {
    [FacilitySearchType.Airport]: NearestAirportSearchSession,
    [FacilitySearchType.Intersection]: NearestIntersectionSearchSession,
    [FacilitySearchType.Vor]: NearestVorSearchSession,
    [FacilitySearchType.Ndb]: NearestIntersectionSearchSession,
  };

  public static readonly FACILITY_SEARCH_TYPE_TO_LOAD_TYPE: Record<SupportedFacilitySearchType, LoadType> = {
    [FacilitySearchType.Airport]: LoadType.Airport,
    [FacilitySearchType.Intersection]: LoadType.Intersection,
    [FacilitySearchType.Vor]: LoadType.Vor,
    [FacilitySearchType.Ndb]: LoadType.Ndb,
  };

  private static cacheSize = 1000;

  private listener; // TODO type

  private searchSessions = new Map<number, NearestSearchSession<any, any>>([]);

  private facilityCache = new Map<string, JS_Facility>();

  private airwayIcaoCache = new Map<string, Set<string>>();

  private airwayFixCache = new Map<string, Waypoint[]>();

  constructor() {
    this.listener = RegisterViewListener('JS_LISTENER_FACILITY');

    Coherent.on('SendAirport', this.receiveFacility.bind(this));
    Coherent.on('SendIntersection', this.receiveFacility.bind(this));
    Coherent.on('SendNdb', this.receiveFacility.bind(this));
    Coherent.on('SendVor', this.receiveFacility.bind(this));
    Coherent.on('NearestSearchCompleted', this.receiveNearestSearchResults.bind(this));
  }

  public async startNearestSearchSession<T extends SupportedFacilitySearchType>(
    type: T,
  ): Promise<FacilitySearchTypeToSessionClass[T]> {
    return new Promise((resolve) => {
      Coherent.call('START_NEAREST_SEARCH_SESSION', type).then((sessionId: number) => {
        const _sessionClass = FacilityCache.FACILITY_SEARCH_TYPE_TO_SESSION_CLASS[type];
        const session = new _sessionClass(sessionId) as any;

        this.searchSessions.set(sessionId, session);
        resolve(session);
      });
    });
  }

  public async getFacilities<T extends LoadType>(
    icaos: readonly string[],
    loadType: T,
    timeout = 500,
  ): Promise<Map<string, FacilityType<T>>> {
    const toFetch = [];
    const fetched = new Map<string, FacilityType<T>>();

    for (const icao of icaos) {
      const key = FacilityCache.key(icao, loadType);
      const cached = this.facilityCache.get(key);
      if (cached) {
        fetched.set(icao, cached as any as FacilityType<T>);
      } else {
        toFetch.push(icao);
      }
    }

    // TODO break into batches of 100
    if (toFetch.length > 0) {
      const results: boolean[] = await Coherent.call(LoadCall[loadType], toFetch);
      const successfulIcaos = toFetch.filter((_, i) => results[i]);
      if (successfulIcaos.length === 0) {
        return fetched;
      }

      // there were at least some results...
      return new Promise((resolve) => {
        let elapsedTime = 0;
        const interval = setInterval(() => {
          elapsedTime += 50;

          let allSuccess = true;
          successfulIcaos.forEach((icao) => {
            const key = FacilityCache.key(icao, loadType);
            const facility = this.facilityCache.get(key) as any as FacilityType<T>;
            if (facility) {
              fetched.set(icao, facility);
            } else {
              allSuccess = false;
            }
          });

          if (allSuccess || elapsedTime >= timeout) {
            clearInterval(interval);
            resolve(fetched);
          }
        }, 50);
      });
    }

    return fetched;
  }

  public async getFacility<T extends LoadType>(
    icao: string,
    loadType: T,
    timeout = 500,
  ): Promise<FacilityType<T> | undefined> {
    const key = FacilityCache.key(icao, loadType);
    const cached = this.facilityCache.get(key);
    if (cached) {
      return cached as any as FacilityType<T>;
    }

    const result: boolean = await Coherent.call(LoadCall[loadType].slice(0, -1), icao);
    if (!result) {
      return undefined;
    }

    return new Promise((resolve) => {
      let elapsedTime = 0;
      const interval = setInterval(() => {
        elapsedTime += 50;

        const facility = this.facilityCache.get(key) as any as FacilityType<T>;
        if (facility) {
          clearInterval(interval);
          resolve(facility);
        }

        if (elapsedTime >= timeout) {
          clearInterval(interval);
          resolve(undefined);
        }
      }, 50);
    });
  }

  private insert(key: string, facility: JS_Facility): void {
    if (this.facilityCache.size > FacilityCache.cacheSize - 1) {
      const oldestKey: string = this.facilityCache.keys().next().value;
      this.facilityCache.delete(oldestKey);
    }
    this.facilityCache.set(key, facility);
  }

  static key(icao: string, loadType: LoadType): string {
    return `${loadType}${icao.trim()}`;
  }

  static ident(icao: string): string {
    return icao.substring(7).trim();
  }

  private receiveFacility(facility: JS_Facility): void {
    let loadType: LoadType;
    switch (facility.icao.charAt(0)) {
      case 'A':
        loadType = LoadType.Airport;
        break;
      case 'N':
        loadType = facility.__Type === 'JS_FacilityNDB' ? LoadType.Ndb : LoadType.Intersection;
        break;
      case 'V':
        loadType = facility.__Type === 'JS_FacilityVOR' ? LoadType.Vor : LoadType.Intersection;
        break;
      case 'W':
        loadType = LoadType.Intersection;
        break;
      default:
        console.error(`Unknown facility ${facility.icao} (${facility.__Type})`);
        return;
    }

    if (loadType === LoadType.Intersection) {
      this.addToAirwayCache(facility as any as JS_FacilityIntersection);
    }

    const key = FacilityCache.key(facility.icao, loadType);
    this.insert(key, facility);
  }

  private receiveNearestSearchResults(results: NearestSearchResults<any, any>): void {
    const session = this.searchSessions.get(results.sessionId);

    if (!session) {
      return;
    }

    (session as CoherentNearestSearchSession).onSearchCompleted(results);
  }

  static validFacilityIcao(icao: string, type?: 'A' | 'N' | 'V' | 'W'): boolean {
    switch (icao.charAt(0)) {
      case 'A':
      case 'N':
      case 'V':
      case 'W':
        return type === undefined || icao.charAt(0) === type;
      default:
        return false;
    }
  }

  public async searchByIdent<T extends IcaoSearchFilter>(
    ident: string,
    type: T,
    maxItems: number,
  ): Promise<SearchedFacilityTypeMap[T]> {
    if (type === IcaoSearchFilter.Airports) {
      throw new Error('Airport search not supported');
    }

    // we filter for equal idents, because the search returns everything starting with the given string
    const icaos = ((await Coherent.call('SEARCH_BY_IDENT', ident, type, maxItems)) as string[]).filter(
      (icao: string) => ident === icao.substring(7).trim() && icao.charAt(0) !== 'A',
    );

    if (type === IcaoSearchFilter.Intersections) {
      const intersections = (await this.getFacilities(icaos, LoadType.Intersection)).values();

      return [...intersections] as unknown as SearchedFacilityTypeMap[T];
    }

    if (type === IcaoSearchFilter.Ndbs) {
      const ndbs = (await this.getFacilities(icaos, LoadType.Ndb)).values();

      return [...ndbs] as unknown as SearchedFacilityTypeMap[T];
    }

    if (type === IcaoSearchFilter.Vors) {
      const vors = (await this.getFacilities(icaos, LoadType.Vor)).values();

      return [...vors] as unknown as SearchedFacilityTypeMap[T];
    }

    const ints = await this.getFacilities(
      icaos.filter((icao) => icao.charAt(0) === 'W'),
      LoadType.Intersection,
    );
    const ndbs = await this.getFacilities(
      icaos.filter((icao) => icao.charAt(0) === 'N'),
      LoadType.Ndb,
    );
    const vors = await this.getFacilities(
      icaos.filter((icao) => icao.charAt(0) === 'V'),
      LoadType.Vor,
    );

    return [...ints.values(), ...ndbs.values(), ...vors.values()] as unknown as SearchedFacilityTypeMap[T];
  }

  public getCachedAirwayFixes(databaseID: string): Waypoint[] | undefined {
    return this.airwayFixCache.get(databaseID);
  }

  public setCachedAirwayFixes(databaseID: string, fixes: Waypoint[]): void {
    this.airwayFixCache.set(databaseID, fixes);
  }

  private addToAirwayCache(facility: JS_FacilityIntersection): void {
    facility.routes.forEach((route) => {
      let cache = this.airwayIcaoCache.get(route.name);
      if (!cache) {
        cache = new Set();
        this.airwayIcaoCache.set(route.name, cache);
      }
      cache.add(facility.icao);
    });
  }
}
