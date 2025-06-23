// Copyright (c) 2021, 2022, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */

import {
  IcaoSearchFilter,
  JS_Facility,
  JS_FacilityAirport,
  JS_FacilityIntersection,
  JS_FacilityNDB,
  JS_FacilityVOR,
  JS_Leg,
  JSAirportRequestFlags,
} from './FsTypes';
import { Waypoint } from '../../../shared';
import { isMsfs2024 } from '../../../../shared/src/MsfsDetect';
import { ErrorLogger } from '../../../shared/types/ErrorLogger';

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
export class FacilityCache {
  private static cacheSize = 1000;

  private listener; // TODO type

  private facilityCache = new Map<string, JS_Facility>();

  private airwayIcaoCache = new Map<string, Set<string>>();

  private airwayFixCache = new Map<string, Waypoint[]>();

  constructor(private readonly logError: ErrorLogger) {
    this.listener = RegisterViewListener('JS_LISTENER_FACILITY', EmptyCallback.Void, true);

    Coherent.on('SendAirport', this.receiveFacility.bind(this));
    Coherent.on('SendIntersection', this.receiveFacility.bind(this));
    Coherent.on('SendNdb', this.receiveFacility.bind(this));
    Coherent.on('SendVor', this.receiveFacility.bind(this));
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
      if (successfulIcaos.length !== toFetch.length) {
        const unsuccessfulIcaos = toFetch.filter((_, i) => !results[i]);
        this.logError(`[FacilityCache] Failed to fetch ${loadType}: ${unsuccessfulIcaos.join(', ')}`);
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
      this.logError(`[FacilityCache] Failed to fetch ${loadType}: ${icao}`);
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
      const oldestKey: string = this.facilityCache.keys().next().value!;
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

  private static readonly AIRPORT_REGION_REGEX = /^A[A-Z0-9]{2}/;
  private static readonly AIRPORT_REGION_REPLACE = 'A  ';

  /** Removes the region code from any airport ICAOs in an array of procedure legs. */
  private static fixupLegAirportRegions(legs: JS_Leg[]): void {
    for (const leg of legs) {
      leg.fixIcao = leg.fixIcao.replace(FacilityCache.AIRPORT_REGION_REGEX, FacilityCache.AIRPORT_REGION_REPLACE);
      leg.originIcao = leg.originIcao.replace(FacilityCache.AIRPORT_REGION_REGEX, FacilityCache.AIRPORT_REGION_REPLACE);
      leg.arcCenterFixIcao = leg.arcCenterFixIcao.replace(
        FacilityCache.AIRPORT_REGION_REGEX,
        FacilityCache.AIRPORT_REGION_REPLACE,
      );
    }
  }

  /**
   * Fix up airport ICAOs to a format that MSFS2020 can understand and load.
   * Note: this is **not** required for MSFS2024.
   * @param airport The airport facility to fix up.
   */
  private static fixupAirportRegions(airport: JS_FacilityAirport): void {
    for (const appr of airport.approaches) {
      for (const trans of appr.transitions) {
        FacilityCache.fixupLegAirportRegions(trans.legs);
      }
      FacilityCache.fixupLegAirportRegions(appr.finalLegs);
      FacilityCache.fixupLegAirportRegions(appr.missedLegs);
    }

    for (const sid of airport.departures) {
      for (const trans of sid.runwayTransitions) {
        FacilityCache.fixupLegAirportRegions(trans.legs);
      }
      FacilityCache.fixupLegAirportRegions(sid.commonLegs);
      for (const trans of sid.enRouteTransitions) {
        FacilityCache.fixupLegAirportRegions(trans.legs);
      }
    }

    for (const star of airport.arrivals) {
      for (const trans of star.enRouteTransitions) {
        FacilityCache.fixupLegAirportRegions(trans.legs);
      }
      FacilityCache.fixupLegAirportRegions(star.commonLegs);
      for (const trans of star.runwayTransitions) {
        FacilityCache.fixupLegAirportRegions(trans.legs);
      }
    }
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

    if (loadType === LoadType.Airport) {
      const dataFlags = (facility as JS_FacilityAirport).loadedDataFlags;
      if (dataFlags !== undefined && (dataFlags & JSAirportRequestFlags.All) !== JSAirportRequestFlags.All) {
        // ignore minimal airports
        return;
      }

      if (!isMsfs2024() && loadType === LoadType.Airport) {
        FacilityCache.fixupAirportRegions(facility as JS_FacilityAirport);
      }
    }

    const key = FacilityCache.key(facility.icao, loadType);
    this.insert(key, facility);
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
