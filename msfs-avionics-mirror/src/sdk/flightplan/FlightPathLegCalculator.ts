import { GeoCircle, GeoPoint, GeoPointInterface, GeoPointReadOnly, LatLonInterface, MagVar, NavMath } from '../geo';
import { BitFlags, MathUtils, NumberUnitReadOnly, ReadonlyFloat64Array, UnitFamily, UnitType, Vec3Math } from '../math';
import { Facility, FacilityType, FlightPlanLeg, ICAO, LegTurnDirection, LegType, VorFacility } from '../navigation/Facilities';
import { FlightPathUtils } from './FlightPathUtils';
import {
  CircleInterceptBuilder, CircleVectorBuilder, DirectToPointBuilder, GreatCircleBuilder, JoinGreatCircleToPointBuilder, ProcedureTurnBuilder,
  TurnToCourseBuilder
} from './FlightPathVectorBuilder';
import { FlightPathVectorFlags, LegCalculations, LegDefinition } from './FlightPlanning';

/**
 * The state of a calculating flight path.
 */
export interface FlightPathState {
  /** The current position of the flight path. */
  currentPosition: GeoPoint | undefined;

  /** The current true course bearing of the flight path. */
  currentCourse: number | undefined;

  /** Whether the flight path is in a fallback state. */
  isFallback: boolean;

  /** The position of the airplane. */
  readonly planePosition: GeoPointReadOnly;

  /** The true heading of the airplane. */
  readonly planeHeading: number;

  /** The altitude of the airplane. */
  readonly planeAltitude: NumberUnitReadOnly<UnitFamily.Distance>;

  /** The ground speed of the airplane. */
  readonly planeSpeed: NumberUnitReadOnly<UnitFamily.Speed>;

  /** The climb rate of the airplane. */
  readonly planeClimbRate: NumberUnitReadOnly<UnitFamily.Speed>;

  /** The desired turn radius. */
  readonly desiredTurnRadius: NumberUnitReadOnly<UnitFamily.Distance>;
}

/**
 * A flight path calculator for individual flight plan legs.
 */
export interface FlightPathLegCalculator {
  /**
   * Calculates flight path vectors for a flight plan leg and adds the calculations to the leg.
   * @param legs A sequence of flight plan legs.
   * @param calculateIndex The index of the leg to calculate.
   * @param activeLegIndex The index of the active leg.
   * @param state The current flight path state.
   * @returns The flight plan leg calculations.
   */
  calculate(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState,
    resolveIngressToEgress?: boolean
  ): LegCalculations;
}

/**
 * Abstract implementation of FlightPathLegCalculator.
 */
export abstract class AbstractFlightPathLegCalculator implements FlightPathLegCalculator {
  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   * @param skipWhenActive Whether this calculator will skip calculations for active legs when the leg has already
   * been calculated. False by default.
   */
  constructor(protected readonly facilityCache: Map<string, Facility>, protected readonly skipWhenActive = false) {
  }

  /**
   * Gets a geographical position from an ICAO string.
   * @param icao An ICAO string.
   * @param out A GeoPoint object to which to write the result.
   * @returns The geographical position corresponding to the ICAO string, or undefined if one could not be obtained.
   */
  protected getPositionFromIcao(icao: string, out: GeoPoint): GeoPoint | undefined {
    const facility = this.facilityCache.get(icao);
    return facility ? out.set(facility) : undefined;
  }

  /**
   * Gets the geographic position for a flight plan leg terminator.
   * @param leg A flight plan leg.
   * @param icao The ICAO string of the leg's terminator fix.
   * @param out A GeoPoint object to which to write the result.
   * @returns The position of the leg terminator, or undefined if it could not be determined.
   */
  protected getTerminatorPosition(leg: FlightPlanLeg, icao: string, out: GeoPoint): GeoPoint | undefined {
    if (leg.lat !== undefined && leg.lon !== undefined) {
      return out.set(leg.lat, leg.lon);
    } else {
      const facility = this.facilityCache.get(icao);
      return facility ? out.set(facility.lat, facility.lon) : undefined;
    }
  }

  /**
   * Gets the true course for a flight plan leg. If the leg defines an origin or fix VOR facility, then the magnetic
   * variation defined at the VOR is used to adjust magnetic course, otherwise the computed magnetic variation for the
   * specified point is used.
   * @param leg A flight plan leg.
   * @param point The location from which to get magnetic variation, if an origin VOR is not found.
   * @returns the true course for the flight plan leg.
   */
  protected getLegTrueCourse(leg: FlightPlanLeg, point: LatLonInterface): number {
    if (leg.trueDegrees) {
      return leg.course;
    }

    const facIcao = (leg.originIcao && ICAO.isFacility(leg.originIcao) && ICAO.getFacilityType(leg.originIcao) === FacilityType.VOR) ? leg.originIcao
      : (leg.fixIcao && ICAO.isFacility(leg.fixIcao) && ICAO.getFacilityType(leg.fixIcao) === FacilityType.VOR) ? leg.fixIcao
        : undefined;

    const facility = facIcao ? this.facilityCache.get(facIcao) as VorFacility | undefined : undefined;
    const magVar = facility
      ? -facility.magneticVariation
      : Facilities.getMagVar(point.lat, point.lon);

    return NavMath.normalizeHeading(leg.course + magVar);
  }

  /** @inheritdoc */
  public calculate(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState,
    resolveIngressToEgress = true
  ): LegCalculations {
    const calcs = legs[calculateIndex].calculated ??= {
      startLat: undefined,
      startLon: undefined,
      endLat: undefined,
      endLon: undefined,
      distance: 0,
      distanceWithTransitions: 0,
      initialDtk: undefined,
      cumulativeDistance: 0,
      cumulativeDistanceWithTransitions: 0,
      flightPath: [],
      ingress: [],
      ingressJoinIndex: -1,
      ingressToEgress: [],
      egressJoinIndex: -1,
      egress: [],
      endsInFallback: false
    };

    const vectors = calcs.flightPath;
    if (this.skipWhenActive && activeLegIndex === calculateIndex && this.shouldSkipWhenActive(legs, calculateIndex, activeLegIndex, state)) {
      state.currentPosition = FlightPathUtils.getLegFinalPosition(calcs, state.currentPosition ?? new GeoPoint(0, 0));
      state.currentCourse = FlightPathUtils.getLegFinalCourse(calcs) ?? state.currentCourse;
      state.isFallback = calcs.endsInFallback;
      return calcs;
    }

    try {
      this.calculateVectors(legs, calculateIndex, activeLegIndex, state);
      resolveIngressToEgress && this.resolveIngressToEgress(calcs);
      calcs.endsInFallback = state.isFallback;
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        console.error(e.stack);
      }

      vectors.length = 0;
      calcs.ingress.length = 0;
      calcs.ingressJoinIndex = 0;
      calcs.egress.length = 0;
      calcs.egressJoinIndex = -1;
      calcs.ingressToEgress.length = 0;
      calcs.endsInFallback = false;

      state.isFallback = false;
    }

    return calcs;
  }

  /**
   * Checks whether vector calculations should be skipped when the leg to calculate is the active leg.
   * @param legs A sequence of flight plan legs.
   * @param calculateIndex The index of the leg to calculate.
   * @param activeLegIndex The index of the active leg.
   * @param state The current flight path state.
   * @returns Whether to skip vector calculations.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected shouldSkipWhenActive(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): boolean {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return legs[calculateIndex].calculated!.flightPath.length > 0;
  }

  /**
   * Calculates flight path vectors for a flight plan leg.
   * @param legs A sequence of flight plan legs.
   * @param calculateIndex The index of the leg to calculate.
   * @param activeLegIndex The index of the active leg.
   * @param state The current flight path state.
   * @returns The number of vectors added to the sequence.
   */
  protected abstract calculateVectors(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number, state: FlightPathState): void;

  /**
   * Calculates the ingress to egress vectors for a flight plan leg and adds them to a leg calculation.
   * @param legCalc The calculations for a flight plan leg.
   */
  protected resolveIngressToEgress(legCalc: LegCalculations): void {
    FlightPathUtils.resolveIngressToEgress(legCalc);
  }
}

/**
 * Calculates flight path vectors for discontinuity legs.
 */
export class DiscontinuityLegCalculator extends AbstractFlightPathLegCalculator {
  /** @inheritdoc */
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    legs[calculateIndex].calculated!.flightPath.length = 0;
    state.currentCourse = undefined;
    state.currentPosition = undefined;
    state.isFallback = false;
  }
}

/**
 * Calculates flight path vectors for track to fix legs.
 */
export class TrackToFixLegCalculator extends AbstractFlightPathLegCalculator {
  private readonly geoPointCache = [new GeoPoint(0, 0)];

  private readonly greatCircleBuilder = new GreatCircleBuilder();
  private readonly directToPointBuilder = new DirectToPointBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, false);
  }

  /** @inheritdoc */
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    const prevLeg = legs[calculateIndex - 1]?.leg;
    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const terminatorPos = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[0]);

    if (!terminatorPos) {
      vectors.length = 0;
      state.isFallback = false;
      return;
    }

    state.currentPosition ??= terminatorPos.copy();
    const distance = state.currentPosition.distance(terminatorPos);

    if ((!prevLeg || (prevLeg.type !== LegType.FM && prevLeg.type !== LegType.VM)) && distance > GeoPoint.EQUALITY_TOLERANCE) {

      if (state.isFallback && state.currentCourse !== undefined) {
        vectorIndex += this.directToPointBuilder.build(
          vectors, vectorIndex,
          state.currentPosition, state.currentCourse,
          terminatorPos,
          state.desiredTurnRadius.asUnit(UnitType.METER), undefined,
          FlightPathVectorFlags.Fallback
        );
      } else {
        vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, state.currentPosition, terminatorPos, state.currentCourse);
      }

      state.currentCourse = FlightPathUtils.getVectorFinalCourse(vectors[vectorIndex - 1]);
    }

    state.currentPosition.set(terminatorPos);

    vectors.length = vectorIndex;
    state.isFallback = false;
  }
}

/**
 * Calculates flight path vectors for direct to fix legs.
 */
export class DirectToFixLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  protected readonly directToPointBuilder = new DirectToPointBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  /** @inheritdoc */
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    state.isFallback = false;

    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const terminatorPos = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[1]);

    if (!terminatorPos) {
      vectors.length = 0;
      return;
    }

    state.currentPosition ??= terminatorPos.copy();

    const startPoint = this.geoPointCache[0].set(state.currentPosition);
    const initialCourse = leg.course !== 0
      ? leg.course % 360
      : state.currentCourse ?? state.planeHeading;

    const startPath = this.geoCircleCache[0].setAsGreatCircle(startPoint, initialCourse);

    vectorIndex += this.directToPointBuilder.build(
      vectors, vectorIndex,
      startPoint, startPath, terminatorPos,
      state.desiredTurnRadius.asUnit(UnitType.METER),
      leg.turnDirection === LegTurnDirection.Left ? 'left' : leg.turnDirection === LegTurnDirection.Right ? 'right' : undefined
    );

    state.currentPosition.set(terminatorPos);
    if (vectorIndex > 0) {
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(vectors[vectorIndex - 1]);
    }

    vectors.length = vectorIndex;
  }
}

/**
 * Calculates flight path vectors for legs which define a turn ending at a defined terminator fix.
 */
export abstract class TurnToFixLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly vec3Cache = [new Float64Array(3), new Float64Array(3)];
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  protected readonly circleVectorBuilder = new CircleVectorBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, false);
  }

  /** @inheritdoc */
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    state.isFallback = false;

    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const terminatorPos = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[0]);
    const turnCenter = this.getTurnCenter(leg);

    if (!terminatorPos || !turnCenter) {
      vectors.length = vectorIndex;
      return;
    }

    if (state.currentPosition && !state.currentPosition.equals(terminatorPos)) {
      const direction = leg.turnDirection === LegTurnDirection.Left ? 'left' : 'right';
      const radius = this.getTurnRadius(leg, turnCenter);

      if (radius) {
        const circle = FlightPathUtils.getTurnCircle(turnCenter, radius, direction, this.geoCircleCache[0]);
        const currentVec = circle.closest(state.currentPosition, this.vec3Cache[0]);
        const terminatorVec = circle.closest(terminatorPos, this.vec3Cache[1]);
        vectorIndex += this.circleVectorBuilder.build(vectors, vectorIndex, circle, currentVec, terminatorVec, FlightPathVectorFlags.Arc);

        state.currentCourse = circle.bearingAt(terminatorVec);

        const turnVector = vectors[vectorIndex - 1];
        (state.currentPosition ??= new GeoPoint(0, 0)).set(turnVector.endLat, turnVector.endLon);
      }
    }

    state.currentPosition ??= terminatorPos.copy();

    vectors.length = vectorIndex;
  }

  /**
   * Gets the center of the turn defined by a flight plan leg.
   * @param leg A flight plan leg.
   * @returns The center of the turn defined by the flight plan leg, or undefined if it could not be determined.
   */
  protected abstract getTurnCenter(leg: FlightPlanLeg): LatLonInterface | undefined;

  /**
   * Gets the radius of the turn defined by a flight plan leg.
   * @param leg A flight plan leg.
   * @param center The center of the turn.
   * @returns The radius of the turn defined by the flight plan leg, or undefined if it could not be determined.
   */
  protected abstract getTurnRadius(leg: FlightPlanLeg, center: LatLonInterface): number | undefined;
}

/**
 * Calculates flight path vectors for radius to fix legs.
 */
export class RadiusToFixLegCalculator extends TurnToFixLegCalculator {
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];

  /** @inheritdoc */
  protected getTurnCenter(leg: FlightPlanLeg): LatLonInterface | undefined {
    return this.facilityCache.get(leg.arcCenterFixIcao);
  }

  /** @inheritdoc */
  protected getTurnRadius(leg: FlightPlanLeg, center: LatLonInterface): number | undefined {
    return this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[2])?.distance(center);
  }
}

/**
 * Calculates flight path vectors for arc to fix legs.
 */
export class ArcToFixLegCalculator extends TurnToFixLegCalculator {
  /** @inheritdoc */
  protected getTurnCenter(leg: FlightPlanLeg): LatLonInterface | undefined {
    return this.facilityCache.get(leg.originIcao);
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getTurnRadius(leg: FlightPlanLeg, center: LatLonInterface): number | undefined {
    return UnitType.METER.convertTo(leg.rho, UnitType.GA_RADIAN);
  }
}

/**
 * Information about a geo circle path to intercept.
 */
export type CircleInterceptPathInfo = {
  /** The geo circle defining the path to intercept. */
  circle: GeoCircle | undefined;

  /** The start of the path to intercept. */
  start: LatLonInterface | undefined;

  /** The end of the path to intercept. */
  end: LatLonInterface | undefined;
};

/**
 * Calculates flight path vectors for legs which define a great-circle path terminating at an intercept with another
 * geo circle.
 */
export abstract class CircleInterceptLegCalculator extends AbstractFlightPathLegCalculator {
  private readonly vec3Cache = [Vec3Math.create(), Vec3Math.create(), Vec3Math.create(), Vec3Math.create(), Vec3Math.create()];
  private readonly geoPointCache = [new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(Vec3Math.create(), 0), new GeoCircle(Vec3Math.create(), 0), new GeoCircle(Vec3Math.create(), 0)];
  private readonly intersectionCache = [Vec3Math.create(), Vec3Math.create()];

  private readonly turnBuilder = new TurnToCourseBuilder();
  private readonly directToPointBuilder = new DirectToPointBuilder();
  private readonly interceptBuilder = new CircleInterceptBuilder();

  private readonly interceptInfo: CircleInterceptPathInfo = {
    circle: undefined,
    start: undefined,
    end: undefined
  };

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   * @param includeInitialTurn Whether this calculator should calculate an initial turn toward the intercept course.
   */
  constructor(facilityCache: Map<string, Facility>, protected readonly includeInitialTurn: boolean) {
    super(facilityCache, true);
  }

  /** @inheritdoc */
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    state.isFallback = false;

    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const course = this.getInterceptCourse(legs, calculateIndex, state);
    const interceptInfo = this.getInterceptPathInfo(legs, calculateIndex, state, this.interceptInfo);

    if (course === undefined || !interceptInfo.circle || !state.currentPosition) {
      vectors.length = vectorIndex;
      return;
    }

    const startCourse = state.currentCourse ?? course;

    const effectiveInterceptPathStartVec = interceptInfo.start
      ? GeoPoint.sphericalToCartesian(interceptInfo.start, this.vec3Cache[0])
      : interceptInfo.end
        ? interceptInfo.circle.offsetAngleAlong(interceptInfo.end, -Math.PI, this.vec3Cache[0], Math.PI)
        : undefined;
    const effectiveInterceptPathEndVec = interceptInfo.end
      ? GeoPoint.sphericalToCartesian(interceptInfo.end, this.vec3Cache[1])
      : interceptInfo.start
        ? interceptInfo.circle.offsetAngleAlong(interceptInfo.start, Math.PI, this.vec3Cache[1], Math.PI)
        : undefined;
    const effectiveInterceptPathAngularWidth = interceptInfo.start && interceptInfo.end
      ? interceptInfo.circle.angleAlong(interceptInfo.start, interceptInfo.end, Math.PI)
      : effectiveInterceptPathStartVec
        ? Math.PI
        : MathUtils.TWO_PI;

    const initialVec = state.currentPosition.toCartesian(this.vec3Cache[2]);
    const includeInitialTurn = this.includeInitialTurn && Math.abs(NavMath.diffAngle(course, startCourse)) >= 1;

    const interceptPathStartVec = Vec3Math.copy(initialVec, this.vec3Cache[3]);

    let initialTurnVector = undefined;

    if (includeInitialTurn) {
      const turnDirection = leg.turnDirection === LegTurnDirection.Left ? 'left'
        : leg.turnDirection === LegTurnDirection.Right ? 'right'
          : NavMath.getTurnDirection(startCourse, course);

      vectorIndex += this.turnBuilder.build(
        vectors, vectorIndex,
        state.currentPosition,
        state.desiredTurnRadius.asUnit(UnitType.METER), turnDirection,
        startCourse, course
      );

      initialTurnVector = vectors[vectorIndex - 1];
      GeoPoint.sphericalToCartesian(initialTurnVector.endLat, initialTurnVector.endLon, interceptPathStartVec);
    }

    const interceptPath = this.geoCircleCache[0].setAsGreatCircle(interceptPathStartVec, course);
    const startPath = this.geoCircleCache[1].set(interceptPath.center, interceptPath.radius);

    // If an initial turn exists, check if a fallback intercept is required because the end of the initial turn lies
    // past the path to intercept. If an initial turn does not exist, check if any fallback intercept is required.

    let fallbackInterceptVec = this.calculateFallbackIntercept(
      interceptPathStartVec, interceptPath,
      interceptInfo.circle, effectiveInterceptPathStartVec, effectiveInterceptPathEndVec, effectiveInterceptPathAngularWidth,
      initialTurnVector !== undefined, false,
      this.vec3Cache[4]
    );

    if (initialTurnVector !== undefined) {
      if (fallbackInterceptVec === undefined) {
        // An initial turn exists and does not end past the path to intercept. Check if a fallback intercept is required
        // for another reason.

        fallbackInterceptVec = this.calculateFallbackIntercept(
          interceptPathStartVec, interceptPath,
          interceptInfo.circle, effectiveInterceptPathStartVec, effectiveInterceptPathEndVec, effectiveInterceptPathAngularWidth,
          false, false,
          this.vec3Cache[4]
        );
      } else {
        // An initial turn exists and ends past the path to intercept. First check if the initial turn intersects the
        // path to intercept

        const turnCircle = FlightPathUtils.setGeoCircleFromVector(initialTurnVector, this.geoCircleCache[2]);
        const intersections = this.intersectionCache;
        const numIntersections = turnCircle.intersection(interceptInfo.circle, intersections);

        if (numIntersections > 1) {
          // Order intersections such that the one closer to the turn end is at index 0.
          if (interceptInfo.circle.radius > MathUtils.HALF_PI !== interceptInfo.circle.encircles(initialVec)) {
            const temp = intersections[0];
            intersections[0] = intersections[1];
            intersections[1] = temp;
          }
        }

        for (let i = 0; i < numIntersections; i++) {
          const intersection = intersections[i];

          if (
            FlightPathUtils.isPointAlongArc(turnCircle, initialVec, interceptPathStartVec, intersection)
            && (
              !effectiveInterceptPathStartVec
              || FlightPathUtils.isPointAlongArc(interceptInfo.circle, effectiveInterceptPathStartVec, effectiveInterceptPathAngularWidth, intersection)
            )
          ) {
            // End the turn early at the intercept point
            const distance = turnCircle.distanceAlong(initialVec, intersection, Math.PI);
            if (distance > GeoCircle.ANGULAR_TOLERANCE) {
              const intersectionPoint = this.geoPointCache[0].setFromCartesian(intersection);
              initialTurnVector.distance = UnitType.GA_RADIAN.convertTo(distance, UnitType.METER);
              initialTurnVector.endLat = intersectionPoint.lat;
              initialTurnVector.endLon = intersectionPoint.lon;

              state.currentPosition.set(initialTurnVector.endLat, initialTurnVector.endLon);
              state.currentCourse = FlightPathUtils.getVectorFinalCourse(initialTurnVector);
            } else {
              vectorIndex--;
            }

            vectors.length = vectorIndex;
            return;
          }
        }

        // The initial turn does not intersect the path to intercept -> calculate a fallback intercept
        // without an initial turn (i.e. change the intercept path to start at the start of the leg).

        vectorIndex = 0;

        Vec3Math.copy(initialVec, interceptPathStartVec);
        interceptPath.setAsGreatCircle(interceptPathStartVec, course);
        startPath.setAsGreatCircle(interceptPathStartVec, startCourse);

        fallbackInterceptVec = this.calculateFallbackIntercept(
          interceptPathStartVec, interceptPath,
          interceptInfo.circle, effectiveInterceptPathStartVec, effectiveInterceptPathEndVec, effectiveInterceptPathAngularWidth,
          false, true,
          this.vec3Cache[4]
        );
      }
    }

    if (fallbackInterceptVec === undefined) {
      vectorIndex += this.interceptBuilder.build(vectors, vectorIndex, interceptPathStartVec, course, interceptInfo.circle);
    } else {
      vectorIndex += this.directToPointBuilder.build(
        vectors, vectorIndex,
        interceptPathStartVec, startPath, fallbackInterceptVec,
        state.desiredTurnRadius.asUnit(UnitType.METER), undefined,
        FlightPathVectorFlags.Fallback
      );
    }

    if (vectorIndex > 0) {
      const lastVector = vectors[vectorIndex - 1];
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(lastVector);
      state.currentPosition.set(lastVector.endLat, lastVector.endLon);
    }

    vectors.length = vectorIndex;
  }

  private readonly handleInvalidInterceptCache = {
    vec3: [new Float64Array(3), new Float64Array(3), new Float64Array(3)],
    geoCircle: [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)],
    intersection: [new Float64Array(3), new Float64Array(3)]
  };

  /**
   * Checks if a path to intercept cannot be intercepted from a defined starting point and intercept course, and
   * calculates a fallback intercept point if so.
   * @param start The start point.
   * @param interceptPath The great-circle path defining the intercept course.
   * @param pathToInterceptCircle The geo circle defining the path to intercept.
   * @param pathToInterceptStart The start of the path to intercept.
   * @param pathToInterceptEnd The end of the path to intercept.
   * @param pathToInterceptAngularWidth The angular width of the path to intercept, in radians.
   * @param onlyHandleInitialPointPastIntercept Whether to only handle cases where the start point is located beyond
   * the path to intercept as measured along the intercept course.
   * @param forceFallback Whether to treat the case where the path to intercept can be intercepted from the starting
   * point and intercept course as a fallback case. If `true`, the natural intercept point will be returned as the
   * fallback intercept point.
   * @param out The vector to which to write the result.
   * @returns The fallback intercept point, or `undefined` if a fallback is not necessary.
   */
  private calculateFallbackIntercept(
    start: ReadonlyFloat64Array,
    interceptPath: GeoCircle,
    pathToInterceptCircle: GeoCircle,
    pathToInterceptStart: ReadonlyFloat64Array | undefined,
    pathToInterceptEnd: ReadonlyFloat64Array | undefined,
    pathToInterceptAngularWidth: number,
    onlyHandleInitialPointPastIntercept: boolean,
    forceFallback: boolean,
    out: Float64Array
  ): Float64Array | undefined {
    if (pathToInterceptCircle.includes(start)) {
      if (
        pathToInterceptAngularWidth === MathUtils.TWO_PI
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        || FlightPathUtils.isPointAlongArc(pathToInterceptCircle, pathToInterceptStart!, pathToInterceptAngularWidth, start)
      ) {
        // Initial point already lies on the path to intercept.
        return forceFallback ? Vec3Math.copy(start, out) : undefined;
      }
    }

    // Determine if the starting position is "past" the path to intercept.
    let isInitialPosPastPath = false;

    const intersections = this.handleInvalidInterceptCache.intersection;
    const numIntersections = interceptPath.intersection(pathToInterceptCircle, intersections);
    let desiredIntersection;

    if (numIntersections === 2) {
      const nextIntersectionIndex = pathToInterceptCircle.encircles(start) ? 0 : 1;
      const prevIntersectionIndex = 1 - nextIntersectionIndex;

      const nextIntersection = intersections[nextIntersectionIndex];
      const prevIntersection = intersections[prevIntersectionIndex];

      // Define the desired intercept point as the one that requires the shortest distance traveled along the initial
      // path and path to intercept circle from the initial position to some point along the path to intercept. Then,
      // determine if the initial position lies before or after the desired intercept point, relative to the direction
      // of the initial path.

      if (pathToInterceptAngularWidth === MathUtils.TWO_PI && pathToInterceptCircle.isGreatCircle()) {
        isInitialPosPastPath = interceptPath.angleAlong(start, nextIntersection, Math.PI) > MathUtils.HALF_PI + GeoCircle.ANGULAR_TOLERANCE;
      } else {
        const prevIntersectionInitialPathOffset = interceptPath.angleAlong(prevIntersection, start, Math.PI);
        const nextIntersectionInitialPathOffset = interceptPath.angleAlong(start, nextIntersection, Math.PI);
        const prevIntersectionInitialPathDistance = Math.min(prevIntersectionInitialPathOffset, MathUtils.TWO_PI - prevIntersectionInitialPathOffset);
        const nextIntersectionInitialPathDistance = Math.min(nextIntersectionInitialPathOffset, MathUtils.TWO_PI - nextIntersectionInitialPathOffset);

        let prevIntersectionInterceptPathDistance = 0;
        let nextIntersectionInterceptPathDistance = 0;
        if (pathToInterceptStart && pathToInterceptEnd) {
          if (!FlightPathUtils.isPointAlongArc(pathToInterceptCircle, pathToInterceptStart, pathToInterceptAngularWidth, prevIntersection)) {
            const prevIntersectionInterceptPathStartOffset = pathToInterceptCircle.angleAlong(prevIntersection, pathToInterceptStart, Math.PI);
            const prevIntersectionInterceptPathEndOffset = pathToInterceptCircle.angleAlong(prevIntersection, pathToInterceptEnd, Math.PI);

            prevIntersectionInterceptPathDistance = Math.min(
              prevIntersectionInterceptPathStartOffset, MathUtils.TWO_PI - prevIntersectionInterceptPathStartOffset,
              prevIntersectionInterceptPathEndOffset, MathUtils.TWO_PI - prevIntersectionInterceptPathEndOffset,
            );
          }
          if (!FlightPathUtils.isPointAlongArc(pathToInterceptCircle, pathToInterceptStart, pathToInterceptAngularWidth, nextIntersection)) {
            const nextIntersectionInterceptPathStartOffset = pathToInterceptCircle.angleAlong(nextIntersection, pathToInterceptStart, Math.PI);
            const nextIntersectionInterceptPathEndOffset = pathToInterceptCircle.angleAlong(nextIntersection, pathToInterceptEnd, Math.PI);

            nextIntersectionInterceptPathDistance = Math.min(
              nextIntersectionInterceptPathStartOffset, MathUtils.TWO_PI - nextIntersectionInterceptPathStartOffset,
              nextIntersectionInterceptPathEndOffset, MathUtils.TWO_PI - nextIntersectionInterceptPathEndOffset,
            );
          }
        }

        const prevIntersectionTotalDistance = prevIntersectionInitialPathDistance + prevIntersectionInterceptPathDistance;
        const nextIntersectionTotalDistance = nextIntersectionInitialPathDistance + nextIntersectionInterceptPathDistance;

        // Only consider the starting position past the path to intercept if the path to intercept has a defined start
        // and end (i.e. is not a DME circle) OR the distance to one of the two intercept points is greater than pi/2
        // great-arc radians.
        if (
          (pathToInterceptStart !== undefined && pathToInterceptEnd !== undefined)
          || (prevIntersectionTotalDistance >= MathUtils.HALF_PI || nextIntersectionTotalDistance >= MathUtils.HALF_PI)
        ) {
          isInitialPosPastPath = prevIntersectionTotalDistance < nextIntersectionTotalDistance - GeoCircle.ANGULAR_TOLERANCE;
        }
      }

      desiredIntersection = isInitialPosPastPath ? prevIntersection : nextIntersection;
    } else if (numIntersections === 1) {
      const distanceToIntersection = interceptPath.angleAlong(start, intersections[0], Math.PI);
      isInitialPosPastPath = distanceToIntersection < MathUtils.TWO_PI - GeoCircle.ANGULAR_TOLERANCE && distanceToIntersection > Math.PI + GeoCircle.ANGULAR_TOLERANCE;
      desiredIntersection = intersections[0];
    }

    if ((onlyHandleInitialPointPastIntercept && !isInitialPosPastPath)) {
      return undefined;
    }

    let needHandleFallback = isInitialPosPastPath;

    if (!desiredIntersection) {
      // The intercept course does not intersect with the path to intercept circle at all -> define the desired
      // intercept point as the point on the path to intercept circle closest to the start point.

      desiredIntersection = pathToInterceptCircle.closest(start, this.handleInvalidInterceptCache.vec3[0]);
      needHandleFallback = true;
    }

    let fallbackIntercept;

    if (
      (!pathToInterceptStart || !pathToInterceptEnd)
      || FlightPathUtils.isPointAlongArc(pathToInterceptCircle, pathToInterceptStart, pathToInterceptAngularWidth, desiredIntersection)
    ) {
      // The desired intercept point is within the bounds of the path to intercept -> only handle the fallback if we
      // need to (i.e. if the starting point is past the path to intercept, if the starting path does not intersect
      // the path to intercept, or fallback is forced)

      if (needHandleFallback || forceFallback) {
        fallbackIntercept = desiredIntersection;
      }
    } else {
      // The desired intercept point is not within the bounds of the path to intercept -> set the fallback intercept
      // point to the start or end of the path to intercept, whichever is closer to the desired intercept point.

      const angularOffset = pathToInterceptCircle.angleAlong(pathToInterceptStart, desiredIntersection, Math.PI);
      const distanceFromStart = Math.min(angularOffset, MathUtils.TWO_PI - angularOffset);
      const distanceFromEnd = Math.abs(angularOffset - pathToInterceptAngularWidth);

      fallbackIntercept = distanceFromStart <= distanceFromEnd ? pathToInterceptStart : pathToInterceptEnd;
    }

    return fallbackIntercept === undefined ? undefined : Vec3Math.copy(fallbackIntercept, out);
  }

  /**
   * Gets the true intercept course bearing defined by a flight plan leg.
   * @param legs A sequence of leg definitions.
   * @param index The index in the sequence of the leg from which to get the course.
   * @param state The current flight path state.
   * @returns The true intercept course bearing defined by the flight plan leg, or undefined if it could not be
   * determined.
   */
  protected abstract getInterceptCourse(legs: LegDefinition[], index: number, state: FlightPathState): number | undefined;

  /**
   * Gets the geo circle path to intercept defined by a flight plan leg.
   * @param legs A sequence of leg definitions.
   * @param index The index in the sequence of the leg from which to get the course.
   * @param state The current flight path state.
   * @param out The path info object to which to write the result.
   * @returns Information on the geo circle path to intercept defined by the flight plan leg.
   */
  protected abstract getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo;
}

/**
 * Calculates flight path vectors for course to DME legs.
 */
export class CourseToDmeLegCalculator extends CircleInterceptLegCalculator {
  private readonly dmeCircle = new GeoCircle(new Float64Array(3), 0);

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  /** @inheritdoc */
  protected getInterceptCourse(legs: LegDefinition[], index: number): number | undefined {
    const leg = legs[index].leg;
    const dmeFacility = this.facilityCache.get(leg.originIcao);
    return dmeFacility ? this.getLegTrueCourse(leg, dmeFacility) : undefined;
  }

  /** @inheritdoc */
  protected getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo {
    const leg = legs[index].leg;
    const dmeFacility = this.facilityCache.get(leg.originIcao);

    if (dmeFacility) {
      this.dmeCircle.set(dmeFacility, UnitType.METER.convertTo(leg.distance, UnitType.GA_RADIAN));
      out.circle = this.dmeCircle;
      out.start = undefined;
      out.end = undefined;
    } else {
      out.circle = undefined;
      out.start = undefined;
      out.end = undefined;
    }

    return out;
  }
}

/**
 * Calculates flight path vectors for course to radial intercept legs.
 */
export class CourseToRadialLegCalculator extends CircleInterceptLegCalculator {
  private readonly radialCircle = new GeoCircle(new Float64Array(3), 0);

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  /** @inheritdoc */
  protected getInterceptCourse(legs: LegDefinition[], index: number): number | undefined {
    const leg = legs[index].leg;
    const radialFacility = this.facilityCache.get(leg.originIcao);
    return radialFacility ? this.getLegTrueCourse(leg, radialFacility) : undefined;
  }

  /** @inheritdoc */
  protected getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo {
    const leg = legs[index].leg;
    const radialFacility = this.facilityCache.get(leg.originIcao);

    if (radialFacility) {
      const magVar = (ICAO.getFacilityType(radialFacility.icao) === FacilityType.VOR)
        ? -(radialFacility as VorFacility).magneticVariation
        : MagVar.get(radialFacility);

      this.radialCircle.setAsGreatCircle(radialFacility, leg.theta + magVar);
      out.circle = this.radialCircle;
      out.start = radialFacility;
      out.end = undefined;
    } else {
      out.circle = undefined;
      out.start = undefined;
      out.end = undefined;
    }

    return out;
  }
}

/**
 * Calculates flight path vectors for course to intercept legs.
 */
export class CourseToInterceptLegCalculator extends CircleInterceptLegCalculator {
  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  /** @inheritdoc */
  protected getInterceptCourse(legs: LegDefinition[], index: number, state: FlightPathState): number | undefined {
    const leg = legs[index].leg;
    return state.currentPosition ? this.getLegTrueCourse(leg, state.currentPosition) : undefined;
  }

  /** @inheritdoc */
  protected getInterceptPathInfo(legs: LegDefinition[], index: number, state: FlightPathState, out: CircleInterceptPathInfo): CircleInterceptPathInfo {
    return this.predictLegPath(legs, index + 1, out);
  }

  private readonly predictLegPathCache = {
    geoPoint: [new GeoPoint(0, 0)],
    geoCircle: [new GeoCircle(new Float64Array(3), 0)]
  };

  /**
   * Predicts the path of a leg. If a prediction cannot be made, NaN will be written to all fields of the result.
   * @param legs A leg sequence.
   * @param index The index of the leg in the sequence.
   * @param out A GeoCircle to which to write the result.
   * @returns the predicted path of the leg.
   */
  private predictLegPath(legs: LegDefinition[], index: number, out: CircleInterceptPathInfo): CircleInterceptPathInfo {
    out.circle = undefined;
    out.start = undefined;
    out.end = undefined;

    const leg = legs[index]?.leg;
    if (!leg) {
      return out;
    }

    switch (leg.type) {
      case LegType.CF:
        {
          const terminator = this.getTerminatorPosition(leg, leg.fixIcao, this.predictLegPathCache.geoPoint[0]);
          if (terminator) {
            out.circle = this.predictLegPathCache.geoCircle[0].setAsGreatCircle(terminator, this.getLegTrueCourse(leg, terminator));
            out.end = terminator;
          }
          break;
        }
      case LegType.AF:
        {
          const facility = this.facilityCache.get(leg.originIcao);
          if (facility) {
            out.circle = FlightPathUtils.getTurnCircle(
              facility,
              UnitType.METER.convertTo(leg.rho, UnitType.GA_RADIAN),
              leg.turnDirection === LegTurnDirection.Right ? 'right' : 'left',
              this.predictLegPathCache.geoCircle[0]
            );
            out.end = this.facilityCache.get(leg.fixIcao);
          }
          break;
        }
      case LegType.RF:
        {
          const terminator = this.getTerminatorPosition(leg, leg.fixIcao, this.predictLegPathCache.geoPoint[2]);
          const centerFacility = this.facilityCache.get(leg.arcCenterFixIcao);
          if (terminator && centerFacility) {
            out.circle = FlightPathUtils.getTurnCircle(
              centerFacility,
              terminator.distance(centerFacility),
              leg.turnDirection === LegTurnDirection.Right ? 'right' : 'left',
              this.predictLegPathCache.geoCircle[0]
            );
            out.end = terminator;
          }
          break;
        }
      case LegType.FM:
      case LegType.VM:
        {
          const origin = this.facilityCache.get(leg.originIcao);
          if (origin) {
            out.circle = this.predictLegPathCache.geoCircle[0].setAsGreatCircle(origin, this.getLegTrueCourse(leg, origin));
            out.start = origin;
          }
          break;
        }
    }

    return out;
  }
}

/**
 * Calculates flight path vectors for fix to DME legs.
 */
export class FixToDmeLegCalculator extends AbstractFlightPathLegCalculator {
  private readonly vec3Cache = [Vec3Math.create(), Vec3Math.create()];
  private readonly geoPointCache = [new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(Vec3Math.create(), 0), new GeoCircle(Vec3Math.create(), 0)];
  private readonly intersectionCache = [Vec3Math.create(), Vec3Math.create()];

  private readonly greatCircleBuilder = new GreatCircleBuilder();
  private readonly directToPointBuilder = new DirectToPointBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  /** @inheritdoc */
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const pathStartPoint = this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[0]);
    const dmeFacility = this.facilityCache.get(leg.originIcao);

    if (!pathStartPoint || !dmeFacility) {
      vectors.length = vectorIndex;
      state.isFallback = false;
      return;
    }

    const course = this.getLegTrueCourse(leg, pathStartPoint);
    const path = this.geoCircleCache[0].setAsGreatCircle(pathStartPoint, course);
    const dmeCircle = this.geoCircleCache[1].set(dmeFacility, UnitType.METER.convertTo(leg.distance, UnitType.GA_RADIAN));

    const pathStartVec = pathStartPoint.toCartesian(this.vec3Cache[0]);
    const interceptVec = this.vec3Cache[1];

    const intersections = this.intersectionCache;
    const numIntersections = path.intersection(dmeCircle, intersections);
    if (numIntersections === 0) {
      // The path along the leg's defined course does not intercept the DME circle -> define the intercept to be the
      // closest point on the DME circle to the initial fix.

      dmeCircle.closest(pathStartVec, interceptVec);
    } else {
      // The path along the leg's defined course intercepts the DME circle -> choose the first intercept when
      // proceeding along the path from the initial fix.

      const intersectionIndex = (numIntersections === 1 || dmeCircle.encircles(pathStartVec)) ? 0 : 1;
      Vec3Math.copy(intersections[intersectionIndex], interceptVec);
    }

    if (state.isFallback && state.currentPosition !== undefined && state.currentCourse !== undefined) {
      vectorIndex += this.directToPointBuilder.build(
        vectors, vectorIndex,
        state.currentPosition, state.currentCourse,
        interceptVec,
        state.desiredTurnRadius.asUnit(UnitType.METER), undefined,
        FlightPathVectorFlags.Fallback
      );
    } else {
      const startVec = state.currentPosition?.toCartesian(this.vec3Cache[0]) ?? pathStartVec;

      if (GeoPoint.distance(startVec, interceptVec) > GeoCircle.ANGULAR_TOLERANCE) {
        vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, pathStartVec, interceptVec, course);
      }
    }

    if (vectorIndex > 0) {
      const lastVector = vectors[vectorIndex - 1];
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(lastVector);
      (state.currentPosition ??= new GeoPoint(0, 0)).set(lastVector.endLat, lastVector.endLon);
    }

    vectors.length = vectorIndex;
    state.isFallback = false;
  }
}

/**
 * Calculates flight path vectors for track from fix legs.
 */
export class TrackFromFixLegCalculator extends AbstractFlightPathLegCalculator {
  private readonly vec3Cache = [Vec3Math.create(), Vec3Math.create()];
  private readonly geoPointCache = [new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(Vec3Math.create(), 0)];

  private readonly greatCircleBuilder = new GreatCircleBuilder();
  private readonly directToPointBuilder = new DirectToPointBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, false);
  }

  /** @inheritdoc */
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const pathStartPoint = this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[0]);
    if (!pathStartPoint) {
      vectors.length = vectorIndex;
      state.isFallback = false;
      return;
    }

    const course = this.getLegTrueCourse(leg, pathStartPoint);
    const path = this.geoCircleCache[0].setAsGreatCircle(pathStartPoint, course);

    const pathStartVec = pathStartPoint.toCartesian(this.vec3Cache[0]);
    const endVec = path.offsetDistanceAlong(pathStartVec, UnitType.METER.convertTo(leg.distance, UnitType.GA_RADIAN), this.vec3Cache[1], Math.PI);

    if (state.isFallback && state.currentPosition !== undefined && state.currentCourse !== undefined) {
      vectorIndex += this.directToPointBuilder.build(
        vectors, vectorIndex,
        state.currentPosition, state.currentCourse,
        endVec,
        state.desiredTurnRadius.asUnit(UnitType.METER), undefined,
        FlightPathVectorFlags.Fallback
      );
    } else {
      const startVec = state.currentPosition?.toCartesian(this.vec3Cache[0]) ?? pathStartVec;

      if (GeoPoint.distance(startVec, endVec) > GeoCircle.ANGULAR_TOLERANCE) {
        vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, pathStartVec, endVec, course);
      }
    }

    if (vectorIndex > 0) {
      const lastVector = vectors[vectorIndex - 1];
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(lastVector);
      (state.currentPosition ??= new GeoPoint(0, 0)).set(lastVector.endLat, lastVector.endLon);
    }

    vectors.length = vectorIndex;
    state.isFallback = false;
  }
}

/**
 * Calculates flight path vectors for course to fix legs.
 */
export class CourseToFixLegCalculator extends AbstractFlightPathLegCalculator {
  private static readonly FALLBACK_INELIGIBLE_LEG_TYPES = [
    LegType.AF,
    LegType.RF,
    LegType.PI
  ];

  private readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  private readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private readonly geoCircleCache = [
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0)
  ];
  private readonly intersectionCache = [new Float64Array(3), new Float64Array(3)];

  private readonly circleVectorBuilder = new CircleVectorBuilder();
  private readonly greatCircleBuilder = new GreatCircleBuilder();
  private readonly joinGreatCircleToPointBuilder = new JoinGreatCircleToPointBuilder();
  private readonly procTurnBuilder = new ProcedureTurnBuilder();
  private readonly directToPointBuilder = new DirectToPointBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  /** @inheritdoc */
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    const leg = legs[calculateIndex].leg;
    const prevLeg: LegDefinition | undefined = legs[calculateIndex - 1];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const startPoint = state.currentPosition ? this.geoPointCache[0].set(state.currentPosition) : undefined;
    const endPoint = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[1]);

    if (!endPoint) {
      vectors.length = vectorIndex;
      state.isFallback = false;
      return;
    }

    const minTurnRadius = state.desiredTurnRadius.asUnit(UnitType.METER);

    if (state.isFallback && state.currentPosition !== undefined && state.currentCourse !== undefined) {
      // We are in a fallback state -> plot a direct course to the terminator fix

      vectorIndex += this.directToPointBuilder.build(
        vectors, vectorIndex,
        state.currentPosition, state.currentCourse,
        endPoint,
        minTurnRadius, undefined,
        FlightPathVectorFlags.Fallback
      );

      state.isFallback = false;
    } else {
      state.isFallback = false;

      const endCourse = this.getLegTrueCourse(leg, endPoint);
      const endVec = endPoint.toCartesian(this.vec3Cache[1]);
      const endPath = this.geoCircleCache[1].setAsGreatCircle(endPoint, endCourse);

      if (!startPoint || (prevLeg && (prevLeg.leg.type === LegType.FM || prevLeg.leg.type === LegType.VM))) {
        // Begins at a discontinuity OR previous leg is a manual termination leg.
        // Default to a track with start arbitrarily placed 5 NM from the terminator fix.
        const midPoint = endPath.offsetDistanceAlong(endVec, UnitType.NMILE.convertTo(-5, UnitType.GA_RADIAN), this.geoPointCache[2]);
        vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, midPoint, endPoint);
      } else {
        const startVec = startPoint.toCartesian(this.vec3Cache[0]);

        const currentCourse = state.currentCourse ?? startPoint.bearingTo(endPoint);

        const startPath = this.geoCircleCache[0].setAsGreatCircle(startPoint, currentCourse);
        const startToEndPath = this.geoCircleCache[3].setAsGreatCircle(startVec, endVec);
        const isStartEqualToEnd = startPoint.equals(endPoint);

        // A great circle defining the threshold of the terminator fix - everything to the LEFT of (i.e. encircled by)
        // this great circle is past the terminator fix as projected along the end path.
        const threshold = this.geoCircleCache[2].setAsGreatCircle(endPath.center, endVec);

        if (
          !leg.flyOver
          && !CourseToFixLegCalculator.FALLBACK_INELIGIBLE_LEG_TYPES.includes(legs[calculateIndex + 1]?.leg.type)
          && threshold.encircles(startVec, false)
        ) {
          // The start point is past the terminator threshold -> end the leg at the start point and set a fallback state

          (state.currentPosition ??= new GeoPoint(0, 0)).set(startPoint);
          state.currentCourse ??= currentCourse;
          state.isFallback = true;
        } else {
          const pathAngleDiff = Math.acos(MathUtils.clamp(Vec3Math.dot(startPath.center, endPath.center), -1, 1));
          if (pathAngleDiff >= Math.PI - GeoCircle.ANGULAR_TOLERANCE) {
            // The start and end paths are anti-parallel, which means we need to execute a procedure turn to do a 180.

            // Favor right turn unless we are explicitly told to turn left.
            const desiredTurnDirection = leg.turnDirection === LegTurnDirection.Left ? 'left' : 'right';
            vectorIndex += this.procTurnBuilder.build(
              vectors, vectorIndex,
              startVec, startPath, endVec, endPath,
              currentCourse + 45 * (desiredTurnDirection === 'left' ? -1 : 1),
              minTurnRadius, desiredTurnDirection,
              currentCourse, endCourse
            );
          } else if (
            endPath.angleAlong(startVec, endVec, Math.PI, GeoCircle.ANGULAR_TOLERANCE) < Math.PI + GeoCircle.ANGULAR_TOLERANCE
            && (
              pathAngleDiff <= GeoCircle.ANGULAR_TOLERANCE
              || (!isStartEqualToEnd
                && (Vec3Math.dot(startToEndPath.center, endPath.center) >= 0.996194698 // 5 degrees
                  || (prevLeg?.calculated?.flightPath.length && endPath.includes(startVec, UnitType.METER.convertTo(10, UnitType.GA_RADIAN)))
                )
              )
            )
          ) {
            /*
            * The start and end paths are parallel, so we can just connect the start and end with a track.
            *
            * OR the start point lies on the final course path (within a generous tolerance) and the previous leg has at
            * least one calculated vector. In this case we will simply create a track from the start to end and let turn
            * anticipation handle the initial turn into the final course.
            */

            if (!isStartEqualToEnd) {
              vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, startPoint, endPoint);
            }
          } else {
            const desiredTurnDirection = leg.turnDirection === LegTurnDirection.Left ? 'left'
              : leg.turnDirection === LegTurnDirection.Right ? 'right'
                : undefined;

            vectorIndex += this.joinGreatCircleToPointBuilder.build(
              vectors, vectorIndex,
              startVec, startPath,
              endVec, endPath,
              desiredTurnDirection, minTurnRadius
            );

            const lastVector = vectors[vectorIndex - 1];

            if (
              lastVector !== undefined
              && Math.abs(FlightPathUtils.getVectorFinalCourse(lastVector) - endCourse) > 1
              && !leg.flyOver
              && !CourseToFixLegCalculator.FALLBACK_INELIGIBLE_LEG_TYPES.includes(legs[calculateIndex + 1]?.leg.type)
            ) {
              // We are allowed to use a fallback path which does not end at the defined terminator fix and a fallback
              // direct course was calculated -> check if the direct course path crosses the terminator threshold at
              // any point and if so, end the path where it crosses and set a fallback state.

              const minTurnRadiusRad = UnitType.METER.convertTo(minTurnRadius, UnitType.GA_RADIAN);

              let startTurnCircle: GeoCircle | undefined;
              let startTurnEnd: Float64Array | undefined;

              /*
               * The direct course builder can produce 0 to 2 vectors: an optional starting turn toward the target
               * point and an optional great-circle path connecting the turn to the target point.
               *
               * We are not concerned with the case with zero vectors, because this means the start and end points are
               * coincident.
               *
               * We are also not concerned with the case of the single great-circle vector, because this means that
               * either the starting point and the entire path are behind the terminator threshold, or both are past
               * the threshold, which would have been handled in another case above.
               *
               * Thus, we are left with only the cases where there is a single turn vector or a turn vector followed
               * by a great-circle vector.
               */

              const isLastVectorGreatCircle = FlightPathUtils.isVectorGreatCircle(lastVector);

              if (isLastVectorGreatCircle && vectors[vectorIndex - 2] !== undefined) {
                const startTurnVector = vectors[vectorIndex - 2];
                startTurnCircle = FlightPathUtils.setGeoCircleFromVector(startTurnVector, this.geoCircleCache[3]);
                startTurnEnd = GeoPoint.sphericalToCartesian(startTurnVector.endLat, startTurnVector.endLon, this.vec3Cache[2]);
              } else if (!isLastVectorGreatCircle) {
                // If the direct course calculation produced only a single turn vector, it possibly reduced the radius
                // of the starting turn below the minimum radius in order to build a valid path to the terminator.
                // We always want the starting turn to respect the minimum turn radius, so we will define it ourselves.

                startTurnCircle = FlightPathUtils.getTurnCircleStartingFromPath(
                  startVec, startPath,
                  minTurnRadiusRad, desiredTurnDirection ?? (startPath.encircles(endVec) ? 'left' : 'right'),
                  this.geoCircleCache[3]
                );

                // If the direct course turn radius was reduced, then the terminator fix lies inside the starting turn
                // circle of minimum radius. Therefore, the turn technically never ends because there is no point on
                // the turn circle that either includes the terminator fix or is tangent to a great-circle path which
                // includes the terminator fix.
                if (Math.min(lastVector.radius, Math.PI - lastVector.radius) >= minTurnRadiusRad - GeoCircle.ANGULAR_TOLERANCE) {
                  startTurnEnd = GeoPoint.sphericalToCartesian(lastVector.endLat, lastVector.endLon, this.vec3Cache[2]);
                }
              }

              if (startTurnCircle !== undefined) {
                const intersections = this.intersectionCache;
                const intersectionCount = threshold.intersection(startTurnCircle, intersections);
                if (intersectionCount === 1) {
                  // The starting turn is tangent to the threshold, which means it is either entirely past the
                  // threshold or entirely behind it.
                  if (threshold.encircles(FlightPathUtils.getTurnCenterFromCircle(startTurnCircle, this.vec3Cache[2]))) {
                    // The entire starting turn lies beyond the threshold, which means the starting point must also
                    // lie beyond the threshold -> end the leg immediately with no vectors and set the fallback state.
                    vectorIndex = 0;
                    (state.currentPosition ??= new GeoPoint(0, 0)).set(startPoint);
                    state.currentCourse ??= currentCourse;
                    state.isFallback = true;
                  }
                } else if (startTurnEnd === undefined || intersectionCount === 2) {
                  // If we are in this case, then the starting point is guaranteed to be behind the terminator
                  // threshold. Therefore, the next intersection of the starting turn circle with the threshold will
                  // take the path past the threshold.

                  const thresholdCrossing = intersections[0];

                  const thresholdCrossingAngle = startTurnCircle.angleAlong(startVec, thresholdCrossing, Math.PI, GeoCircle.ANGULAR_TOLERANCE);

                  if (
                    startTurnEnd === undefined
                    || startTurnCircle.angleAlong(startVec, startTurnEnd, Math.PI, GeoCircle.ANGULAR_TOLERANCE) > thresholdCrossingAngle + GeoCircle.ANGULAR_TOLERANCE
                  ) {
                    // The starting turn crosses the terminator threshold before the end of the turn -> end the turn
                    // at the crossing point and set the fallback state.

                    vectorIndex = 0;

                    vectorIndex += this.circleVectorBuilder.build(
                      vectors, vectorIndex,
                      startTurnCircle, startVec, thresholdCrossing,
                      FlightPathVectorFlags.TurnToCourse | FlightPathVectorFlags.Fallback
                    );

                    state.isFallback = true;
                  }
                }
              }
            }
          }
        }
      }
    }

    const lastVector = vectors[vectorIndex - 1];
    if (lastVector !== undefined) {
      (state.currentPosition ??= new GeoPoint(0, 0)).set(lastVector.endLat, lastVector.endLon);
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(vectors[vectorIndex - 1]);
    }

    vectors.length = vectorIndex;
  }
}

/**
 * Calculates flight path vectors for procedure turn legs.
 */
export class ProcedureTurnLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];

  protected readonly greatCircleBuilder = new GreatCircleBuilder();
  protected readonly joinGreatCircleToPointBuilder = new JoinGreatCircleToPointBuilder();
  protected readonly procTurnBuilder = new ProcedureTurnBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    state.isFallback = false;

    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const origin = this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[0]);

    if (!origin) {
      vectors.length = vectorIndex;
      return;
    }

    // If current lat/lon is not defined, then set it to the origin's location, simulating an IF at the leg origin.
    state.currentPosition ??= origin.copy();

    const nextLeg: FlightPlanLeg | undefined = legs[calculateIndex + 1]?.leg;

    if (!origin.equals(state.currentPosition)) {
      vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, state.currentPosition, origin, state.currentCourse);
      state.currentCourse = origin.bearingFrom(state.currentPosition);
      state.currentPosition.set(origin);
    }

    if (!nextLeg) {
      vectors.length = vectorIndex;
      return;
    }

    const nextLegTerminatorFix = this.getTerminatorPosition(nextLeg, nextLeg.fixIcao, this.geoPointCache[1]);

    if (!nextLegTerminatorFix) {
      vectors.length = vectorIndex;
      return;
    }

    const inboundCourse = this.predictLegFinalTrueCourse(legs, calculateIndex + 1, nextLegTerminatorFix) ?? 0;
    const outboundCourse = NavMath.normalizeHeading(inboundCourse + 180);
    const turnInitialCourse = leg.trueDegrees ? leg.course : MagVar.magneticToTrue(leg.course, origin);

    if (outboundCourse === turnInitialCourse) {
      vectors.length = vectorIndex;
      return;
    }

    // must intercept the next leg at least 1 NM from the terminator fix
    const inboundPathEndpoint = nextLegTerminatorFix.offset(inboundCourse + 180, UnitType.NMILE.convertTo(1, UnitType.GA_RADIAN));

    const outboundPath = this.geoCircleCache[0].setAsGreatCircle(origin, outboundCourse);
    const inboundPath = this.geoCircleCache[1].setAsGreatCircle(inboundPathEndpoint, inboundCourse);

    const desiredTurnDirection = leg.turnDirection === LegTurnDirection.Left ? 'left'
      : leg.turnDirection === LegTurnDirection.Right ? 'right'
        : undefined;

    vectorIndex += this.procTurnBuilder.build(
      vectors, vectorIndex,
      origin, outboundPath,
      inboundPathEndpoint, inboundPath,
      turnInitialCourse,
      state.desiredTurnRadius.asUnit(UnitType.METER), desiredTurnDirection,
      outboundCourse, inboundCourse
    );

    // addVectorsForProcTurn() is guaranteed to add at least one vector.
    const lastVector = vectors[vectorIndex - 1];

    state.currentPosition.set(lastVector.endLat, lastVector.endLon);
    state.currentCourse = FlightPathUtils.getVectorFinalCourse(lastVector);

    vectors.length = vectorIndex;
  }

  /**
   * Predicts the final true course of a leg at its terminator fix.
   * @param legs A leg sequence.
   * @param index The index of the leg in the sequence.
   * @param terminator The location of the leg's terminator fix.
   * @returns the predicted final course of a leg at its terminator fix, or undefined if a prediction cannot be made.
   */
  private predictLegFinalTrueCourse(legs: LegDefinition[], index: number, terminator: GeoPointInterface): number | undefined {
    const leg = legs[index]?.leg;
    if (!leg) {
      return undefined;
    }

    switch (leg.type) {
      case LegType.IF:
        return this.predictLegInitialTrueCourse(legs, index + 1, terminator);
      case LegType.CF:
        return this.getLegTrueCourse(leg, terminator);
      default:
        return undefined;
    }
  }

  /**
   * Predicts the initial true course of a leg at its origin fix.
   * @param legs A leg sequence.
   * @param index The index of the leg in the sequence.
   * @param origin The location of the leg's origin.
   * @returns the predicted final course of a leg at its terminator fix, or undefined if a prediction cannot be made.
   */
  private predictLegInitialTrueCourse(legs: LegDefinition[], index: number, origin: GeoPointInterface): number | undefined {
    const leg = legs[index]?.leg;
    if (!leg) {
      return undefined;
    }

    try {
      switch (leg.type) {
        case LegType.IF:
        case LegType.TF:
        case LegType.DF:
        case LegType.CF:
          {
            const terminator = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[2]);
            return terminator ? origin.bearingTo(terminator) : undefined;
          }
        case LegType.CD:
        case LegType.VD:
        case LegType.CR:
        case LegType.VR:
        case LegType.FC:
        case LegType.FD:
          return this.getLegTrueCourse(leg, origin);
        case LegType.FA:
        case LegType.CA:
        case LegType.VA:
        case LegType.FM:
        case LegType.VM:
        case LegType.CI:
        case LegType.VI:
          return leg.trueDegrees ? leg.course : MagVar.magneticToTrue(leg.course, origin);
        default:
          return undefined;
      }
    } catch (e) {
      return undefined;
    }
  }
}

/**
 * Calculates flight path vectors for course to manual legs.
 */
export class CourseToManualLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];

  protected readonly greatCircleBuilder = new GreatCircleBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, false);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    state.isFallback = false;

    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const startPoint = state.currentPosition ?? this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[0]);

    if (!startPoint) {
      vectors.length = vectorIndex;
      return;
    }

    const course = leg.trueDegrees ? leg.course : MagVar.magneticToTrue(leg.course, startPoint);
    const normalizedEnd = startPoint.offset(course, UnitType.NMILE.convertTo(1, UnitType.GA_RADIAN), this.geoPointCache[1]);

    vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, startPoint, normalizedEnd);

    state.currentPosition = undefined;
    state.currentCourse = undefined;

    vectors.length = vectorIndex;
  }
}

/**
 * Calculates flight path vectors for course to altitude legs.
 */
export class CourseToAltitudeLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly vec3Cache = [new Float64Array(3), new Float64Array(3)];
  protected readonly geoPointCache = [new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  protected readonly greatCircleBuilder = new GreatCircleBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, false);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    state.isFallback = false;

    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    if (!state.currentPosition) {
      const fixPosition = this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[0]);
      if (fixPosition) {
        state.currentPosition = new GeoPoint(fixPosition.lat, fixPosition.lon);
      }
    }

    if (!state.currentPosition) {
      vectors.length = vectorIndex;
      return;
    }

    const course = this.getLegTrueCourse(leg, state.currentPosition);
    const path = this.geoCircleCache[0].setAsGreatCircle(state.currentPosition, course);

    const originVec = state.currentPosition.toCartesian(this.vec3Cache[0]);
    const climbStartVec = activeLegIndex === calculateIndex
      ? path.closest(state.planePosition, this.vec3Cache[1])
      : originVec;
    const originToClimbStartDistance = (path.distanceAlong(originVec, climbStartVec) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // -pi to +pi

    const targetFeet = UnitType.METER.convertTo(leg.altitude1, UnitType.FOOT);
    const deltaAltitude = Math.max(0, targetFeet - state.planeAltitude.asUnit(UnitType.FOOT));
    const distanceRemaining = UnitType.NMILE.convertTo(
      (deltaAltitude / state.planeClimbRate.asUnit(UnitType.FPM)) / 60 * state.planeSpeed.asUnit(UnitType.KNOT),
      UnitType.GA_RADIAN
    );

    const offsetDistance = Math.max(UnitType.FOOT.convertTo(100, UnitType.GA_RADIAN), originToClimbStartDistance + distanceRemaining);
    const legEndVec = path.offsetDistanceAlong(originVec, offsetDistance, this.vec3Cache[1]);

    vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, originVec, path, legEndVec);

    state.currentPosition.setFromCartesian(legEndVec);
    state.currentCourse = path.bearingAt(legEndVec);

    vectors.length = vectorIndex;
  }
}

/**
 * Calculates flight path vectors for hold legs.
 */
export class HoldLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];

  protected readonly greatCircleBuilder = new GreatCircleBuilder();
  protected readonly circleVectorBuilder = new CircleVectorBuilder();
  protected readonly turnToCourseBuilder = new TurnToCourseBuilder();
  protected readonly joinGreatCircleToPointBuilder = new JoinGreatCircleToPointBuilder();
  protected readonly procTurnBuilder = new ProcedureTurnBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected calculateVectors(
    legs: LegDefinition[],
    calculateIndex: number,
    activeLegIndex: number,
    state: FlightPathState
  ): void {
    state.isFallback = false;

    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const calcs = legs[calculateIndex].calculated!;
    const vectors = calcs.flightPath;
    const ingress = calcs.ingress;

    let vectorIndex = 0, ingressVectorIndex = 0;

    const holdPos = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[0]);

    if (!holdPos) {
      vectors.length = 0;
      ingress.length = 0;
      calcs.ingressJoinIndex = -1;
      return;
    }

    // If current lat/lon is not defined, then set it to the facility's location, simulating an IF at the hold's
    // facility.
    state.currentPosition ??= holdPos.copy();

    if (!state.currentPosition.equals(holdPos)) {
      ingressVectorIndex += this.greatCircleBuilder.build(ingress, ingressVectorIndex, state.currentPosition, holdPos, state.currentCourse);
      state.currentCourse = holdPos.bearingFrom(state.currentPosition);
    }

    const course = this.getLegTrueCourse(leg, holdPos);
    const distance = leg.distanceMinutes
      ? UnitType.NMILE.convertTo(leg.distance * (state.planeSpeed.asUnit(UnitType.KNOT) / 60), UnitType.GA_RADIAN)
      : UnitType.METER.convertTo(leg.distance, UnitType.GA_RADIAN);

    const turnDirection = leg.turnDirection === LegTurnDirection.Right ? 'right' : 'left';
    const turnDirectionSign = turnDirection === 'left' ? -1 : 1;
    const turnRadiusMeters = state.desiredTurnRadius.asUnit(UnitType.METER);
    const inboundPath = this.geoCircleCache[0].setAsGreatCircle(holdPos, course);

    const outboundTurnCenterCourse = NavMath.normalizeHeading(course + 90 * turnDirectionSign);

    const turnRadiusRad = state.desiredTurnRadius.asUnit(UnitType.GA_RADIAN);
    const outboundTurnCenter = holdPos.offset(outboundTurnCenterCourse, turnRadiusRad, this.geoPointCache[1]);
    const outboundTurnEnd = holdPos.offset(outboundTurnCenterCourse, turnRadiusRad * 2, this.geoPointCache[2]);

    const oppositeCourse = NavMath.normalizeHeading(course + 180);
    const outboundEnd = outboundTurnEnd.offset(oppositeCourse, distance, this.geoPointCache[3]);

    // Handle hold entry

    state.currentPosition.set(holdPos);
    state.currentCourse ??= course;

    const normalizedEntryCourse = ((state.currentCourse - course) + 540) % 360 - 180; // -180 to +180
    const directionalEntryCourse = normalizedEntryCourse * turnDirectionSign;

    const isDirectEntry = directionalEntryCourse >= -70 && directionalEntryCourse <= 135;
    const skipRacetrack = leg.type === LegType.HF && !isDirectEntry;

    if (isDirectEntry) {
      // direct entry
      if (directionalEntryCourse > 0) {
        // The entry course is toward the outbound leg, so we just intercept the outbound leg directly, bypassing
        // the turn from the inbound to outbound leg.

        ingressVectorIndex += this.joinGreatCircleToPointBuilder.build(
          ingress, ingressVectorIndex,
          state.currentPosition, this.geoCircleCache[1].setAsGreatCircle(state.currentPosition, state.currentCourse),
          outboundEnd, this.geoCircleCache[2].setAsGreatCircle(outboundTurnEnd, oppositeCourse),
          turnDirection, turnRadiusMeters,
          false, true,
          undefined,
          FlightPathVectorFlags.HoldDirectEntry
        );

        calcs.ingressJoinIndex = 1;
      } else if (BitFlags.isAny(ingress[0]?.flags ?? 0, FlightPathVectorFlags.AnticipatedTurn)) {
        // Don't erase turn anticipation for direct entries
        ingressVectorIndex = ingress.length;
      }
    } else if (directionalEntryCourse > 110) {
      // teardrop entry
      if (directionalEntryCourse > 135) {
        // need to make initial turn to get a 45-degree outbound leg
        const outboundCourse = course + 135 * turnDirectionSign;
        const numTurnVectorsAdded = this.turnToCourseBuilder.build(
          ingress, ingressVectorIndex,
          holdPos, turnRadiusMeters, turnDirection === 'left' ? 'right' : 'left',
          state.currentCourse, outboundCourse,
          FlightPathVectorFlags.HoldTeardropEntry | FlightPathVectorFlags.TurnToCourse
        );

        if (numTurnVectorsAdded > 0) {
          ingressVectorIndex += numTurnVectorsAdded;
          const turnVector = ingress[ingressVectorIndex - 1];
          state.currentPosition.set(turnVector.endLat, turnVector.endLon);
          state.currentCourse = FlightPathUtils.getVectorFinalCourse(turnVector);
        }
      }

      ingressVectorIndex += this.joinGreatCircleToPointBuilder.build(
        ingress, ingressVectorIndex,
        state.currentPosition, this.geoCircleCache[1].setAsGreatCircle(state.currentPosition, state.currentCourse),
        holdPos, inboundPath,
        turnDirection, turnRadiusMeters,
        true, true,
        undefined,
        FlightPathVectorFlags.HoldTeardropEntry
      );

      if (skipRacetrack) {
        // If we skip the racetrack, remove the part of the hold entry that is coincident with the inbound leg
        const lastEntryVector = ingress[ingressVectorIndex - 1];
        if (lastEntryVector && FlightPathUtils.isVectorGreatCircle(lastEntryVector) && holdPos.equals(lastEntryVector.endLat, lastEntryVector.endLon)) {
          if (UnitType.METER.convertTo(lastEntryVector.distance, UnitType.GA_RADIAN) > distance + GeoPoint.EQUALITY_TOLERANCE) {
            const lastEntryVectorEnd = holdPos.offset(course + 180, distance, this.geoPointCache[1]);
            lastEntryVector.endLat = lastEntryVectorEnd.lat;
            lastEntryVector.endLon = lastEntryVectorEnd.lon;
            lastEntryVector.distance -= UnitType.GA_RADIAN.convertTo(distance, UnitType.METER);
          } else {
            ingressVectorIndex--;
          }
        }
      }

      calcs.ingressJoinIndex = 0;
    } else if (directionalEntryCourse < -70) {
      // parallel entry
      const parallelCourse = course + 180;
      const numTurnVectorsAdded = this.turnToCourseBuilder.build(
        ingress, ingressVectorIndex,
        holdPos, turnRadiusMeters, turnDirection === 'left' ? 'right' : 'left',
        state.currentCourse, parallelCourse,
        FlightPathVectorFlags.HoldParallelEntry | FlightPathVectorFlags.TurnToCourse
      );

      if (numTurnVectorsAdded > 0) {
        ingressVectorIndex += numTurnVectorsAdded;
        const turnVector = ingress[ingressVectorIndex - 1];
        state.currentPosition.set(turnVector.endLat, turnVector.endLon);
        state.currentCourse = FlightPathUtils.getVectorFinalCourse(turnVector);
      }

      ingressVectorIndex += this.procTurnBuilder.build(
        ingress, ingressVectorIndex,
        state.currentPosition, this.geoCircleCache[1].setAsGreatCircle(state.currentPosition, state.currentCourse),
        holdPos, inboundPath,
        course + 135 * turnDirectionSign,
        turnRadiusMeters, turnDirection === 'left' ? 'right' : 'left',
        state.currentCourse, course,
        FlightPathVectorFlags.HoldParallelEntry
      );

      calcs.ingressJoinIndex = 0;
    }

    ingress.length = ingressVectorIndex;
    if (ingress.length === 0) {
      calcs.ingressJoinIndex = -1;
    }

    let inboundStart;
    if (skipRacetrack) {
      inboundStart = holdPos.offset(course + 180, distance, this.geoPointCache[1]);
    } else {
      vectorIndex += this.circleVectorBuilder.build(
        vectors, vectorIndex,
        turnDirection, turnRadiusMeters,
        outboundTurnCenter, holdPos, outboundTurnEnd,
        FlightPathVectorFlags.TurnToCourse
      );

      vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, outboundTurnEnd, outboundEnd, undefined, FlightPathVectorFlags.HoldOutboundLeg);

      const inboundTurnCenterCourse = NavMath.normalizeHeading(oppositeCourse + 90 * turnDirectionSign);

      const inboundTurnCenter = outboundEnd.offset(inboundTurnCenterCourse, turnRadiusRad, this.geoPointCache[1]);
      const inboundTurnEnd = outboundEnd.offset(inboundTurnCenterCourse, turnRadiusRad * 2, this.geoPointCache[2]);

      vectorIndex += this.circleVectorBuilder.build(
        vectors, vectorIndex,
        turnDirection, turnRadiusMeters,
        inboundTurnCenter, outboundEnd, inboundTurnEnd,
        FlightPathVectorFlags.TurnToCourse
      );

      inboundStart = inboundTurnEnd;
    }

    vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, inboundStart, holdPos, undefined, FlightPathVectorFlags.HoldInboundLeg);

    state.currentPosition.set(holdPos);
    state.currentCourse = course;

    vectors.length = vectorIndex;
  }
}