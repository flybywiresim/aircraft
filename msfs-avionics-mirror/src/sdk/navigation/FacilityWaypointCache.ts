import { Facility } from './Facilities';
import { FacilityWaypoint } from './Waypoint';

/**
 * A cache of facility waypoints.
 */
export interface FacilityWaypointCache {
  /**
   * Gets a waypoint from the cache for a specific facility. If one does not exist, a new waypoint will be created.
   * @param facility The facility for which to get a waypoint.
   * @returns A waypoint.
   */
  get<T extends Facility>(facility: Facility): FacilityWaypoint<T>;
}