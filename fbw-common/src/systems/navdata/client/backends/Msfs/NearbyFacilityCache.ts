// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NearbyFacility, NearbyFacilityType, NearbyVhfFacility } from '../../NearbyFacilityMonitor';
import {
  JS_FacilityAirport,
  JS_FacilityIntersection,
  JS_FacilityNDB,
  JS_FacilityVOR,
  JS_ICAO,
  JSAirportRequestFlags,
} from './FsTypes';
import { MsfsMapping } from './Mapping';

/**
 * A shared cache for {@link NearbyFacility} instances.
 * We only request minimal facilities from MSFS where possible, so we don't use the main facility cache.
 */
export class NearbyFacilityCache {
  // we want to make sure this is bigger than the largest max result limit in use to avoid thrashing
  private static readonly MAX_CACHE_ENTRIES = 400;

  private readonly facilities: NearbyFacility[] = [];
  private static userCount = 0;

  private readonly pendingRequests = new Map<string, ((fac: NearbyFacility | null) => void)[]>();

  private isInit = false;
  private readonly initRequests: (() => void)[] = [];

  private static _instance?: NearbyFacilityCache;

  private readonly coherentListeners: { clear: typeof EmptyCallback.Void }[] = [];

  public static create(): NearbyFacilityCache {
    NearbyFacilityCache.userCount++;
    if (!NearbyFacilityCache._instance) {
      NearbyFacilityCache._instance = new NearbyFacilityCache();
    }
    return NearbyFacilityCache._instance;
  }

  public destroy(): void {
    if (--NearbyFacilityCache.userCount < 1) {
      NearbyFacilityCache._instance = undefined;
      this.facilities.length = 0;
      for (const listener of this.coherentListeners) {
        listener.clear();
      }
    }
  }

  private constructor() {
    RegisterViewListener(
      'JS_LISTENER_FACILITY',
      () => {
        this.coherentListeners.push(Coherent.on('SendAirport', this.onReceiveAirport.bind(this)));
        this.coherentListeners.push(Coherent.on('SendIntersection', this.onReceiveFacility.bind(this)));
        this.coherentListeners.push(Coherent.on('SendNdb', this.onReceiveFacility.bind(this)));
        this.coherentListeners.push(Coherent.on('SendVor', this.onReceiveVor.bind(this)));

        this.isInit = true;
        for (const req of this.initRequests) {
          req();
        }
        this.initRequests.length = 0;
      },
      true,
    );
  }

  public awaitInit(): Promise<void> {
    if (this.isInit) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.initRequests.push(resolve));
  }

  /**
   * Gets a facility either from the cache, or from MSFS.
   * @param icao The legacy MSFS ICAO.
   * @param icaoStruct The MSFS ICAO struct if available (>=MSFS2024).
   * @returns The facility, or null if not available.
   */
  public async get(icao: string, icaoStruct?: JS_ICAO): Promise<NearbyFacility | null> {
    const cachedFac = this.facilities.find((fac) => fac.databaseId === icao);
    if (cachedFac) {
      return cachedFac;
    }

    return this.fetch(icao, icaoStruct);
  }

  private async fetch(icao: string, icaoStruct?: JS_ICAO): Promise<NearbyFacility | null> {
    let success = false;
    switch (icao[0]) {
      case 'A':
        if (icaoStruct) {
          // MSFS2024 optimisation
          success = await Coherent.call('LOAD_AIRPORT_FROM_STRUCT', icaoStruct, JSAirportRequestFlags.Minimal);
        } else {
          success = await Coherent.call('LOAD_AIRPORT', icao);
        }
        break;
      case 'N':
        success = await Coherent.call('LOAD_NDB', icao);
        break;
      case 'V':
        success = await Coherent.call('LOAD_VOR', icao);
        break;
      case 'W':
        success = await Coherent.call('LOAD_INTERSECTION', icao);
        break;
    }

    if (!success) {
      return null;
    }

    return new Promise<NearbyFacility | null>((resolve) => {
      (this.pendingRequests.get(icao) ?? this.pendingRequests.set(icao, []).get(icao)!).push(resolve);
    });
  }

  private static getNearbyTypeFromIcao(icao: string): NearbyFacilityType | undefined {
    switch (icao[0]) {
      case 'A':
        return NearbyFacilityType.Airport;
      case 'N':
        return NearbyFacilityType.NdbNavaid;
      case 'V':
        return NearbyFacilityType.VhfNavaid;
      case 'W':
        return NearbyFacilityType.Waypoint;
    }
  }

  private onReceiveFacility(msfsFac: JS_FacilityAirport | JS_FacilityIntersection | JS_FacilityNDB): void {
    const type = NearbyFacilityCache.getNearbyTypeFromIcao(msfsFac.icao);
    if (type === NearbyFacilityType.VhfNavaid || type === undefined) {
      throw new Error('VORs should never get here!');
    }

    if (this.pendingRequests.has(msfsFac.icao)) {
      const nearbyFac: NearbyFacility = {
        databaseId: msfsFac.icao,
        type,
        location:
          'altitude' in msfsFac
            ? { lat: msfsFac.lat, long: msfsFac.lon, alt: msfsFac.altitude / 0.3048 }
            : { lat: msfsFac.lat, long: msfsFac.lon },
        ident: msfsFac.icaoStruct ? msfsFac.icaoStruct.ident : msfsFac.icao.substring(7).trim(),
      };

      this.addNewFacility(nearbyFac);
    }
  }

  private onReceiveAirport(msfsFac: JS_FacilityAirport): void {
    // filter out non-navdata airports
    if (msfsFac.icaoStruct && msfsFac.icaoStruct.ident.length > 4) {
      return;
    }
    this.onReceiveFacility(msfsFac);
  }

  private onReceiveVor(vor: JS_FacilityVOR): void {
    const type = NearbyFacilityCache.getNearbyTypeFromIcao(vor.icao);
    if (type !== NearbyFacilityType.VhfNavaid) {
      throw new Error('Only VORs should ever get here');
    }

    if (this.pendingRequests.has(vor.icao)) {
      const fac: NearbyVhfFacility = {
        databaseId: vor.icao,
        type: NearbyFacilityType.VhfNavaid,
        location: vor.dme ? { lat: vor.dme.lat, long: vor.dme.lon, alt: vor.dme.alt } : { lat: vor.lat, long: vor.lon },
        ident: vor.icaoStruct ? vor.icaoStruct.ident : vor.icao.substring(7).trim(),
        vhfType: MsfsMapping.mapVorType(vor),
        vhfClass: MsfsMapping.mapVorClass(vor),
      };

      this.addNewFacility(fac);
    }
  }

  private addNewFacility(fac: NearbyFacility): void {
    this.addToCache(fac);

    const requests = this.pendingRequests.get(fac.databaseId);
    if (!requests) {
      return;
    }
    this.pendingRequests.delete(fac.databaseId);

    for (const req of requests) {
      req(fac);
    }
  }

  private addToCache(fac: NearbyFacility): void {
    this.facilities.push(fac);
    if (this.facilities.length > NearbyFacilityCache.MAX_CACHE_ENTRIES) {
      // drop the oldest cache entry... might not be the least recently accessed but probably not worth tracking that
      this.facilities.splice(0, 1);
    }
  }
}
