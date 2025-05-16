// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '../../../../shared/src/MathUtils';
import {
  NearbyFacility,
  NearbyFacilityMonitor,
  NearbyFacilityMonitorAddedCallback,
  NearbyFacilityMonitorRemovedCallback,
  NearbyFacilityType,
} from '../../NearbyFacilityMonitor';
import {
  AirportClass,
  JS_ICAO,
  JSAirportRequestFlags,
  MsfsFacilityType,
  MsfsIntersectionType,
  MsfsNearestSearchLegacyResult,
  MsfsNearestSearchStructResult,
  RunwaySurface,
  VorClass,
  VorType,
} from './FsTypes';
import { NearbyFacilityCache } from './NearbyFacilityCache';

/** A nearby facility monitor for MSFS2024 and above. See {@link Msfs2020NearbyFacilityMonitor} for legacy support. */
export class MsfsNearbyFacilityMonitor implements NearbyFacilityMonitor {
  private static readonly UPDATE_INTERVAL_MS = 200;

  /**
   * Cache the nearby facility instances to avoid churn.
   * The cache is shared among instances to reduce memory and fetching cost.
   */
  protected readonly facilityCache = NearbyFacilityCache.create();

  protected readonly currentFacilities: NearbyFacility[] = [];

  protected readonly listeners: {
    added: NearbyFacilityMonitorAddedCallback;
    removed: NearbyFacilityMonitorRemovedCallback;
  }[] = [];

  protected lat?: number;
  protected lon?: number;
  protected needSearch = false;
  protected isInit = false;

  /** Search radius in metres. */
  protected radiusMetres = 250 * 1852;
  protected maxItems = 100;

  protected sessionId?: number;

  private updateInterval: ReturnType<typeof setInterval> | null;
  private searchCompletedListener: { clear: typeof EmptyCallback.Void };

  constructor(protected readonly facilityType: NearbyFacilityType) {
    this.facilityCache.awaitInit().then(() => {
      this.startSession().then((s) => {
        this.sessionId = s;
        this.setFilter();
        this.isInit = true;
      });
    });

    this.searchCompletedListener = this.hookEventListener();

    this.updateInterval = setInterval(this.onUpdate.bind(this), MsfsNearbyFacilityMonitor.UPDATE_INTERVAL_MS);
  }

  protected startSession(): Promise<number> {
    return Coherent.call(
      'START_NEAREST_SEARCH_SESSION_WITH_STRUCT',
      MsfsNearbyFacilityMonitor.mapFacilityType(this.facilityType),
    );
  }

  protected hookEventListener(): { clear: typeof EmptyCallback.Void } {
    return Coherent.on('NearestSearchCompletedWithStruct', this.onStructSearchCompleted.bind(this));
  }

  protected onStructSearchCompleted(result: MsfsNearestSearchStructResult): void {
    if (result.sessionId !== this.sessionId) {
      return;
    }

    for (const removed of result.removed) {
      const databaseId = MsfsNearbyFacilityMonitor.mapStructToDatabaseId(removed);
      this.onFacilityRemoved(databaseId);
    }

    for (const added of result.added) {
      const databaseId = MsfsNearbyFacilityMonitor.mapStructToDatabaseId(added);
      this.facilityCache.get(databaseId).then((fac) => {
        if (fac !== null) {
          this.onFacilityAdded(fac);
        } else {
          console.warn(`MsfsNearbyFacilityMonitor: Could not fetch facility with id '${databaseId}'`);
        }
      });
    }
  }

  protected loadFacility(icao: string, icaoStruct?: JS_ICAO): Promise<boolean> {
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
    }
    return Promise.resolve(false);
  }

  protected onFacilityRemoved(databaseId: string): void {
    for (const listener of this.listeners) {
      listener.removed(databaseId);
    }
    for (let i = this.currentFacilities.length - 1; i >= 0; i--) {
      if (this.currentFacilities[i].databaseId === databaseId) {
        this.currentFacilities.splice(i, 1);
        break;
      }
    }
  }

  protected onFacilityAdded(facility: NearbyFacility): void {
    this.currentFacilities.push(facility);
    for (const listener of this.listeners) {
      listener.added(facility);
    }
  }

  private setFilter(): void {
    switch (this.facilityType) {
      case NearbyFacilityType.Airport:
        Coherent.call(
          'SET_NEAREST_AIRPORT_FILTER',
          this.sessionId,
          0, // don't include closed
          (1 << AirportClass.HardSurfaceWithRunways) |
            (1 << AirportClass.Private) |
            (1 << AirportClass.SoftSurfaceWithRunways) |
            1,
        );
        Coherent.call(
          'SET_NEAREST_EXTENDED_AIRPORT_FILTERS',
          this.sessionId,
          (1 << RunwaySurface.Asphalt) |
            (1 << RunwaySurface.Bituminous) |
            (1 << RunwaySurface.Brick) |
            (1 << RunwaySurface.Concrete) |
            (1 << RunwaySurface.Ice) |
            (1 << RunwaySurface.Snow) |
            (1 << RunwaySurface.Tarmac), // the airport must have at least 1 runway of these types
          2147483647, // approach type, no filter
          3, // towered or untowered is fine
          1300, // minimum runway length in metres
        );
        break;
      case NearbyFacilityType.NdbNavaid:
        // no filtering possible
        break;
      case NearbyFacilityType.VhfNavaid:
        Coherent.call(
          'SET_NEAREST_VOR_FILTER',
          this.sessionId,
          (1 << VorClass.HighAltitude) | (1 << VorClass.LowAltitude) | (1 << VorClass.Terminal),
          (1 << VorType.DME) |
            (1 << VorType.TACAN) |
            (1 << VorType.VOR) |
            (1 << VorType.VORDME) |
            (1 << VorType.VORTAC),
        );
        break;
      case NearbyFacilityType.Waypoint:
        Coherent.call(
          'SET_NEAREST_INTERSECTION_FILTER',
          this.sessionId,
          (1 << MsfsIntersectionType.Named) |
            (1 << MsfsIntersectionType.Unnamed) |
            (1 << MsfsIntersectionType.Offroute) |
            (1 << MsfsIntersectionType.Iaf) |
            (1 << MsfsIntersectionType.Faf) |
            (1 << MsfsIntersectionType.Rnav),
          1, // include terminal waypoints
        );
        break;
    }
  }

  protected static mapFacilityType(facilityType: NearbyFacilityType): MsfsFacilityType {
    switch (facilityType) {
      case NearbyFacilityType.Airport:
        return MsfsFacilityType.Airport;
      case NearbyFacilityType.NdbNavaid:
        return MsfsFacilityType.Ndb;
      case NearbyFacilityType.VhfNavaid:
        return MsfsFacilityType.Vor;
      case NearbyFacilityType.Waypoint:
        return MsfsFacilityType.Intersection;
      default:
        throw new Error(`Invalid facility type: "${facilityType}"`);
    }
  }

  protected static mapStructToDatabaseId(icao: JS_ICAO): string {
    return `${icao.type.padEnd(1)}${icao.type === 'A' ? '  ' : icao.region.padEnd(2)}${icao.airport.slice(0, 4).padEnd(4)}${icao.ident.padEnd(5)}`;
  }

  private onUpdate(): void {
    if (this.isInit && this.needSearch && this.lat !== undefined && this.lon !== undefined) {
      this.needSearch = false;
      Coherent.call('SEARCH_NEAREST', this.sessionId, this.lat, this.lon, this.radiusMetres, this.maxItems);
    }
  }

  public setLocation(lat: number, lon: number): void {
    const needUpdate =
      this.lat === undefined ||
      this.lon === undefined ||
      Math.abs(MathUtils.normalise180(lat - this.lat)) > 0.01 ||
      Math.abs(MathUtils.normalise180(lon - this.lon)) > 0.01; // 0.01 deg is a little under 1 NM at the equator

    if (needUpdate) {
      this.needSearch = true;
      this.lat = lat;
      this.lon = lon;
    }
  }

  public setRadius(radiusNm: number): void {
    const radiusMetres = radiusNm * 1852;
    this.needSearch ||= this.radiusMetres !== radiusMetres;
    this.radiusMetres = radiusMetres;
  }

  public setMaxResults(maxItems: number): void {
    this.needSearch ||= this.maxItems !== maxItems;
    this.maxItems = maxItems;
  }

  public addListener(added: NearbyFacilityMonitorAddedCallback, removed: NearbyFacilityMonitorRemovedCallback): void {
    this.listeners.push({ added, removed });
  }

  public getCurrentFacilities(): Readonly<Readonly<NearbyFacility>[]> {
    return this.currentFacilities;
  }

  public destroy(): void {
    this.isInit = false;

    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;

      this.searchCompletedListener.clear();
      // Set filter down to minimal and do one last update to free as much FS mem as possible
      Coherent.call('SEARCH_NEAREST', this.sessionId, this.lat, this.lon, 0, 0);

      // free some refs for gc collection
      this.currentFacilities.length = 0;
      this.facilityCache.destroy();
    }
  }
}

export class Msfs2020NearbyFacilityMonitor extends MsfsNearbyFacilityMonitor {
  protected override startSession(): Promise<number> {
    return Coherent.call('START_NEAREST_SEARCH_SESSION', MsfsNearbyFacilityMonitor.mapFacilityType(this.facilityType));
  }

  protected override hookEventListener(): { clear: typeof EmptyCallback.Void } {
    return Coherent.on('NearestSearchCompleted', this.onLegacySearchCompleted.bind(this));
  }

  private onLegacySearchCompleted(result: MsfsNearestSearchLegacyResult): void {
    if (result.sessionId !== this.sessionId) {
      return;
    }

    for (const removed of result.removed) {
      this.onFacilityRemoved(removed);
    }

    for (const added of result.added) {
      this.facilityCache.get(added).then((fac) => {
        if (fac !== null) {
          this.onFacilityAdded(fac);
        } else {
          console.warn(`MsfsNearbyFacilityMonitor: Could not fetch facility with id '${added}'`);
        }
      });
    }
  }
}
