import { EventBus } from '../data/EventBus';
import { FlightPathUtils, LegDefinition } from '../flightplan';
import { GeoCircle, GeoPoint, GeoPointInterface, GeoPointSubject } from '../geo';
import { UnitType } from '../math';
import { Subject } from '../sub/Subject';
import { Subscribable } from '../sub/Subscribable';
import { Subscription } from '../sub/Subscription';
import { Facility, FacilityType, ICAO } from './Facilities';
import { FacilityRepositoryEvents } from './FacilityRepository';

/**
 * A collection of unique string waypoint type keys.
 */
export enum WaypointTypes {
  Custom = 'Custom',
  Airport = 'Airport',
  NDB = 'NDB',
  VOR = 'VOR',
  Intersection = 'Intersection',
  Runway = 'Runway',
  User = 'User',
  Visual = 'Visual',
  FlightPlan = 'FlightPlan',
  VNAV = 'VNAV'
}

/**
 * A navigational waypoint.
 */
export interface Waypoint {
  /** The geographic location of the waypoint. */
  readonly location: Subscribable<GeoPointInterface>;

  /** A unique string ID assigned to this waypoint. */
  readonly uid: string;

  /**
   * Checks whether this waypoint and another are equal.
   * @param other The other waypoint.
   * @returns whether this waypoint and the other are equal.
   */
  equals(other: Waypoint): boolean;

  /** The unique string type of this waypoint. */
  readonly type: string;
}

/**
 * An abstract implementation of Waypoint.
 */
export abstract class AbstractWaypoint implements Waypoint {
  public abstract get location(): Subscribable<GeoPointInterface>;
  public abstract get uid(): string;
  public abstract get type(): string;

  // eslint-disable-next-line jsdoc/require-jsdoc
  public equals(other: Waypoint): boolean {
    return this.uid === other.uid;
  }
}

/**
 * A waypoint with custom defined lat/lon coordinates.
 */
export class CustomWaypoint extends AbstractWaypoint {
  private readonly _location: Subscribable<GeoPointInterface>;
  private readonly _uid: string;

  /**
   * Constructor.
   * @param lat The latitude of this waypoint.
   * @param lon The longitude of this waypoint.
   * @param uidPrefix The prefix of this waypoint's UID.
   */
  constructor(lat: number, lon: number, uidPrefix: string);
  /**
   * Constructor.
   * @param location A subscribable which provides the location of this waypoint.
   * @param uid This waypoint's UID.
   */
  constructor(location: Subscribable<GeoPointInterface>, uid: string);
  // eslint-disable-next-line jsdoc/require-jsdoc
  constructor(arg1: number | Subscribable<GeoPointInterface>, arg2: number | string, arg3?: string) {
    super();

    let location: Subscribable<GeoPointInterface>;
    let uid: string;

    if (typeof arg1 === 'number') {
      location = GeoPointSubject.createFromGeoPoint(new GeoPoint(arg1, arg2 as number));
      uid = `${arg3 as string}[${location.get().lat},${location.get().lon}]`;
    } else {
      location = arg1;
      uid = arg2 as string;
    }

    this._location = location;
    this._uid = uid;
  }

  /** @inheritdoc */
  public get location(): Subscribable<GeoPointInterface> {
    return this._location;
  }

  /** @inheritdoc */
  public get uid(): string {
    return this._uid;
  }

  /** @inheritdoc */
  public get type(): string {
    return WaypointTypes.Custom;
  }
}

/**
 * A waypoint associated with a facility.
 */
export class FacilityWaypoint<T extends Facility = Facility> extends AbstractWaypoint {
  private _facility: Subject<T>;
  private readonly _location: GeoPointSubject;
  private readonly _type: WaypointTypes;

  private facChangeSub?: Subscription;

  /**
   * Constructor.
   * @param facility The facility associated with this waypoint.
   * @param bus The event bus.
   */
  constructor(facility: T, private readonly bus: EventBus) {
    super();

    this._facility = Subject.create(facility);

    this._location = GeoPointSubject.createFromGeoPoint(new GeoPoint(facility.lat, facility.lon));
    this._type = FacilityWaypoint.getType(facility);

    const facType = ICAO.getFacilityType(facility.icao);
    if (facType === FacilityType.VIS || facType === FacilityType.USR) {
      // These types of facilities can be mutated. So we need to listen to the event bus for change events and respond
      // accordingly.

      this.facChangeSub = this.bus.getSubscriber<FacilityRepositoryEvents>()
        .on(`facility_changed_${facility.icao}`)
        .handle(newFacility => {
          this._facility.set(newFacility as T);
          this._location.set(newFacility.lat, newFacility.lon);
        });
    }
  }

  /** @inheritdoc */
  public get location(): Subscribable<GeoPointInterface> {
    return this._location;
  }

  /** @inheritdoc */
  public get uid(): string {
    return this.facility.get().icao;
  }

  /** @inheritdoc */
  public get type(): string {
    return this._type;
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * The facility associated with this waypoint.
   */
  public get facility(): Subscribable<T> {
    return this._facility;
  }

  /**
   * Gets a waypoint type from a facility.
   * @param facility A facility.
   * @returns The waypoint type corresponding to the facility.
   */
  private static getType(facility: Facility): WaypointTypes {
    switch (ICAO.getFacilityType(facility.icao)) {
      case FacilityType.Airport:
        return WaypointTypes.Airport;
      case FacilityType.Intersection:
        return WaypointTypes.Intersection;
      case FacilityType.NDB:
        return WaypointTypes.NDB;
      case FacilityType.RWY:
        return WaypointTypes.Runway;
      case FacilityType.USR:
        return WaypointTypes.User;
      case FacilityType.VIS:
        return WaypointTypes.Visual;
      case FacilityType.VOR:
        return WaypointTypes.VOR;
      default:
        return WaypointTypes.User;
    }
  }
}

/**
 * A flight path waypoint.
 */
export class FlightPathWaypoint extends CustomWaypoint {
  public static readonly UID_PREFIX = 'FLPTH';

  /** The ident string of this waypoint. */
  public readonly ident: string;

  /** @inheritdoc */
  public get type(): string { return WaypointTypes.FlightPlan; }

  /**
   * Constructor.
   * @param lat The latitude of this waypoint.
   * @param lon The longitude of this waypoint.
   * @param ident The ident string of this waypoint.
   */
  constructor(lat: number, lon: number, ident: string);
  /**
   * Constructor.
   * @param location A subscribable which provides the location of this waypoint.
   * @param uid This waypoint's UID.
   * @param ident The ident string of this waypoint.
   */
  constructor(location: Subscribable<GeoPointInterface>, uid: string, ident: string);
  // eslint-disable-next-line jsdoc/require-jsdoc
  constructor(arg1: number | Subscribable<GeoPointInterface>, arg2: number | string, ident: string) {
    if (typeof arg1 === 'number') {
      super(arg1 as number, arg2 as number, `${FlightPathWaypoint.UID_PREFIX}_${ident}`);
    } else {
      super(arg1, arg2 as string);
    }

    this.ident = ident;
  }
}

/**
 * A VNAV TOD/BOD waypoint.
 */
export class VNavWaypoint extends AbstractWaypoint {
  private static readonly uidMap = { 'tod': 'vnav-tod', 'bod': 'vnav-bod' };
  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3)];
  private static readonly geoPointCache = [new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly _location: GeoPointSubject;
  private readonly _uid: string;

  /** @inheritdoc */
  public get type(): string { return WaypointTypes.VNAV; }

  /**
   * Constructor.
   * @param leg The leg that the VNAV waypoint is contained in.
   * @param distanceFromEnd The distance along the flight path from the end of the leg to the location of the waypoint,
   * in meters.
   * @param type The type of VNAV leg.
   */
  constructor(leg: LegDefinition, distanceFromEnd: number, type: 'tod' | 'bod') {
    super();

    this._uid = VNavWaypoint.uidMap[type];
    this._location = GeoPointSubject.createFromGeoPoint(this.getWaypointLocation(leg, distanceFromEnd));
  }

  /**
   * Gets the waypoint's location in space.
   * @param leg The leg that the waypoint resides in.
   * @param distanceFromEnd The distance along the flight path from the end of the leg to the location of the waypoint,
   * in meters.
   * @returns The waypoint's location.
   */
  private getWaypointLocation(leg: LegDefinition, distanceFromEnd: number): GeoPoint {
    const out = new GeoPoint(0, 0);

    if (leg.calculated !== undefined) {
      const vectors = [...leg.calculated.ingress, ...leg.calculated.ingressToEgress, ...leg.calculated.egress];
      let vectorIndex = vectors.length - 1;

      while (vectorIndex >= 0) {
        const vector = vectors[vectorIndex];

        const start = VNavWaypoint.vec3Cache[0];
        const end = VNavWaypoint.vec3Cache[1];

        GeoPoint.sphericalToCartesian(vector.endLat, vector.endLon, end);
        GeoPoint.sphericalToCartesian(vector.startLat, vector.startLon, start);

        const circle = FlightPathUtils.setGeoCircleFromVector(vector, VNavWaypoint.geoCircleCache[0]);
        const vectorDistance = UnitType.GA_RADIAN.convertTo(circle.distanceAlong(start, end), UnitType.METER);

        if (vectorDistance >= distanceFromEnd) {
          return circle.offsetDistanceAlong(end, UnitType.METER.convertTo(-distanceFromEnd, UnitType.GA_RADIAN), out);
        } else {
          distanceFromEnd -= vectorDistance;
        }

        vectorIndex--;
      }

      if (vectors.length > 0) {
        out.set(vectors[0].startLat, vectors[0].startLon);
      }
    }

    return out;
  }

  /** @inheritdoc */
  public get location(): Subscribable<GeoPointInterface> {
    return this._location;
  }

  /** @inheritdoc */
  public get uid(): string {
    return this._uid;
  }
}