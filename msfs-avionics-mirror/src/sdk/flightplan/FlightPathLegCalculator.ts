import { BitFlags, GeoCircle, GeoPoint, GeoPointInterface, GeoPointReadOnly, LatLonInterface, MagVar, NavMath, NumberUnitReadOnly, UnitFamily, UnitType, Vec3Math } from '..';
import { Facility, FacilityType, FlightPlanLeg, ICAO, LegTurnDirection, LegType, VorFacility } from '../navigation';
import { FlightPathUtils } from './FlightPathUtils';
import {
  CircleVectorBuilder, CircleInterceptBuilder, GreatCircleBuilder, JoinGreatCircleToPointBuilder, ProcedureTurnBuilder,
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
      egress: []
    };

    const vectors = calcs.flightPath;
    if (this.skipWhenActive && activeLegIndex === calculateIndex && this.shouldSkipWhenActive(legs, calculateIndex, activeLegIndex, state)) {
      state.currentPosition = FlightPathUtils.getLegFinalPosition(calcs, state.currentPosition ?? new GeoPoint(0, 0));
      state.currentCourse = FlightPathUtils.getLegFinalCourse(calcs) ?? state.currentCourse;
      return calcs;
    }

    try {
      this.calculateVectors(legs, calculateIndex, activeLegIndex, state);
      resolveIngressToEgress && this.resolveIngressToEgress(calcs);
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
  // eslint-disable-next-line jsdoc/require-jsdoc
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
  }
}

/**
 * Calculates flight path vectors for track to fix legs.
 */
export class TrackToFixLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly geoPointCache = [new GeoPoint(0, 0)];

  protected readonly vectorBuilder = new GreatCircleBuilder();

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
    const prevLeg = legs[calculateIndex - 1]?.leg;
    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const terminatorPos = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[0]);

    if (!terminatorPos) {
      vectors.length = 0;
      return;
    }

    state.currentPosition ??= terminatorPos.copy();
    const distance = state.currentPosition.distance(terminatorPos);

    if ((!prevLeg || (prevLeg.type !== LegType.FM && prevLeg.type !== LegType.VM)) && distance > GeoPoint.EQUALITY_TOLERANCE) {
      vectorIndex += this.vectorBuilder.build(vectors, vectorIndex, state.currentPosition, terminatorPos, state.currentCourse);
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(vectors[vectorIndex - 1]);
    }

    state.currentPosition.set(terminatorPos);

    vectors.length = vectorIndex;
  }
}

/**
 * Calculates flight path vectors for direct to fix legs.
 */
export class DirectToFixLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  protected readonly greatCircleVectorBuilder = new GreatCircleBuilder();
  protected readonly circleVectorBuilder = new CircleVectorBuilder();

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

    const distanceToTerminator = state.currentPosition.distance(terminatorPos);
    if (distanceToTerminator < GeoPoint.EQUALITY_TOLERANCE) {
      state.currentPosition.set(terminatorPos);
      vectors.length = 0;
      return;
    } else if (Math.abs(distanceToTerminator - Math.PI) < GeoPoint.EQUALITY_TOLERANCE) {
      // terminator is antipodal to current position
      const path = this.geoCircleCache[0].setAsGreatCircle(state.currentPosition, initialCourse);
      vectorIndex += this.greatCircleVectorBuilder.build(
        vectors, vectorIndex,
        state.currentPosition,
        path, terminatorPos
      );
      state.currentCourse = path.bearingAt(terminatorPos, Math.PI);
      state.currentPosition.set(terminatorPos);

      vectors.length = vectorIndex;
      return;
    }

    const startVec = startPoint.toCartesian(this.vec3Cache[0]);
    const terminatorVec = terminatorPos.toCartesian(this.vec3Cache[1]);

    const startPath = this.geoCircleCache[0].setAsGreatCircle(startPoint, initialCourse);
    state.currentCourse = initialCourse;

    const startPathEncirclesTerminator = startPath.encircles(terminatorVec);
    const startPathIncludesTerminator = startPath.includes(terminatorVec);

    const turnDirection = leg.turnDirection === LegTurnDirection.Left ? 'left'
      : leg.turnDirection === LegTurnDirection.Right ? 'right'
        : startPathEncirclesTerminator && !startPathIncludesTerminator ? 'left' : 'right';
    const startToTurnCenterPath = this.geoCircleCache[0].setAsGreatCircle(startPoint, initialCourse + (turnDirection === 'left' ? -90 : 90));

    let maxTurnRadiusRad;
    if (!startPathIncludesTerminator && startPathEncirclesTerminator === (turnDirection === 'left')) {
      // terminator lies on the same side as the turn, which means there is the possibility that the turn circle can
      // encircle the terminator, which would make defining a great circle intersecting the terminator fix and also
      // tangent to the turn circle impossible. Therefore, we compute the maximum allowed turn radius, defined as the
      // radius such that the terminator fix lies exactly on the turn circle.

      const startToTerminatorPathNormal = GeoCircle.getGreatCircleNormal(startVec, terminatorVec, this.vec3Cache[2]);
      // the angle between the great-circle path from the start point to the turn center and the path from the start
      // point to the terminator fix
      const theta = Math.acos(Vec3Math.dot(startToTurnCenterPath.center, startToTerminatorPathNormal));
      maxTurnRadiusRad = Math.atan(Math.sin(distanceToTerminator) / (Math.cos(theta) * (1 + Math.cos(distanceToTerminator))));
    } else {
      // terminator lies on the starting path or on the opposite side as the turn. Either way, no turn can encircle the
      // terminator, and so there is no maximum turn radius.
      maxTurnRadiusRad = Math.PI / 2;
    }

    const turnRadiusRad = Math.min(maxTurnRadiusRad, state.desiredTurnRadius.asUnit(UnitType.GA_RADIAN));

    const turnCenterVec = startToTurnCenterPath.offsetDistanceAlong(startVec, turnRadiusRad, this.vec3Cache[2]);
    const turnCenterPoint = this.geoPointCache[2].setFromCartesian(turnCenterVec);

    // Find the great-circle path from the terminator fix that is tangent to the turn circle. There are guaranteed to
    // be two such paths. We choose between the two based on the initial turn direction.

    const turnCenterToTerminatorDistance = Math.acos(Vec3Math.dot(turnCenterVec, terminatorVec));
    // the angle between the the great-circle path from the terminator fix to the turn center and the two
    // great-circle paths from the terminator fix that are tangent to the turn circle.
    const alpha = Math.asin(Math.min(1, Math.sin(turnRadiusRad) / Math.sin(turnCenterToTerminatorDistance)));
    const terminatorFixBearingToTurnCenter = terminatorPos.bearingTo(turnCenterPoint);
    const finalPathCourse = NavMath.normalizeHeading(terminatorFixBearingToTurnCenter + alpha * Avionics.Utils.RAD2DEG * (turnDirection === 'left' ? -1 : 1) + 180);
    const finalPath = this.geoCircleCache[0].setAsGreatCircle(terminatorPos, finalPathCourse);
    const turnEndPoint = finalPath.closest(turnCenterPoint, this.geoPointCache[3]);

    if (!turnEndPoint.equals(startPoint)) {
      vectorIndex += this.circleVectorBuilder.build(
        vectors,
        vectorIndex,
        turnDirection, UnitType.GA_RADIAN.convertTo(turnRadiusRad, UnitType.METER),
        turnCenterPoint, startPoint, turnEndPoint,
        FlightPathVectorFlags.TurnToCourse
      );
    }

    state.currentPosition.set(turnEndPoint);
    state.currentCourse = finalPathCourse;

    if (!state.currentPosition.equals(terminatorPos)) {
      vectorIndex += this.greatCircleVectorBuilder.build(vectors, vectorIndex, state.currentPosition, terminatorPos);
    }

    state.currentPosition.set(terminatorPos);

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

  // eslint-disable-next-line jsdoc/require-jsdoc
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

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getTurnCenter(leg: FlightPlanLeg): LatLonInterface | undefined {
    return this.facilityCache.get(leg.arcCenterFixIcao);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getTurnRadius(leg: FlightPlanLeg, center: LatLonInterface): number | undefined {
    return this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[2])?.distance(center);
  }
}

/**
 * Calculates flight path vectors for arc to fix legs.
 */
export class ArcToFixLegCalculator extends TurnToFixLegCalculator {
  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getTurnCenter(leg: FlightPlanLeg): LatLonInterface | undefined {
    return this.facilityCache.get(leg.originIcao);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
  protected getTurnRadius(leg: FlightPlanLeg, center: LatLonInterface): number | undefined {
    return UnitType.METER.convertTo(leg.rho, UnitType.GA_RADIAN);
  }
}

/**
 * Calculates flight path vectors for legs which define a great-circle path terminating at an intercept with another
 * geo circle.
 */
export abstract class CircleInterceptLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly vec3Cache = [new Float64Array(3), new Float64Array(3)];
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  protected readonly turnBuilder = new TurnToCourseBuilder();
  protected readonly interceptBuilder = new CircleInterceptBuilder();

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   * @param includeInitialTurn Whether this calculator should calculate an initial turn toward the intercept course.
   */
  constructor(facilityCache: Map<string, Facility>, protected readonly includeInitialTurn: boolean) {
    super(facilityCache, includeInitialTurn);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
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

    const course = this.getInterceptCourse(legs, calculateIndex, state);
    const circleToIntercept = this.getCircleToIntercept(legs, calculateIndex, state, this.geoCircleCache[0]);

    if (course === undefined || !circleToIntercept || !state.currentPosition) {
      vectors.length = vectorIndex;
      return;
    }

    const startCourse = state.currentCourse ?? course;

    if (this.includeInitialTurn && Math.abs(NavMath.diffAngle(course, startCourse)) >= 1) {
      const turnDirection = leg.turnDirection === LegTurnDirection.Left ? 'left'
        : leg.turnDirection === LegTurnDirection.Right ? 'right'
          : NavMath.getTurnDirection(startCourse, course);

      vectorIndex += this.turnBuilder.build(
        vectors, vectorIndex,
        state.currentPosition,
        state.desiredTurnRadius.asUnit(UnitType.METER), turnDirection,
        startCourse, course
      );

      const turnVector = vectors[vectorIndex - 1];
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(turnVector);
      state.currentPosition.set(turnVector.endLat, turnVector.endLon);
    } else {
      state.currentCourse = course;
    }

    const numVectorsAdded = this.interceptBuilder.build(vectors, vectorIndex, state.currentPosition, course, circleToIntercept);
    if (numVectorsAdded > 0) {
      vectorIndex += numVectorsAdded;
      const lastVector = vectors[vectorIndex - 1];
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(lastVector);
      state.currentPosition.set(lastVector.endLat, lastVector.endLon);
    }

    vectors.length = vectorIndex;
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
   * Gets the geo circle to intercept defined by a flight plan leg.
   * @param legs A sequence of leg definitions.
   * @param index The index in the sequence of the leg from which to get the course.
   * @param state The current flight path state.
   * @param out A GeoCircle object to which to write the result.
   * @returns The geo circle to intercept defined by the flight plan leg, or undefined if it could not be determined.
   */
  protected abstract getCircleToIntercept(legs: LegDefinition[], index: number, state: FlightPathState, out: GeoCircle): GeoCircle | undefined;
}

/**
 * Calculates flight path vectors for course to DME legs.
 */
export class CourseToDMELegCalculator extends CircleInterceptLegCalculator {
  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getInterceptCourse(legs: LegDefinition[], index: number): number | undefined {
    const leg = legs[index].leg;
    const dmeFacility = this.facilityCache.get(leg.originIcao);
    return dmeFacility ? this.getLegTrueCourse(leg, dmeFacility) : undefined;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getCircleToIntercept(legs: LegDefinition[], index: number, state: FlightPathState, out: GeoCircle): GeoCircle | undefined {
    const leg = legs[index].leg;
    const dmeFacility = this.facilityCache.get(leg.originIcao);
    return dmeFacility ? out.set(dmeFacility, UnitType.METER.convertTo(leg.distance, UnitType.GA_RADIAN)) : undefined;
  }
}

/**
 * Calculates flight path vectors for course to radial intercept legs.
 */
export class CourseToRadialLegCalculator extends CircleInterceptLegCalculator {
  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getInterceptCourse(legs: LegDefinition[], index: number): number | undefined {
    const leg = legs[index].leg;
    const radialFacility = this.facilityCache.get(leg.originIcao);
    return radialFacility ? this.getLegTrueCourse(leg, radialFacility) : undefined;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getCircleToIntercept(legs: LegDefinition[], index: number, state: FlightPathState, out: GeoCircle): GeoCircle | undefined {
    const leg = legs[index].leg;
    const radialFacility = this.facilityCache.get(leg.originIcao);

    if (!radialFacility) {
      return undefined;
    }

    const magVar = (ICAO.getFacilityType(radialFacility.icao) === FacilityType.VOR)
      ? -(radialFacility as VorFacility).magneticVariation
      : MagVar.get(radialFacility);
    return out.setAsGreatCircle(radialFacility, leg.theta + magVar);
  }
}

/**
 * Calculates flight path vectors for fix to DME legs.
 */
export class FixToDMELegCalculator extends CircleInterceptLegCalculator {
  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, false);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getInterceptCourse(legs: LegDefinition[], index: number): number | undefined {
    const leg = legs[index].leg;
    const startFacility = this.facilityCache.get(leg.fixIcao);
    return startFacility ? this.getLegTrueCourse(leg, startFacility) : undefined;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getCircleToIntercept(legs: LegDefinition[], index: number, state: FlightPathState, out: GeoCircle): GeoCircle | undefined {
    const leg = legs[index].leg;
    const dmeFacility = this.facilityCache.get(leg.originIcao);
    return dmeFacility ? out.set(dmeFacility, UnitType.METER.convertTo(leg.distance, UnitType.GA_RADIAN)) : undefined;
  }
}

/**
 * Calculates flight path vectors for course to intercept legs.
 */
export class CourseToInterceptLegCalculator extends CircleInterceptLegCalculator {
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];

  /**
   * Constructor.
   * @param facilityCache This calculator's cache of facilities.
   */
  constructor(facilityCache: Map<string, Facility>) {
    super(facilityCache, true);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getInterceptCourse(legs: LegDefinition[], index: number, state: FlightPathState): number | undefined {
    const leg = legs[index].leg;
    return state.currentPosition ? this.getLegTrueCourse(leg, state.currentPosition) : undefined;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getCircleToIntercept(legs: LegDefinition[], index: number, state: FlightPathState, out: GeoCircle): GeoCircle | undefined {
    return this.predictLegPath(legs, index + 1, out);
  }

  /**
   * Predicts the path of a leg. If a prediction cannot be made, NaN will be written to all fields of the result.
   * @param legs A leg sequence.
   * @param index The index of the leg in the sequence.
   * @param out A GeoCircle to which to write the result.
   * @returns the predicted path of the leg.
   */
  private predictLegPath(legs: LegDefinition[], index: number, out: GeoCircle): GeoCircle | undefined {
    const leg = legs[index]?.leg;
    if (!leg) {
      return undefined;
    }

    switch (leg.type) {
      case LegType.CF:
        {
          const terminator = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[2]);
          return terminator ? out.setAsGreatCircle(terminator, this.getLegTrueCourse(leg, terminator)) : undefined;
        }
      case LegType.AF:
        {
          const facility = this.facilityCache.get(leg.originIcao);
          return facility ? out.set(facility, UnitType.METER.convertTo(leg.rho, UnitType.GA_RADIAN)) : undefined;
        }
      case LegType.RF:
        {
          const terminator = this.getTerminatorPosition(leg, leg.fixIcao, this.geoPointCache[2]);
          const centerFacility = this.facilityCache.get(leg.arcCenterFixIcao);
          return terminator && centerFacility ? out.set(centerFacility, terminator.distance(centerFacility)) : undefined;
        }
      case LegType.FM:
      case LegType.VM:
        {
          const origin = this.facilityCache.get(leg.originIcao);
          return origin ? out.setAsGreatCircle(origin, this.getLegTrueCourse(leg, origin)) : undefined;
        }
      default:
        return undefined;
    }
  }
}

/**
 * Calculates flight path vectors for track from fix legs.
 */
export class TrackFromFixLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly geoPointCache = [new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  protected readonly vectorBuilder = new GreatCircleBuilder();

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
    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const fixIcaoPoint = this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[0]);
    const startPoint = fixIcaoPoint ?? state.currentPosition;

    if (!startPoint) {
      vectors.length = vectorIndex;
      return;
    }

    const course = this.getLegTrueCourse(leg, startPoint);
    const path = this.geoCircleCache[0].setAsGreatCircle(startPoint, course);

    vectorIndex += this.vectorBuilder.build(vectors, vectorIndex, startPoint, path, leg.distance);

    if (vectorIndex > 0) {
      const lastVector = vectors[vectorIndex - 1];
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(lastVector);
      (state.currentPosition ??= new GeoPoint(0, 0)).set(lastVector.endLat, lastVector.endLon);
    }

    vectors.length = vectorIndex;
  }
}

/**
 * Calculates flight path vectors for course to fix legs.
 */
export class CourseToFixLegCalculator extends AbstractFlightPathLegCalculator {
  protected readonly vec3Cache = [new Float64Array(3), new Float64Array(3)];
  protected readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  protected readonly geoCircleCache = [
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0)
  ];

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
    const leg = legs[calculateIndex].leg;
    const prevLeg: LegDefinition | undefined = legs[calculateIndex - 1];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const vectors = legs[calculateIndex].calculated!.flightPath;

    let vectorIndex = 0;

    const startPoint = state.currentPosition ? this.geoPointCache[0].set(state.currentPosition) : undefined;
    const endPoint = this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[1]);

    if (!endPoint) {
      vectors.length = vectorIndex;
      return;
    }

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
      const startToEndPath = this.geoCircleCache[2].setAsGreatCircle(startVec, endVec);
      const isStartEqualToEnd = startPoint.equals(endPoint);

      const pathDot = Vec3Math.dot(startPath.center, endPath.center);
      if (-pathDot > 1 - GeoCircle.ANGULAR_TOLERANCE) {
        // The start and end paths are anti-parallel, which means we need to execute a procedure turn to do a 180.

        // Favor right turn unless we are explicitly told to turn left.
        const desiredTurnDirection = leg.turnDirection === LegTurnDirection.Left ? 'left' : 'right';
        vectorIndex += this.procTurnBuilder.build(
          vectors, vectorIndex,
          startVec, startPath, endVec, endPath,
          currentCourse + 45 * (desiredTurnDirection === 'left' ? -1 : 1),
          state.desiredTurnRadius.asUnit(UnitType.METER), desiredTurnDirection,
          currentCourse, endCourse
        );
      } else if (
        (endPath.angleAlong(startVec, endVec, Math.PI) + GeoCircle.ANGULAR_TOLERANCE) % (2 * Math.PI) < Math.PI + GeoCircle.ANGULAR_TOLERANCE
        && (
          pathDot > 1 - GeoCircle.ANGULAR_TOLERANCE
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
          desiredTurnDirection, state.desiredTurnRadius.asUnit(UnitType.METER)
        );
      }
    }

    (state.currentPosition ??= new GeoPoint(0, 0)).set(endPoint);
    state.currentCourse = endCourse;

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
    const leg = legs[calculateIndex].leg;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const calcs = legs[calculateIndex].calculated!;
    const vectors = calcs.flightPath;
    const ingress = calcs.ingress;

    let vectorIndex = 0, ingressVectorIndex = 0;

    const holdPos = this.getPositionFromIcao(leg.fixIcao, this.geoPointCache[0]);

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
      ingressVectorIndex += this.greatCircleBuilder.build(ingress, ingressVectorIndex, state.currentPosition, holdPos, state.currentCourse, FlightPathVectorFlags.HoldEntry);
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
          false, undefined,
          FlightPathVectorFlags.HoldEntry
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
        ingressVectorIndex += this.turnToCourseBuilder.build(
          ingress, ingressVectorIndex,
          holdPos, turnRadiusMeters, turnDirection === 'left' ? 'right' : 'left',
          state.currentCourse, outboundCourse,
          FlightPathVectorFlags.HoldEntry | FlightPathVectorFlags.TurnToCourse
        );

        const turnVector = ingress[ingressVectorIndex - 1];
        state.currentPosition.set(turnVector.endLat, turnVector.endLon);
        state.currentCourse = FlightPathUtils.getVectorFinalCourse(turnVector) ?? outboundCourse;
      }

      ingressVectorIndex += this.joinGreatCircleToPointBuilder.build(
        ingress, ingressVectorIndex,
        state.currentPosition, this.geoCircleCache[1].setAsGreatCircle(state.currentPosition, state.currentCourse),
        holdPos, inboundPath,
        turnDirection, turnRadiusMeters,
        true, undefined,
        FlightPathVectorFlags.HoldEntry
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
      ingressVectorIndex += this.turnToCourseBuilder.build(
        ingress, ingressVectorIndex,
        holdPos, turnRadiusMeters, turnDirection === 'left' ? 'right' : 'left',
        state.currentCourse, parallelCourse,
        FlightPathVectorFlags.HoldEntry | FlightPathVectorFlags.TurnToCourse
      );

      const turnVector = ingress[ingressVectorIndex - 1];
      state.currentPosition.set(turnVector.endLat, turnVector.endLon);
      state.currentCourse = FlightPathUtils.getVectorFinalCourse(turnVector) ?? parallelCourse;

      ingressVectorIndex += this.procTurnBuilder.build(
        ingress, ingressVectorIndex,
        state.currentPosition, this.geoCircleCache[1].setAsGreatCircle(state.currentPosition, state.currentCourse),
        holdPos, inboundPath,
        course + 135 * turnDirectionSign,
        turnRadiusMeters, turnDirection === 'left' ? 'right' : 'left',
        state.currentCourse, course,
        FlightPathVectorFlags.HoldEntry
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

      vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, outboundTurnEnd, outboundEnd, undefined, FlightPathVectorFlags.HoldLeg);

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

    vectorIndex += this.greatCircleBuilder.build(vectors, vectorIndex, inboundStart, holdPos, undefined, FlightPathVectorFlags.HoldLeg);

    state.currentPosition.set(holdPos);
    state.currentCourse = course;

    vectors.length = vectorIndex;
  }
}