/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EventBus } from '../data/EventBus';
import { Facility, FacilityType, ICAO } from './Facilities';

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

/**
 * A repository of facilities.
 */
export class FacilityRespository {
  private static readonly SYNC_TOPIC = 'facilityrepo_sync';

  private static INSTANCE: FacilityRespository | undefined;

  private readonly repos: Partial<Record<FacilityType, Map<string, Facility>>> = {};

  private ignoreSync = false;

  /**
   * Constructor.
   * @param bus The event bus.
   */
  private constructor(private readonly bus: EventBus) {
    bus.getSubscriber<any>().on(FacilityRespository.SYNC_TOPIC).handle(this.onSyncEvent.bind(this));
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
   * Adds a facility to this repository and all other repositories synced with this one.
   * @param fac The facility to add.
   */
  public add(fac: Facility): void {
    if (!ICAO.isFacility(fac.icao)) {
      return;
    }

    this.addToRepo(fac);
    this.pubSyncEvent(FacilityRepositorySyncType.Add, [fac]);
  }

  /**
   * Removes a facility from this repository and all other repositories synced with this one.
   * @param fac The facility to remove.
   */
  public remove(fac: Facility): void {
    if (!ICAO.isFacility(fac.icao)) {
      return;
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
    (this.repos[ICAO.getFacilityType(fac.icao)] ??= new Map<string, Facility>()).set(fac.icao, fac);
  }

  /**
   * Removes a facility from this repository.
   * @param fac The facility to remove.
   */
  private removeFromRepo(fac: Facility): void {
    this.repos[ICAO.getFacilityType(fac.icao)]?.delete(fac.icao);
  }

  /**
   * Publishes a sync event over the event bus.
   * @param type The type of sync event.
   * @param facs The event's user facilities.
   */
  private pubSyncEvent(type: FacilityRepositorySyncType, facs?: Facility[]): void {
    this.ignoreSync = true;
    this.bus.pub(FacilityRespository.SYNC_TOPIC, { type, facs }, true, false);
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
   * Gets an instance of FacilityRespository.
   * @param bus The event bus.
   * @returns an instance of FacilityRespository.
   */
  public static getRepository(bus: EventBus): FacilityRespository {
    return FacilityRespository.INSTANCE ??= new FacilityRespository(bus);
  }
}