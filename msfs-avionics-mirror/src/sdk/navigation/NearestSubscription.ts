/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { GeoPoint } from '../geo';
import { ArraySubject } from '../sub';
import { AbstractSubscribableArray } from '../sub/AbstractSubscribableArray';
import { SubscribableArray, SubscribableArrayEventType } from '../sub/SubscribableArray';
import { SortedMappedSubscribableArray } from '../utils/datastructures';
import {
  AirportFacility, Facility, FacilitySearchType, FacilityType, IntersectionFacility, NdbFacility, NearestSearchResults, VorFacility
} from './Facilities';
import { FacilityLoader, NearestAirportSearchSession, NearestIntersectionSearchSession, NearestSearchSession } from './FacilityLoader';

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
 * Interface specification for a nearest search subscription.
 */
export interface NearestSubscription<T extends Facility> extends SubscribableArray<T> {
  /** Whether the search has started. */
  started: boolean,
  /** The method for starting a search. */
  start: () => Promise<void>
  /** The method for updating a search. */
  update: (lat: number, lon: number, radius: number, maxItems: number) => Promise<void>
}

/**
 * A class for tracking a nearest facility session and making it available as a
 * subscribable array of facilities.
 */
export abstract class AbstractNearestSubscription<T extends Facility, TAdded, TRemoved> extends AbstractSubscribableArray<T> implements NearestSubscription<T>{
  protected readonly facilities: T[] = [];
  protected readonly facilityIndex: Map<TRemoved, T> = new Map<TRemoved, T>();

  protected session: NearestSearchSession<TAdded, TRemoved> | undefined;
  private searchInProgress = false;

  /**
   * Creates an instance of a NearestSubscription.
   * @param facilityLoader An instance of the facility loader to search with.
   * @param type The type of facility to search for.
   */
  constructor(protected readonly facilityLoader: FacilityLoader, protected readonly type: FacilitySearchType) {
    super();
  }

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
  public getArray(): readonly T[] {
    return this.facilities;
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

    this.notify(this.facilities.length - 1, SubscribableArrayEventType.Added, facility);
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

      this.notify(this.facilities.length - 1, SubscribableArrayEventType.Removed, facility);
    }
  }
}

/**
 * A nearest search subscription for waypoint facilites, including logic for further filtering
 * of results beyond what the sim search API gives us.
 */
abstract class NearestWaypointSubscription<T extends Facility> extends AbstractNearestSubscription<T, string, string> {
  private filterCb?: (facility: T) => boolean;
  private facilityCache = new Map<string, T>();

  /**
   * Creates a new NearestWaypointSubscription.
   * @param facilityLoader An instance of the facility loader to search with.
   * @param type The type of facility to search for.
   * @param filterCb An optional callback for filtering the results.
   */
  constructor(facilityLoader: FacilityLoader, type: FacilitySearchType = FacilitySearchType.User, filterCb?: (facility: T) => boolean) {
    super(facilityLoader, type);
    this.filterCb = filterCb;
  }

  /**
   * Change the search filter and trigger a refresh of the search results.
   * @param filter The new search filter to use.
   */
  public setFilterCb(filter: (facility: T) => boolean): void {
    this.filterCb = filter;

    // Start the refresh of our data by iterating over the current entries and
    // removing any that no longer match the filter.
    for (const icao of this.facilityIndex.keys()) {
      if (!this.filterCb(this.facilityIndex.get(icao)!)) {
        this.removeFacility(icao);
      }
    }

    // Next go through our facility cache and add any existing entries that
    // hadn't previously matched but now do.
    for (const icao of this.facilityCache.keys()) {
      if (!this.facilityIndex.get(icao) && this.filterCb(this.facilityCache.get(icao)!)) {
        this.addFacility(this.facilityCache.get(icao)!, icao);
      }
    }
  }

  /** @inheritdoc */
  protected async onResults(results: NearestSearchResults<string, string>): Promise<void> {
    const facilityType = facilitySearchTypeMap.get(this.type);
    if (facilityType !== undefined) {
      const added = await Promise.all(results.added.map(icao => this.facilityLoader.getFacility(facilityType, icao) as unknown as T));
      for (let i = 0; i < added.length; i++) {
        this.facilityCache.set(added[i].icao, added[i]);
        if (this.filterCb === undefined || this.filterCb(added[i])) {
          this.addFacility(added[i] as unknown as T, added[i].icao);
        }
      }

      for (let i = 0; i < results.removed.length; i++) {
        this.facilityCache.delete(results.removed[i]);
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
   * @param filterCb An optional filter to use for additional search criteria.
   */
  constructor(facilityLoader: FacilityLoader, filterCb?: (facility: AirportFacility) => boolean) {
    super(facilityLoader, FacilitySearchType.Airport, filterCb);
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

  /**
   * Sets the extended airport filters for the airport nearest search.
   * @param surfaceTypeMask A bitmask of allowable runway surface types.
   * @param approachTypeMask A bitmask of allowable approach types.
   * @param toweredMask A bitmask of untowered (1) or towered (2) bits.
   * @param minRunwayLength The minimum allowable runway length, in meters.
   */
  public setExtendedFilters(surfaceTypeMask: number, approachTypeMask: number, toweredMask: number, minRunwayLength: number): void {
    if (this.session !== undefined) {
      (this.session as NearestAirportSearchSession).setExtendedAirportFilters(surfaceTypeMask, approachTypeMask, toweredMask, minRunwayLength);
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

/**
 * A wrapper for a {@link NearestSearchSession} that automatically adjusts the number of
 * search results requested from the sim to minimize search load while still attempting to
 * provide the total number of results needed by the user.
 */
export class AdaptiveNearestSubscription<T extends Facility> extends AbstractSubscribableArray<T> implements NearestSubscription<T> {
  private static readonly RAMP_UP_FACTOR = 1.33;
  private static readonly RAMP_DOWN_FACTOR = 0.1;

  /** The array that holds the results of our latest search. */
  private facilities = ArraySubject.create<T>();

  /**
   * This array provides a backing store for what is essentially a "virtual" array
   * representing the aggregate of our search results to the client. Since we need to
   * limit the number of results returned we will carefully manage notifications when
   * anything changes to only expose the requested number of elements.
   */
  private shadowFacilities = SortedMappedSubscribableArray.create(this.facilities,
    (a: T, b: T) => this.pos.distance(a) - this.pos.distance(b),
    (a: T, b: T) => a.icao === b.icao
  );

  /** The number of items requested on the last call to update. */
  private lastMaxRequested = 0;

  /** The number of items we are requesting from the inner search to meet current demands. */
  private derivedMaxItems = 0;

  /** Whether we have a search in progress already. */
  private searchInProgress = false;

  /** A reusable GeoPoint for sorting by distance. */
  private pos = new GeoPoint(0, 0);

  /**
   * Creates an instance of AdaptiveNearestSubscription.
   * @param subscription A {@link NearestSubscription} to use as our inner search.
   * @param absoluteMaxItems The maximum number of results to request in any search.
   */
  constructor(private subscription: AbstractNearestSubscription<T, any, any>, private absoluteMaxItems: number) {
    super();

    // When the search updates, this will cause our facilities array to be updated.
    this.subscription.sub(this.onSourceChanged.bind(this));

    // And this responds in changes to the facilities array via the mapping between the
    // two to send any managed notifications needed to our subscribers.
    this.shadowFacilities.sub(this.notifySubscribers.bind(this));
  }

  /** @inheritdoc */
  public get length(): number {
    return this.shadowFacilities.length;
  }

  /** @inheritdoc */
  public getArray(): readonly T[] {
    return this.shadowFacilities.getArray();
  }

  /**
   * Whether or not the inner search has started.
   * @returns True if started, false otherwise.
   */
  public get started(): boolean {
    return this.subscription.started;
  }

  /**
   * Start the inner search subscription.
   */
  public async start(): Promise<void> {
    return this.subscription.start();
  }

  /**
   * Cause the inner subscription to update.
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
    this.pos.set(lat, lon);

    // It would be unexpected for the max requested number of items to change, but the API
    // supports it so we're going to handle it anyway.  If it changes we need to automatically
    // grow or shrink the size of the virtual array we show our subscribers before further
    // processing search results.
    if (maxItems < this.lastMaxRequested) {
      // Remove existing results from the end to avoid indices shifting around.
      for (let i = this.shadowFacilities.length - 1; i >= maxItems; i--) {
        this.notify(i, SubscribableArrayEventType.Removed, this.shadowFacilities.get(i));
      }
    } else if (maxItems > this.lastMaxRequested) {
      // Be careful not to overflow shadowFacilities when adding new items.
      for (let i = this.lastMaxRequested; i < Math.min(maxItems, this.shadowFacilities.length); i++) {
        this.notify(i, SubscribableArrayEventType.Added, this.shadowFacilities.get(i));
      }
    }
    this.lastMaxRequested = maxItems;

    if (maxItems > this.derivedMaxItems) {
      this.derivedMaxItems = maxItems;
    }

    // When the subscription updates, any changes from airports added or removed cause
    // onSourceChanged below to trigger.   That will update our facilites store, because
    // it means the airport is no longer in the raw search data.
    await this.subscription.update(lat, lon, radius, this.derivedMaxItems);

    // If we have more returned facilities in our search than the user has asked for we
    // can begin a ramp-down of our search size.  Ramp down is less aggressive than
    // ramp up to avoid flapping between the two states.
    if (this.facilities.length > maxItems) {
      this.derivedMaxItems = Math.max(
        Math.round(
          this.derivedMaxItems - (this.derivedMaxItems * AdaptiveNearestSubscription.RAMP_DOWN_FACTOR)
        ),
        maxItems
      );
    } else {
      // We have either exactly enough or too few facilities.  If we have too few, ramp
      // up our search size until we either have enough or hit the maximum allowed search
      // quantity.
      while (this.facilities.length < maxItems && this.derivedMaxItems < this.absoluteMaxItems) {
        this.derivedMaxItems = Math.min(
          Math.round(this.derivedMaxItems * AdaptiveNearestSubscription.RAMP_UP_FACTOR),
          this.absoluteMaxItems
        );
        await this.subscription.update(lat, lon, radius, this.derivedMaxItems);
      }
    }
    this.searchInProgress = false;
  }

  /**
   * Responds to changes in our inner search and updates our facilities store accordingly.
   * @param index The index of the changed item.
   * @param type The type of change.
   * @param item The item(s) involved in the change, if any.
   */
  private onSourceChanged(index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined): void {
    if (type === SubscribableArrayEventType.Cleared) {
      this.facilities.clear();
      this.notify(0, SubscribableArrayEventType.Cleared);
      return;
    }

    if (item === undefined) {
      return;
    }

    // SubscribableArrayHandler uses a compound type for T, but NearestWaypointSubscription
    // should only ever send us a single item to add or remove.  We'll treat it as if that
    // were the only expected case to simplify the processing.
    if (item instanceof Array) {
      console.warn('AdaptiveNearestSubscription received unexpected type.');
      return;
    }

    switch (type) {
      case SubscribableArrayEventType.Added:
        this.facilities.insert(item as T);
        break;
      case SubscribableArrayEventType.Removed:
        this.facilities.removeItem(item as T);
        break;
    }
  }

  /**
   * Notify our subscribers of changes to the virtual search results.
   * @param index The index of the changed item.
   * @param type The type of change.
   * @param item The item(s) involved in the change, if any.
   */
  private notifySubscribers(index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined): void {
    // The subscriber doesn't care if the change is at an index above what they should see.
    if (index >= this.lastMaxRequested || item === undefined) {
      return;
    }

    // Since we iterate over individal items in onSourceChanged we should never have an array here.
    if (item instanceof Array && type !== SubscribableArrayEventType.Cleared) {
      console.warn('AdaptiveNearestSubscription: received array of items in a single notification');
    }

    this.notify(index, type, item);
    switch (type) {
      case SubscribableArrayEventType.Cleared:
        // NOOP
        break;
      case SubscribableArrayEventType.Added:
        // We've just added something.  If it's within the range of the virtual array, it will pop the last
        // item off the end of the array if one exists, so we send a remove notificaiton for that.
        if (index < this.lastMaxRequested && this.shadowFacilities.tryGet(this.lastMaxRequested) !== undefined) {
          this.notify(this.lastMaxRequested, SubscribableArrayEventType.Removed, this.shadowFacilities.get(this.lastMaxRequested));
        }
        break;
      case SubscribableArrayEventType.Removed:
        // If we've removed an item within the range of the virtual array it will leave a vacant spot at the
        // end.  If there's something we can put there we need to do that.
        if (index < this.lastMaxRequested && this.shadowFacilities.tryGet(this.lastMaxRequested - 1) !== undefined) {
          this.notify(this.lastMaxRequested - 1, SubscribableArrayEventType.Added, this.shadowFacilities.get(this.lastMaxRequested - 1));
        }
    }
  }
}