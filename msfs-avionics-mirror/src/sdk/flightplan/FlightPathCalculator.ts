/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GeoPoint, NavMath, UnitType, MagVar } from '..';
import { SimVarValueType } from '../data';
import { Facility, ICAO, LegType, FacilityType, FacilityLoader } from '../navigation';
import {
  ArcToFixLegCalculator, CourseToAltitudeLegCalculator, CourseToDMELegCalculator, CourseToFixLegCalculator,
  CourseToManualLegCalculator, CourseToRadialLegCalculator, DirectToFixLegCalculator, FixToDMELegCalculator,
  FlightPathLegCalculator, CourseToInterceptLegCalculator as CourseToInterceptLegCalculator, RadiusToFixLegCalculator,
  TrackFromFixLegCalculator, TrackToFixLegCalculator, ProcedureTurnLegCalculator, HoldLegCalculator, FlightPathState,
  DiscontinuityLegCalculator
} from './FlightPathLegCalculator';
import { FlightPathTurnCalculator } from './FlightPathTurnCalculator';
import { FlightPathUtils } from './FlightPathUtils';
import { LegDefinition } from './FlightPlanning';

/**
 * Options for the flight path calculator.
 */
export interface FlightPathCalculatorOptions {
  /** The default climb rate, if the plane is not yet at flying speed. */
  defaultClimbRate: number;

  /** The default speed, if the plane is not yet at flying speed. */
  defaultSpeed: number;

  /** The bank angle with which to calculated turns. */
  bankAngle: number;
}

/**
 * Calculates the flight path vectors for a given set of legs.
 */
export class FlightPathCalculator {
  private readonly facilityCache = new Map<string, Facility>();
  private readonly legCalculatorMap = this.createLegCalculatorMap();
  private readonly turnCalculator = new FlightPathTurnCalculator();

  private readonly state = new FlightPathStateClass();

  /**
   * Creates an instance of the FlightPathCalculator.
   * @param facilityLoader The facility loader to use with this instance.
   * @param options The options to use with this flight path calculator.
   */
  constructor(
    private readonly facilityLoader: FacilityLoader,
    protected readonly options: FlightPathCalculatorOptions
  ) {
  }

  /**
   * Creates a map from leg types to leg calculators.
   * @returns A map from leg types to leg calculators.
   */
  protected createLegCalculatorMap(): Record<LegType, FlightPathLegCalculator> {
    let calc;
    return {
      [LegType.Unknown]: calc = new TrackToFixLegCalculator(this.facilityCache),
      [LegType.IF]: calc,
      [LegType.TF]: calc,

      [LegType.AF]: new ArcToFixLegCalculator(this.facilityCache),

      [LegType.CD]: calc = new CourseToDMELegCalculator(this.facilityCache),
      [LegType.VD]: calc,

      [LegType.CF]: new CourseToFixLegCalculator(this.facilityCache),

      [LegType.CR]: calc = new CourseToRadialLegCalculator(this.facilityCache),
      [LegType.VR]: calc,

      [LegType.FC]: new TrackFromFixLegCalculator(this.facilityCache),

      [LegType.FD]: new FixToDMELegCalculator(this.facilityCache),

      [LegType.RF]: new RadiusToFixLegCalculator(this.facilityCache),

      [LegType.DF]: new DirectToFixLegCalculator(this.facilityCache),

      [LegType.FA]: calc = new CourseToAltitudeLegCalculator(this.facilityCache),
      [LegType.CA]: calc,
      [LegType.VA]: calc,

      [LegType.FM]: calc = new CourseToManualLegCalculator(this.facilityCache),
      [LegType.VM]: calc,

      [LegType.CI]: calc = new CourseToInterceptLegCalculator(this.facilityCache),
      [LegType.VI]: calc,

      [LegType.PI]: new ProcedureTurnLegCalculator(this.facilityCache),

      [LegType.HA]: calc = new HoldLegCalculator(this.facilityCache),
      [LegType.HM]: calc,
      [LegType.HF]: calc,

      [LegType.Discontinuity]: new DiscontinuityLegCalculator(this.facilityCache)
    };
  }

  /**
   * Calculates a flight path for a given set of flight plan legs.
   * @param legs The legs of the flight plan and/or procedure.
   * @param activeLegIndex The index of the active leg.
   * @param initialIndex The index of the leg to start at.
   * @param count The number of legs to calculate.
   */
  public async calculateFlightPath(legs: LegDefinition[], activeLegIndex: number, initialIndex = 0, count = Number.POSITIVE_INFINITY): Promise<void> {

    count = Math.min(legs.length - initialIndex, count);

    this.state.updatePlaneState(this.options);

    await this.loadFacilities(legs, initialIndex, count);

    this.initCurrentLatLon(legs, initialIndex);
    this.initCurrentCourse(legs, initialIndex);

    this.calculateLegPaths(legs, activeLegIndex, initialIndex, count);
    this.turnCalculator.computeTurns(legs, initialIndex, count, this.state.desiredTurnRadius.asUnit(UnitType.METER));
    this.resolveLegsIngressToEgress(legs, initialIndex, count);

    this.updateLegDistances(legs, initialIndex, count);
  }

  /**
   * Loads facilities required for flight path calculations from the flight plan.
   * @param legs The legs of the flight plan to calculate.
   * @param initialIndex The index of the first leg to calculate.
   * @param count The number of legs to calculate.
   */
  private async loadFacilities(legs: LegDefinition[], initialIndex: number, count: number): Promise<void> {
    const facilityPromises: Promise<boolean>[] = [];

    for (let i = initialIndex; i < initialIndex + count; i++) {
      this.stageFacilityLoad(legs[i].leg.fixIcao, facilityPromises);
      this.stageFacilityLoad(legs[i].leg.originIcao, facilityPromises);
      this.stageFacilityLoad(legs[i].leg.arcCenterFixIcao, facilityPromises);
    }

    if (facilityPromises.length > 0) {
      await Promise.all(facilityPromises);
    }
  }

  /**
   * Initializes the current lat/lon.
   * @param legs The legs of the flight plan to calculate.
   * @param initialIndex The index of the first leg to calculate.
   */
  private initCurrentLatLon(legs: LegDefinition[], initialIndex: number): void {
    let index = Math.min(initialIndex, legs.length);
    while (--index >= 0) {
      const leg = legs[index];
      if (leg.leg.type === LegType.Discontinuity) {
        break;
      }

      const calc = leg.calculated;
      if (calc && calc.endLat !== undefined && calc.endLon !== undefined) {
        (this.state.currentPosition ??= new GeoPoint(0, 0)).set(calc.endLat, calc.endLon);
        return;
      }
    }

    this.state.currentPosition = undefined;
  }

  /**
   * Initializes the current course.
   * @param legs The legs of the flight plan to calculate.
   * @param initialIndex The index of the first leg to calculate.
   */
  private initCurrentCourse(legs: LegDefinition[], initialIndex: number): void {
    let index = Math.min(initialIndex, legs.length);
    while (--index >= 0) {
      const leg = legs[index];
      if (leg.leg.type === LegType.Discontinuity) {
        return;
      }

      const legCalc = leg.calculated;
      if (legCalc && legCalc.flightPath.length > 0) {
        this.state.currentCourse = FlightPathUtils.getLegFinalCourse(legCalc);
        if (this.state.currentCourse !== undefined) {
          return;
        }
      }
    }

    this.state.currentCourse = undefined;
  }

  /**
   * Calculates flight paths for a sequence of flight plan legs.
   * @param legs A sequence of flight plan legs.
   * @param activeLegIndex The index of the active leg.
   * @param initialIndex The index of the first leg to calculate.
   * @param count The number of legs to calculate.
   */
  private calculateLegPaths(legs: LegDefinition[], activeLegIndex: number, initialIndex: number, count: number): void {
    const end = initialIndex + count;
    for (let i = initialIndex; i < end; i++) {
      this.calculateLegPath(legs, i, activeLegIndex);
    }
  }

  /**
   * Calculates a flight path for a leg in a sequence of legs.
   * @param legs A sequence of flight plan legs.
   * @param calculateIndex The index of the leg to calculate.
   * @param activeLegIndex The index of the active leg.
   */
  private calculateLegPath(legs: LegDefinition[], calculateIndex: number, activeLegIndex: number): void {
    const definition = legs[calculateIndex];

    const calcs = this.legCalculatorMap[definition.leg.type].calculate(legs, calculateIndex, activeLegIndex, this.state, false);

    const start = calcs.flightPath[0];
    const end = calcs.flightPath[calcs.flightPath.length - 1];

    calcs.initialDtk = undefined;
    if (start !== undefined) {
      const trueDtk = FlightPathUtils.getVectorInitialCourse(start);
      if (!isNaN(trueDtk)) {
        calcs.initialDtk = MagVar.trueToMagnetic(trueDtk, start.startLat, start.startLon);
      }
    }

    calcs.startLat = start?.startLat;
    calcs.startLon = start?.startLon;
    calcs.endLat = end?.endLat;
    calcs.endLon = end?.endLon;

    if (!end && this.state.currentPosition) {
      calcs.endLat = this.state.currentPosition.lat;
      calcs.endLon = this.state.currentPosition.lon;
    }
  }

  /**
   * Resolves the ingress to egress vectors for a set of flight plan legs.
   * @param legs A sequence of flight plan legs.
   * @param initialIndex The index of the first leg to resolve.
   * @param count The number of legs to resolve.
   */
  private resolveLegsIngressToEgress(legs: LegDefinition[], initialIndex: number, count: number): void {
    const end = initialIndex + count;
    for (let i = initialIndex; i < end; i++) {
      const legCalc = legs[i].calculated;
      legCalc && FlightPathUtils.resolveIngressToEgress(legCalc);
    }
  }

  /**
   * Updates leg distances with turn anticipation.
   * @param legs A sequence of flight plan legs.
   * @param initialIndex The index of the first leg to update.
   * @param count The number of legs to update.
   */
  private updateLegDistances(legs: LegDefinition[], initialIndex: number, count: number): void {
    const end = initialIndex + count;
    for (let i = initialIndex; i < end; i++) {
      const leg = legs[i];
      const calc = leg.calculated!;

      // Calculate distance without transitions

      calc.distance = 0;
      const len = calc.flightPath.length;
      for (let j = 0; j < len; j++) {
        calc.distance += calc.flightPath[j].distance;
      }
      calc.cumulativeDistance = calc.distance + (legs[i - 1]?.calculated?.cumulativeDistance ?? 0);

      // Calculate distance with transitions

      calc.distanceWithTransitions = 0;
      const ingressLen = calc.ingress.length;
      for (let j = 0; j < ingressLen; j++) {
        calc.distanceWithTransitions += calc.ingress[j].distance;
      }
      const ingressToEgressLen = calc.ingressToEgress.length;
      for (let j = 0; j < ingressToEgressLen; j++) {
        calc.distanceWithTransitions += calc.ingressToEgress[j].distance;
      }
      const egressLen = calc.egress.length;
      for (let j = 0; j < egressLen; j++) {
        calc.distanceWithTransitions += calc.egress[j].distance;
      }
      calc.cumulativeDistanceWithTransitions = calc.distanceWithTransitions + (legs[i - 1]?.calculated?.cumulativeDistanceWithTransitions ?? 0);
    }
  }

  /**
   * Stages a facility to be loaded.
   * @param icao The ICAO of the facility.
   * @param facilityPromises The array of facility load promises to push to.
   */
  private stageFacilityLoad(icao: string, facilityPromises: Promise<boolean>[]): void {
    if (icao !== ICAO.emptyIcao && !this.facilityCache.has(icao)) {
      let facilityType: FacilityType | undefined;
      try {
        facilityType = ICAO.getFacilityType(icao);
      } catch (err) {
        //console.log(err);
      }

      if (facilityType !== undefined) {
        try {
          facilityPromises.push(this.facilityLoader.getFacility(ICAO.getFacilityType(icao), icao)
            .then(facility => {
              this.facilityCache.set(facility.icao, facility);
              return true;
            })
            .catch(() => false)
          );
        } catch (err) {
          //console.log(err);
        }
      }
    }
  }
}

/**
 *
 */
class FlightPathStateClass implements FlightPathState {
  public currentPosition: GeoPoint | undefined;

  public currentCourse: number | undefined;

  private _planePosition = new GeoPoint(0, 0);
  public readonly planePosition = this._planePosition.readonly;

  private _planeHeading = 0;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public get planeHeading(): number {
    return this._planeHeading;
  }

  private _planeAltitude = UnitType.FOOT.createNumber(0);
  public readonly planeAltitude = this._planeAltitude.readonly;

  private _planeSpeed = UnitType.KNOT.createNumber(0);
  public readonly planeSpeed = this._planeSpeed.readonly;

  private _planeClimbRate = UnitType.FPM.createNumber(0);
  public readonly planeClimbRate = this._planeClimbRate.readonly;

  private _desiredTurnRadius = UnitType.METER.createNumber(0);
  public readonly desiredTurnRadius = this._desiredTurnRadius.readonly;

  /**
   * Updates this state with the latest information on the airplane.
   * @param options Flight path calculator options.
   */
  public updatePlaneState(options: FlightPathCalculatorOptions): void {
    this._planePosition.set(
      SimVar.GetSimVarValue('PLANE LATITUDE', SimVarValueType.Degree),
      SimVar.GetSimVarValue('PLANE LONGITUDE', SimVarValueType.Degree)
    );
    this._planeAltitude.set(SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet'));
    this._planeHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degree');
    this._planeSpeed.set(Math.max(SimVar.GetSimVarValue('GROUND VELOCITY', SimVarValueType.Knots), options.defaultSpeed));
    this._planeClimbRate.set(Math.max(SimVar.GetSimVarValue('VERTICAL SPEED', 'feet per minute'), options.defaultClimbRate));
    this._desiredTurnRadius.set(NavMath.turnRadius(this._planeSpeed.asUnit(UnitType.KNOT), options.bankAngle));
  }
}