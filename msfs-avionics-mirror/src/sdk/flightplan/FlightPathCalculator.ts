/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EventBus } from '../data/EventBus';
import { SimVarValueType } from '../data/SimVars';
import { GeoPoint, MagVar, NavMath } from '../geo';
import { UnitType } from '../math';
import { Facility, ICAO, LegType } from '../navigation/Facilities';
import { FacilityLoader } from '../navigation/FacilityLoader';
import { FlightPathCalculatorControlEvents } from './FlightPathCalculatorControlEvents';
import {
  ArcToFixLegCalculator, CourseToAltitudeLegCalculator, CourseToDmeLegCalculator, CourseToFixLegCalculator,
  CourseToInterceptLegCalculator as CourseToInterceptLegCalculator, CourseToManualLegCalculator, CourseToRadialLegCalculator, DirectToFixLegCalculator,
  DiscontinuityLegCalculator, FixToDmeLegCalculator, FlightPathLegCalculator, FlightPathState, HoldLegCalculator, ProcedureTurnLegCalculator,
  RadiusToFixLegCalculator, TrackFromFixLegCalculator, TrackToFixLegCalculator
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

  /** The bank angle with which to calculate turns. */
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
  private readonly options: FlightPathCalculatorOptions;

  private readonly calculateQueue: (() => void)[] = [];
  private isBusy = false;

  /**
   * Creates an instance of the FlightPathCalculator.
   * @param facilityLoader The facility loader to use with this instance.
   * @param options The options to use with this flight path calculator.
   * @param bus An instance of the EventBus.
   */
  constructor(
    private readonly facilityLoader: FacilityLoader,
    options: FlightPathCalculatorOptions,
    private readonly bus: EventBus
  ) {
    this.options = { ...options };
    this.bus.getSubscriber<FlightPathCalculatorControlEvents>().on('flightpath_set_options').handle(newOptions => this.setOptions(newOptions));
  }

  /**
   * Method to update this calculator's options.
   * @param newOptions A Partial FlightPathCalculatorOptions object.
   */
  private setOptions(newOptions: Partial<FlightPathCalculatorOptions>): void {

    for (const key in newOptions) {
      const option = newOptions[key as keyof FlightPathCalculatorOptions];
      if (option !== undefined) {
        this.options[key as keyof FlightPathCalculatorOptions] = option;
      }
    }
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

      [LegType.CD]: calc = new CourseToDmeLegCalculator(this.facilityCache),
      [LegType.VD]: calc,

      [LegType.CF]: new CourseToFixLegCalculator(this.facilityCache),

      [LegType.CR]: calc = new CourseToRadialLegCalculator(this.facilityCache),
      [LegType.VR]: calc,

      [LegType.FC]: new TrackFromFixLegCalculator(this.facilityCache),

      [LegType.FD]: new FixToDmeLegCalculator(this.facilityCache),

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

      [LegType.Discontinuity]: calc = new DiscontinuityLegCalculator(this.facilityCache),
      [LegType.ThruDiscontinuity]: calc
    };
  }

  /**
   * Calculates a flight path for a given set of flight plan legs.
   * @param legs The legs of the flight plan to calculate.
   * @param activeLegIndex The index of the active leg.
   * @param initialIndex The index of the leg at which to start the calculation.
   * @param count The number of legs to calculate.
   * @returns A Promise which is fulfilled when the calculation is finished.
   */
  public calculateFlightPath(legs: LegDefinition[], activeLegIndex: number, initialIndex = 0, count = Number.POSITIVE_INFINITY): Promise<void> {
    if (this.isBusy || this.calculateQueue.length > 0) {
      return new Promise((resolve, reject) => {
        this.calculateQueue.push(() => { this.doCalculate(resolve, reject, legs, activeLegIndex, initialIndex, count); });
      });
    } else {
      return new Promise((resolve, reject) => {
        this.doCalculate(resolve, reject, legs, activeLegIndex, initialIndex, count);
      });
    }
  }

  /**
   * Executes a calculate operation. When the operation is finished, the next operation in the queue, if one exists,
   * will be started.
   * @param resolve The Promise resolve function to invoke when the calculation is finished.
   * @param reject The Promise reject function to invoke when an error occurs during calculation.
   * @param legs The legs of the flight plan to calculate.
   * @param activeLegIndex The index of the active leg.
   * @param initialIndex The index of the leg at which to start the calculation.
   * @param count The number of legs to calculate.
   * @returns A Promise which is fulfilled when the calculate operation is finished, or rejected if an error occurs
   * during calculation.
   */
  private async doCalculate(
    resolve: () => void,
    reject: (reason?: any) => void,
    legs: LegDefinition[],
    activeLegIndex: number,
    initialIndex = 0,
    count = Number.POSITIVE_INFINITY
  ): Promise<void> {
    this.isBusy = true;

    try {
      initialIndex = Math.max(0, initialIndex);
      count = Math.max(0, Math.min(legs.length - initialIndex, count));

      this.state.updatePlaneState(this.options);

      // Because some facilities can be mutated, we always want to get the most up-to-date version from the facility loader
      this.facilityCache.clear();
      await this.loadFacilities(legs, initialIndex, count);

      this.initCurrentLatLon(legs, initialIndex);
      this.initCurrentCourse(legs, initialIndex);
      this.initIsFallback(legs, initialIndex);

      this.calculateLegPaths(legs, activeLegIndex, initialIndex, count);
      this.turnCalculator.computeTurns(legs, initialIndex, count, this.state.desiredTurnRadius.asUnit(UnitType.METER));
      this.resolveLegsIngressToEgress(legs, initialIndex, count);

      this.updateLegDistances(legs, initialIndex, count);

      this.isBusy = false;
      resolve();
    } catch (e) {
      this.isBusy = false;
      reject(e);
    }

    const nextInQueue = this.calculateQueue.shift();
    if (nextInQueue !== undefined) {
      nextInQueue();
    }
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
   * Stages a facility to be loaded.
   * @param icao The ICAO of the facility.
   * @param facilityPromises The array of facility load promises to push to.
   */
  private stageFacilityLoad(icao: string, facilityPromises: Promise<boolean>[]): void {
    if (ICAO.isFacility(icao)) {
      facilityPromises.push(this.facilityLoader.getFacility(ICAO.getFacilityType(icao), icao)
        .then(facility => {
          this.facilityCache.set(icao, facility);
          return true;
        })
        .catch(() => false)
      );
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
      if (leg.leg.type === LegType.Discontinuity || leg.leg.type === LegType.ThruDiscontinuity) {
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
      if (leg.leg.type === LegType.Discontinuity || leg.leg.type === LegType.ThruDiscontinuity) {
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
   * Initializes the fallback state.
   * @param legs The legs of the flight plan to calculate.
   * @param initialIndex The index of the first leg to calculate.
   */
  private initIsFallback(legs: LegDefinition[], initialIndex: number): void {
    this.state.isFallback = legs[Math.min(initialIndex, legs.length) - 1]?.calculated?.endsInFallback ?? false;
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
}

/**
 * An implementation of {@link FlightPathState}
 */
class FlightPathStateClass implements FlightPathState {
  public currentPosition: GeoPoint | undefined;

  public currentCourse: number | undefined;

  public isFallback = false;

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