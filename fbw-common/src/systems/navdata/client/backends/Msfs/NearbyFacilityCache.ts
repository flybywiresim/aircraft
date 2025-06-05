// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ResourceHeap } from '@microsoft/msfs-sdk';
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

interface PendingRequest {
  icao: string;
  icaoStruct?: JS_ICAO;
  requestors: ((fac: NearbyFacility | null) => void)[];
  remainingRetries: number;
}

/**
 * A shared cache for {@link NearbyFacility} instances.
 * We only request minimal facilities from MSFS where possible, so we don't use the main facility cache.
 */
export class NearbyFacilityCache {
  // we want to make sure this is bigger than the largest max result limit in use to avoid thrashing
  private static readonly MAX_CACHE_ENTRIES = 400;
  private static readonly RETRY_TIMEOUT_MS = 300;
  private static readonly RETRY_TIMEOUT_AIRPORT_MS = 15_000;
  private static readonly RETRY_COUNT = 1;

  private readonly pendingHeap = new ResourceHeap<PendingRequest>(
    () => ({ icao: '', requestors: [], remainingRetries: NearbyFacilityCache.RETRY_COUNT }),
    EmptyCallback.Void,
    (r) => (r.remainingRetries = NearbyFacilityCache.RETRY_COUNT),
    (r) => (r.requestors.length = 0),
  );

  private readonly facilities: NearbyFacility[] = [];
  private static userCount = 0;

  private readonly pendingRequests = new Map<string, PendingRequest>();

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

  private coherentFetch(icao: string, icaoStruct?: JS_ICAO): Promise<boolean> {
    switch (icao[0]) {
      case 'A':
        if (icaoStruct) {
          // MSFS2024 optimisation
          return Coherent.call('LOAD_AIRPORT_FROM_STRUCT', icaoStruct, JSAirportRequestFlags.Minimal);
        } else {
          return Coherent.call('LOAD_AIRPORT', icao);
        }
      case 'N':
        return Coherent.call('LOAD_NDB', icao);
      case 'V':
        return Coherent.call('LOAD_VOR', icao);
      case 'W':
        return Coherent.call('LOAD_INTERSECTION', icao);
      default:
        throw new Error(`Invalid ICAO type ${icao[0]}`);
    }
  }

  private async fetch(icao: string, icaoStruct?: JS_ICAO): Promise<NearbyFacility | null> {
    const request = this.pendingRequests.get(icao);
    if (request !== undefined) {
      return new Promise<NearbyFacility | null>((resolve) => {
        request.requestors.push(resolve);
      });
    }

    const success = await this.coherentFetch(icao, icaoStruct);
    if (!success) {
      return null;
    }

    return new Promise<NearbyFacility | null>((resolve) => {
      const request = this.pendingHeap.allocate();
      request.requestors.push(resolve);
      request.icao = icao;
      request.icaoStruct = icaoStruct;
      this.pendingRequests.set(icao, request);
      setTimeout(
        () => this.onRetryTimer(request),
        icao[0] === 'A' ? NearbyFacilityCache.RETRY_TIMEOUT_AIRPORT_MS : NearbyFacilityCache.RETRY_TIMEOUT_MS,
      );
    });
  }

  private onRetryTimer(request: PendingRequest): void {
    if (!this.pendingRequests.has(request.icao)) {
      // The facility was loaded
      return;
    }

    if (request.remainingRetries-- > 0) {
      this.coherentFetch(request.icao, request.icaoStruct);
      setTimeout(
        () => this.onRetryTimer(request),
        request.icao[0] === 'A' ? NearbyFacilityCache.RETRY_TIMEOUT_AIRPORT_MS : NearbyFacilityCache.RETRY_TIMEOUT_MS,
      );
    } else {
      this.pendingRequests.delete(request.icao);
      for (const resolve of request.requestors) {
        resolve(null);
      }
      this.pendingHeap.free(request);
    }
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
      // VOR intersections might get here due to other facility listener users requesting them
      return;
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

    const request = this.pendingRequests.get(fac.databaseId);
    if (!request) {
      return;
    }
    this.pendingRequests.delete(fac.databaseId);

    for (const resolve of request.requestors) {
      resolve(fac);
    }

    this.pendingHeap.free(request);
  }

  private addToCache(fac: NearbyFacility): void {
    this.facilities.push(fac);
    if (this.facilities.length > NearbyFacilityCache.MAX_CACHE_ENTRIES) {
      // drop the oldest cache entry... might not be the least recently accessed but probably not worth tracking that
      this.facilities.splice(0, 1);
    }
  }
}
