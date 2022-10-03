import { EventBus } from '../data/EventBus';
import { Facility } from './Facilities';
import { FacilityWaypointCache } from './FacilityWaypointCache';
import { FacilityWaypoint } from './Waypoint';

/**
 * A default implementation of {@link FacilityWaypointCache}.
 */
export class DefaultFacilityWaypointCache implements FacilityWaypointCache {
  private static INSTANCE: DefaultFacilityWaypointCache | undefined;

  private readonly cache = new Map<string, FacilityWaypoint<any>>();

  /**
   * Constructor.
   * @param bus The event bus.
   * @param size The maximum size of this cache.
   */
  private constructor(private readonly bus: EventBus, public readonly size: number) {
  }

  /** @inheritdoc */
  public get<T extends Facility>(facility: Facility): FacilityWaypoint<T> {
    let existing = this.cache.get(facility.icao);
    if (!existing) {
      existing = new FacilityWaypoint(facility, this.bus);
      this.addToCache(facility, existing);
    }
    return existing;
  }

  /**
   * Adds a waypoint to this cache. If the size of the cache is greater than the maximum after the new waypoint is
   * added, a waypoint will be removed from the cache in FIFO order.
   * @param facility The facility associated with the waypoint to add.
   * @param waypoint The waypoint to add.
   */
  private addToCache(facility: Facility, waypoint: FacilityWaypoint<any>): void {
    this.cache.set(facility.icao, waypoint);
    if (this.cache.size > this.size) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }

  /**
   * Gets a FacilityWaypointCache instance.
   * @param bus The event bus.
   * @returns A FacilityWaypointCache instance.
   */
  public static getCache(bus: EventBus): FacilityWaypointCache {
    return DefaultFacilityWaypointCache.INSTANCE ??= new DefaultFacilityWaypointCache(bus, 1000);
  }
}