import { EventBus } from '../data/EventBus';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GeoPoint } from '../geo';
import { GeoKdTree, GeoKdTreeSearchFilter, GeoKdTreeSearchVisitor } from '../utils/datastructures';
import { Facility, FacilityType, ICAO } from './Facilities';

/**
 * Topics published by {@link FacilityRepository} on the event bus.
 */
export interface FacilityRepositoryEvents {
  /** A facility was changed. The suffix of the topic specifies the ICAO of the changed facility. */
  [facility_changed: `facility_changed_${string}`]: Facility;
}

enum FacilityRepositorySyncType {
  Add,
  Remove,
  DumpRequest,
  DumpResponse
}

/**
 * Data provided by a sync event.
 */
type FacilityRepositoryCacheSyncData = {
  /** The type of sync event. */
  type: FacilityRepositorySyncType;

  /** This event's facilities. */
  facs?: Facility[];
};

/** Facility types for which {@link FacilityRepository} supports spatial searches. */
export type SearchableFacilityTypes = FacilityType.USR;

/**
 * A repository of facilities.
 */
export class FacilityRepository {
  private static readonly SYNC_TOPIC = 'facilityrepo_sync';

  private static readonly treeKeyFunc = (fac: Facility, out: Float64Array): Float64Array => {
    return GeoPoint.sphericalToCartesian(fac, out);
  };

  private static INSTANCE: FacilityRepository | undefined;

  private readonly repos: Partial<Record<FacilityType, Map<string, Facility>>> = {};
  private readonly trees: Record<SearchableFacilityTypes, GeoKdTree<Facility>> = {
    [FacilityType.USR]: new GeoKdTree(FacilityRepository.treeKeyFunc)
  };

  private ignoreSync = false;

  /**
   * Constructor.
   * @param bus The event bus.
   */
  private constructor(private readonly bus: EventBus) {
    bus.getSubscriber<any>().on(FacilityRepository.SYNC_TOPIC).handle(this.onSyncEvent.bind(this));
    this.pubSyncEvent(FacilityRepositorySyncType.DumpRequest);
  }

  /**
   * Retrieves a facility from this repository.
   * @param icao The ICAO of the facility to retrieve.
   * @returns The requested user facility, or undefined if it was not found in this repository.
   */
  public get(icao: string): Facility | undefined {
    if (!ICAO.isFacility(icao)) {
      return undefined;
    }

    return this.repos[ICAO.getFacilityType(icao)]?.get(icao);
  }

  /**
   * Searches for facilities around a point. Only supported for USR facilities.
   * @param type The type of facility for which to search.
   * @param lat The latitude of the query point, in degrees.
   * @param lon The longitude of the query point, in degrees.
   * @param radius The radius of the search, in great-arc radians.
   * @param visitor A visitor function. This function will be called once per element found within the search radius.
   * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
   * immediately halt.
   * @throws Error if spatial searches are not supported for the specified facility type.
   */
  public search(type: SearchableFacilityTypes, lat: number, lon: number, radius: number, visitor: GeoKdTreeSearchVisitor<Facility>): void;
  /**
   * Searches for facilities around a point. Only supported for USR facilities.
   * @param type The type of facility for which to search.
   * @param lat The latitude of the query point, in degrees.
   * @param lon The longitude of the query point, in degrees.
   * @param radius The radius of the search, in great-arc radians.
   * @param maxResultCount The maximum number of search results to return.
   * @param out An array in which to store the search results.
   * @param filter A function to filter the search results.
   * @throws Error if spatial searches are not supported for the specified facility type.
   */
  public search(
    type: SearchableFacilityTypes,
    lat: number,
    lon: number,
    radius: number,
    maxResultCount: number,
    out: Facility[],
    filter?: GeoKdTreeSearchFilter<Facility>
  ): Facility[]
  // eslint-disable-next-line jsdoc/require-jsdoc
  public search(
    type: SearchableFacilityTypes,
    lat: number,
    lon: number,
    radius: number,
    arg5: GeoKdTreeSearchVisitor<Facility> | number,
    out?: Facility[],
    filter?: GeoKdTreeSearchFilter<Facility>
  ): void | Facility[] {
    if (type !== FacilityType.USR) {
      throw new Error(`FacilityRepository: spatial searches are not supported for facility type ${type}`);
    }

    if (typeof arg5 === 'number') {
      return this.trees[type].search(lat, lon, radius, arg5, out as Facility[], filter);
    } else {
      this.trees[type].search(lat, lon, radius, arg5);
    }
  }

  /**
   * Adds a facility to this repository and all other repositories synced with this one. If this repository already
   * contains a facility with the same ICAO as the facility to add, the existing facility will be replaced with the
   * new one.
   * @param fac The facility to add.
   * @throws Error if the facility has an invalid ICAO.
   */
  public add(fac: Facility): void {
    if (!ICAO.isFacility(fac.icao)) {
      throw new Error(`FacilityRepository: invalid facility ICAO ${fac.icao}`);
    }

    this.addToRepo(fac);
    this.pubSyncEvent(FacilityRepositorySyncType.Add, [fac]);
  }

  /**
   * Removes a facility from this repository and all other repositories synced with this one.
   * @param fac The facility to remove.
   * @throws Error if the facility has an invalid ICAO.
   */
  public remove(fac: Facility): void {
    if (!ICAO.isFacility(fac.icao)) {
      throw new Error(`FacilityRepository: invalid facility ICAO ${fac.icao}`);
    }

    this.removeFromRepo(fac);
    this.pubSyncEvent(FacilityRepositorySyncType.Remove, [fac]);
  }

  /**
   * Iterates over every facility in this respository with a visitor function.
   * @param fn A visitor function.
   * @param types The types of facilities over which to iterate. Defaults to all facility types.
   */
  public forEach(fn: (fac: Facility) => void, types?: FacilityType[]): void {
    const keys = types ?? Object.keys(this.repos);

    const len = keys.length;
    for (let i = 0; i < len; i++) {
      this.repos[keys[i] as FacilityType]?.forEach(fn);
    }
  }

  /**
   * Adds a facility to this repository.
   * @param fac The facility to add.
   */
  private addToRepo(fac: Facility): void {
    const facilityType = ICAO.getFacilityType(fac.icao);

    const repo = this.repos[facilityType] ??= new Map<string, Facility>();

    const existing = repo.get(fac.icao);

    repo.set(fac.icao, fac);

    if (facilityType === FacilityType.USR) {
      if (existing === undefined) {
        this.trees[facilityType].insert(fac);
      } else {
        this.trees[facilityType].removeAndInsert([existing], [fac]);
      }
    }

    if (existing !== undefined) {
      this.bus.pub(`facility_changed_${fac.icao}`, fac, false, false);
    }
  }

  /**
   * Removes a facility from this repository.
   * @param fac The facility to remove.
   */
  private removeFromRepo(fac: Facility): void {
    const facilityType = ICAO.getFacilityType(fac.icao);
    this.repos[ICAO.getFacilityType(fac.icao)]?.delete(fac.icao);

    if (facilityType !== FacilityType.USR) {
      return;
    }

    this.trees[facilityType].remove(fac);
  }

  /**
   * Publishes a sync event over the event bus.
   * @param type The type of sync event.
   * @param facs The event's user facilities.
   */
  private pubSyncEvent(type: FacilityRepositorySyncType, facs?: Facility[]): void {
    this.ignoreSync = true;
    this.bus.pub(FacilityRepository.SYNC_TOPIC, { type, facs }, true, false);
    this.ignoreSync = false;
  }

  /**
   * A callback which is called when a sync event occurs.
   * @param data The event data.
   */
  private onSyncEvent(data: FacilityRepositoryCacheSyncData): void {
    if (this.ignoreSync) {
      return;
    }

    switch (data.type) {
      case FacilityRepositorySyncType.Add:
      case FacilityRepositorySyncType.DumpResponse:
        data.facs!.forEach(fac => this.addToRepo(fac));
        break;
      case FacilityRepositorySyncType.Remove:
        data.facs!.forEach(fac => this.removeFromRepo(fac));
        break;
      case FacilityRepositorySyncType.DumpRequest:
        {
          const facs: Facility[] = [];
          this.forEach(fac => facs.push(fac));
          this.pubSyncEvent(FacilityRepositorySyncType.DumpResponse, facs);
        }
        break;
    }
  }

  /**
   * Gets an instance of FacilityRepository.
   * @param bus The event bus.
   * @returns an instance of FacilityRepository.
   */
  public static getRepository(bus: EventBus): FacilityRepository {
    return FacilityRepository.INSTANCE ??= new FacilityRepository(bus);
  }
}