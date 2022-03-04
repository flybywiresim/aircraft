
import { NearestIntersectionSearchSession } from '.';
import { SubscribableArray, SubscribableArrayEventType } from '../utils/Subscribable';
import { AirportFacility, Facility, FacilitySearchType, FacilityType, IntersectionFacility, NdbFacility, NearestSearchResults, VorFacility } from './Facilities';
import { FacilityLoader, NearestAirportSearchSession, NearestSearchSession } from './FacilityLoader';

/**
 * A type map of search type to concrete facility loader query type.
 */
const facilitySearchTypeMap = new Map([
  [FacilitySearchType.Airport, FacilityType.Airport],
  [FacilitySearchType.Intersection, FacilityType.Intersection],
  [FacilitySearchType.Vor, FacilityType.VOR],
  [FacilitySearchType.Ndb, FacilityType.NDB],
  [FacilitySearchType.User, FacilityType.USR]
]);

/**
 * A class for tracking a nearest facility session and making it available as a
 * subscribable array of facilities.
 */
export abstract class NearestSubscription<T extends Facility, TAdded, TRemoved> implements SubscribableArray<T> {

  protected readonly facilities: T[] = [];
  protected readonly facilityIndex: Map<TRemoved, T> = new Map<TRemoved, T>();
  private readonly subscriptions: ((index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void)[] = [];

  protected session: NearestSearchSession<TAdded, TRemoved> | undefined;
  private pos = new LatLongAlt();
  private searchInProgress = false;

  /**
   * Creates an instance of a NearestSubscription.
   * @param facilityLoader An instance of the facility loader to search with.
   * @param type The type of facility to search for.
   */
  constructor(protected readonly facilityLoader: FacilityLoader, protected readonly type: FacilitySearchType) { }

  /** @inheritdoc */
  public get length(): number {
    return this.facilities.length;
  }

  /**
   * Whether or not this subscription has been started.
   * @returns True if started, false otherwise.
   */
  public get started(): boolean {
    return this.session !== undefined;
  }

  /** @inheritdoc */
  public get(index: number): T {
    const facility = this.facilities[index];
    if (facility === undefined) {
      throw new Error(`Facility at index ${index} could not be found.`);
    }

    return facility;
  }

  /** @inheritdoc */
  public tryGet(index: number): T | undefined {
    return this.facilities[index];
  }

  /** @inheritdoc */
  public getArray(): readonly T[] {
    return this.facilities;
  }

  /** @inheritdoc */
  public sub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void, initialNotify?: boolean): void {
    this.subscriptions.push(fn);
    if (initialNotify) {
      fn(0, SubscribableArrayEventType.Added, this.facilities, this.facilities);
    }
  }

  /** @inheritdoc */
  public unsub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void): void {
    const subIndex = this.subscriptions.indexOf(fn);
    if (subIndex >= 0) {
      this.subscriptions.splice(subIndex, 1);
    }
  }

  /**
   * Starts the search subscription.
   */
  public async start(): Promise<void> {
    if (this.session === undefined) {
      this.session = await this.facilityLoader.startNearestSearchSession(this.type) as NearestSearchSession<TAdded, TRemoved>;
    }
  }

  /**
   * Updates the nearest search subscription.
   * @param lat The latitude of the current search position.
   * @param lon The longitude of the current search position.
   * @param radius The radius of the search, in meters.
   * @param maxItems The maximum number of items to return in the search.
   */
  public async update(lat: number, lon: number, radius: number, maxItems: number): Promise<void> {
    if (this.searchInProgress) {
      return;
    }

    this.searchInProgress = true;
    this.pos.lat = lat;
    this.pos.long = lon;

    if (this.session === undefined) {
      this.session = await this.facilityLoader.startNearestSearchSession(this.type) as NearestSearchSession<TAdded, TRemoved>;
    }

    const results = await this.session.searchNearest(lat, lon, radius, maxItems);
    await this.onResults(results);

    this.searchInProgress = false;
  }

  /**
   * A callback called when results are received.
   * @param results The results that were received.
   */
  protected abstract onResults(results: NearestSearchResults<TAdded, TRemoved>): Promise<void>;

  /**
   * Adds a facility to the collection.
   * @param facility The facility to add.
   * @param key The key to track this facility by.
   */
  protected addFacility(facility: T, key: TRemoved): void {
    if (this.facilityIndex.has(key)) {
      console.warn(`Facility ${key} is already in the collection.`);
    }

    this.facilities.push(facility);
    this.facilityIndex.set(key, facility);

    for (let i = 0; i < this.subscriptions.length; i++) {
      const sub = this.subscriptions[i];
      sub(this.facilities.length - 1, SubscribableArrayEventType.Added, facility, this.facilities);
    }
  }

  /**
   * Removes a facility from the collection.
   * @param key The key of the facility to remove.
   */
  protected removeFacility(key: TRemoved): void {
    const facility = this.facilityIndex.get(key);

    if (facility !== undefined) {
      const index = this.facilities.indexOf(facility);
      this.facilities.splice(index, 1);
      this.facilityIndex.delete(key);

      for (let i = 0; i < this.subscriptions.length; i++) {
        const sub = this.subscriptions[i];
        sub(this.facilities.length - 1, SubscribableArrayEventType.Removed, facility, this.facilities);
      }
    }
  }
}

/**
 * A nearest search subscription for waypoint facilites.
 */
abstract class NearestWaypointSubscription<T extends Facility> extends NearestSubscription<T, string, string> {
  /** @inheritdoc */
  protected async onResults(results: NearestSearchResults<string, string>): Promise<void> {
    const facilityType = facilitySearchTypeMap.get(this.type);
    if (facilityType !== undefined) {
      const added = await Promise.all(results.added.map(icao => this.facilityLoader.getFacility(facilityType, icao)));
      for (let i = 0; i < added.length; i++) {
        this.addFacility(added[i] as unknown as T, added[i].icao);
      }

      for (let i = 0; i < results.removed.length; i++) {
        this.removeFacility(results.removed[i]);
      }
    }
  }
}

/**
 * A nearest search subscription for airport facilites.
 */
export class NearestAirportSubscription extends NearestWaypointSubscription<AirportFacility> {
  /**
   * Creates a new NearestAirportSubscription.
   * @param facilityLoader The facility loader to use with this instance.
   */
  constructor(facilityLoader: FacilityLoader) {
    super(facilityLoader, FacilitySearchType.Airport);
  }

  /**
   * Sets the airport search filter.
   * @param showClosed Whether or not to return closed airports in the search.
   * @param classMask A bitmask representing the classes of airports to show.
   */
  public setFilter(showClosed: boolean, classMask: number): void {
    if (this.session !== undefined) {
      (this.session as NearestAirportSearchSession).setAirportFilter(showClosed, classMask);
    }
  }
}

/**
 * A nearest search subscription for intersection facilites.
 */
export class NearestIntersectionSubscription extends NearestWaypointSubscription<IntersectionFacility> {
  /**
   * Creates a new NearestIntersectionSubscription.
   * @param facilityLoader The facility loader to use with this instance.
   */
  constructor(facilityLoader: FacilityLoader) {
    super(facilityLoader, FacilitySearchType.Intersection);
  }

  /**
   * Sets the intersection search filter.
   * @param typeMask A bitmask representing the classes of intersections to show.
   */
  public setFilter(typeMask: number): void {
    if (this.session !== undefined) {
      (this.session as NearestIntersectionSearchSession).setIntersectionFilter(typeMask);
    }
  }
}

/**
 * A nearest search subscription for VOR facilites.
 */
export class NearestVorSubscription extends NearestWaypointSubscription<VorFacility> {
  /**
   * Creates a new NearestVorSubscription.
   * @param facilityLoader The facility loader to use with this instance.
   */
  constructor(facilityLoader: FacilityLoader) {
    super(facilityLoader, FacilitySearchType.Vor);
  }
}

/**
 * A nearest search subscription for NDB facilites.
 */
export class NearestNdbSubscription extends NearestWaypointSubscription<NdbFacility> {
  /**
   * Creates a new NearestNdbSubscription.
   * @param facilityLoader The facility loader to use with this instance.
   */
  constructor(facilityLoader: FacilityLoader) {
    super(facilityLoader, FacilitySearchType.Ndb);
  }
}