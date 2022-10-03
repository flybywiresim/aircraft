import { GeoPointInterface } from '../../geo/GeoPoint';
import { Subscribable } from '../../sub/Subscribable';

/**
 * A waypoint which is renderable to a map.
 */
export interface MapWaypoint {
  /** This waypoint's unique string ID. */
  readonly uid: string;

  /** The location of this waypoint. */
  readonly location: Subscribable<GeoPointInterface>;
}