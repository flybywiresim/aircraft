import { NumberUnitSubject, UnitType } from '../../../math';
import {
  AirportFacility, Facility, FacilityWaypoint, IntersectionFacility, NdbFacility, NearestAirportSearchSession, NearestIntersectionSearchSession,
  NearestVorSearchSession, VorFacility
} from '../../../navigation';
import { Subject } from '../../../sub/Subject';

/**
 * A handler to determine waypoint visibility.
 */
type WaypointVisibilityHandler<T extends Facility> = (w: FacilityWaypoint<T>) => boolean;

/**
 * Filters for the nearest intersections.
 */
interface IntersectionFilters {
  /** A bitmask of allowable intersection types. */
  typeMask: number,

  /** Whether or not to show terminal waypoints. */
  showTerminalWaypoints: boolean
}

/**
 * Filters for the nearest VORs.
 */
interface VorFilters {
  /** A bitmask of allowable VOR types. */
  typeMask: number,

  /** A bitmask of allowable VOR classes. */
  classMask: number
}

/**
 * Filters for the nearest airports.
 */
interface AirportFilters {
  /** A bitmask of allowable airport classes. */
  classMask: number,

  /** Whether or not to show closed airports. */
  showClosed: boolean
}

/**
 * Extended filters for the nearest airports.
 */
interface ExtendedAirportFilters {
  /** A bitmask of allowable runway surface types. */
  runwaySurfaceTypeMask: number,

  /** A bitmask of allowable approach types. */
  approachTypeMask: number,

  /** A bitmask of whether or not to show towered or untowered airports. */
  toweredMask: number,

  /** The minimum runway length to allow. */
  minimumRunwayLength: number
}

/**
 * A map data module that controls waypoint display options.
 */
export class MapWaypointDisplayModule {

  /** A handler that dictates airport waypoint visibility. */
  public showAirports = Subject.create<WaypointVisibilityHandler<AirportFacility>>(() => true);

  /** A handler that dictates intersection waypoint visibility. */
  public showIntersections = Subject.create<WaypointVisibilityHandler<IntersectionFacility>>(() => false);

  /** A handler that dictates NDB waypoint visibility. */
  public showNdbs = Subject.create<WaypointVisibilityHandler<NdbFacility>>(() => true);

  /** A handler that dictates VOR waypoint visibility. */
  public showVors = Subject.create<WaypointVisibilityHandler<VorFacility>>(() => true);

  /** The maximum range at which airport waypoints should be searched for. */
  public airportsRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(50));

  /** The maximum range at which intersection waypoints should be searched for. */
  public intersectionsRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(50));

  /** The maximum range at which NDB waypoints should be searched for. */
  public ndbsRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(500));

  /** The maximum range at which VOR waypoints should be searched for. */
  public vorsRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(500));

  /** The maximum number of airports that should be displayed. */
  public numAirports = Subject.create(40);

  /** The maximum number of intersections that should be displayed. */
  public numIntersections = Subject.create(40);

  /** The maximum number of NDBs that should be displayed. */
  public numNdbs = Subject.create(40);

  /** The maximum number of VORs that should be displayed. */
  public numVors = Subject.create(40);

  /** The filter to apply to the intersection search. */
  public intersectionsFilter = Subject.create<IntersectionFilters>({
    typeMask: NearestIntersectionSearchSession.Defaults.TypeMask,
    showTerminalWaypoints: true
  });

  /** The filter to apply to the VOR search. */
  public vorsFilter = Subject.create<VorFilters>({
    typeMask: NearestVorSearchSession.Defaults.TypeMask,
    classMask: NearestVorSearchSession.Defaults.ClassMask
  });

  /** The filter to apply to the airport search. */
  public airportsFilter = Subject.create<AirportFilters>({
    classMask: NearestAirportSearchSession.Defaults.ClassMask,
    showClosed: NearestAirportSearchSession.Defaults.ShowClosed
  });

  /** The extended airport filter to apply to the airport search. */
  public extendedAirportsFilter = Subject.create<ExtendedAirportFilters>({
    runwaySurfaceTypeMask: NearestAirportSearchSession.Defaults.SurfaceTypeMask,
    approachTypeMask: NearestAirportSearchSession.Defaults.ApproachTypeMask,
    minimumRunwayLength: NearestAirportSearchSession.Defaults.MinimumRunwayLength,
    toweredMask: NearestAirportSearchSession.Defaults.ToweredMask
  });
}