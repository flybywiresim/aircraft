/// <reference types="msfstypes/JS/simvar" />

import { ControlEvents, EventBus, SimVarValueType } from '../../data';
import {
  ActiveLegType, CircleVector, FlightPathUtils, FlightPathVector, FlightPlanner, FlightPlannerEvents, LegCalculations, LegDefinition, LegDefinitionFlags
} from '../../flightplan';
import { GeoCircle, GeoPoint, MagVar, NavMath } from '../../geo';
import { AdcEvents, AhrsEvents, GNSSEvents, NavEvents, NavSourceType } from '../../instruments';
import { MathUtils, UnitType } from '../../math';
import { BitFlags } from '../../math/BitFlags';
import { FixTypeFlags, LegType } from '../../navigation';
import { Subject } from '../../sub';
import { ObjectSubject } from '../../sub/ObjectSubject';
import { SubscribableType } from '../../sub/Subscribable';
import { LinearServo } from '../../utils/controllers/LinearServo';
import { APValues } from '../APConfig';
import { ArcTurnController } from '../calculators/ArcTurnController';
import { LNavTransitionMode, LNavVars } from '../data/LNavEvents';
import { DirectorState, ObsDirector, PlaneDirector } from './PlaneDirector';

/**
 * Calculates an intercept angle, in degrees, to capture the desired GPS track for {@link LNavDirector}.
 * @param dtk The desired track, in degrees true.
 * @param xtk The cross-track error, in nautical miles. Negative values indicate that the plane is to the left of the
 * desired track.
 * @param tas The true airspeed of the plane, in knots.
 * @returns The intercept angle, in degrees, to capture the desired track from the navigation signal.
 */
export type LNavDirectorInterceptFunc = (dtk: number, xtk: number, tas: number) => number;

/**
 * A class that handles lateral navigation.
 */
export class LNavDirector implements PlaneDirector {
  private readonly vec3Cache = [new Float64Array(3), new Float64Array(3)];
  private readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  public previousLegIndex = 0;

  /** The current active leg index. */
  public currentLegIndex = 0;

  /** The current flight path vector index. */
  public currentVectorIndex = 0;

  public state: DirectorState;

  /** A callback called when the LNAV director activates. */
  public onActivate?: () => void;

  /** A callback called when the LNAV director arms. */
  public onArm?: () => void;

  private readonly aircraftState = {
    tas: 0,
    gs: 0,
    track: 0,
    magvar: 0,
    windSpeed: 0,
    windDirection: 0,
    planePos: new GeoPoint(0, 0),
    hdgTrue: 0
  };

  private currentLeg: LegDefinition | undefined = undefined;

  private dtk = 0;
  private xtk = 0;
  private bearingToVectorEnd = 0;
  private courseToSteer = 0;
  private alongVectorDistance = 0;
  private vectorDistanceRemaining = 0;
  private vectorAnticipationDistance = 0;

  private transitionMode = LNavTransitionMode.None;

  private isSuspended = false;
  private suspendedLegIndex = 0;
  private resetVectorsOnSuspendEnd = false;
  private inhibitNextSequence = false;

  private missedApproachActive = false;

  private currentBankRef = 0;

  private readonly arcController = new ArcTurnController();

  private readonly bankServo = new LinearServo(10);

  private readonly lnavData = ObjectSubject.create({
    dtk: 0,
    xtk: 0,
    isTracking: false,
    legIndex: 0,
    transitionMode: LNavTransitionMode.None,
    vectorIndex: 0,
    courseToSteer: 0,
    isSuspended: false,
    alongLegDistance: 0,
    legDistanceRemaining: 0,
    alongVectorDistance: 0,
    vectorDistanceRemaining: 0,
    vectorAnticipationDistance: 0
  });

  private isObsDirectorTracking = false;

  private canArm = false;
  private trackAtActivation = 0;
  private isInterceptingFromArmedState = false;

  private awaitCalculateId = 0;
  private isAwaitingCalculate = false;

  private isNavLock = Subject.create<boolean>(false);

  private readonly lnavDataHandler = (
    obj: SubscribableType<typeof this.lnavData>,
    key: keyof SubscribableType<typeof this.lnavData>,
    value: SubscribableType<typeof this.lnavData>[keyof SubscribableType<typeof this.lnavData>]
  ): void => {
    switch (key) {
      case 'dtk': SimVar.SetSimVarValue(LNavVars.DTK, SimVarValueType.Degree, value); break;
      case 'xtk': SimVar.SetSimVarValue(LNavVars.XTK, SimVarValueType.NM, value); break;
      case 'isTracking': SimVar.SetSimVarValue(LNavVars.IsTracking, SimVarValueType.Bool, value); break;
      case 'legIndex': SimVar.SetSimVarValue(LNavVars.TrackedLegIndex, SimVarValueType.Number, value); break;
      case 'transitionMode': SimVar.SetSimVarValue(LNavVars.TransitionMode, SimVarValueType.Number, value); break;
      case 'vectorIndex': SimVar.SetSimVarValue(LNavVars.TrackedVectorIndex, SimVarValueType.Number, value); break;
      case 'courseToSteer': SimVar.SetSimVarValue(LNavVars.CourseToSteer, SimVarValueType.Degree, value); break;
      case 'isSuspended': SimVar.SetSimVarValue(LNavVars.IsSuspended, SimVarValueType.Bool, value); break;
      case 'alongLegDistance': SimVar.SetSimVarValue(LNavVars.LegDistanceAlong, SimVarValueType.NM, value); break;
      case 'legDistanceRemaining': SimVar.SetSimVarValue(LNavVars.LegDistanceRemaining, SimVarValueType.NM, value); break;
      case 'alongVectorDistance': SimVar.SetSimVarValue(LNavVars.VectorDistanceAlong, SimVarValueType.NM, value); break;
      case 'vectorDistanceRemaining': SimVar.SetSimVarValue(LNavVars.VectorDistanceRemaining, SimVarValueType.NM, value); break;
      case 'vectorAnticipationDistance': SimVar.SetSimVarValue(LNavVars.VectorAnticipationDistance, SimVarValueType.NM, value); break;
    }
  };

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues The AP Values.
   * @param flightPlanner The flight planner to use with this instance.
   * @param obsDirector The OBS Director.
   * @param lateralInterceptCurve The optional curve used to translate DTK and XTK into a track intercept angle.
   * @param hasVectorAnticipation Whether this lnav director supports anticipating the roll by sequencing to the next vector early.
   */
  constructor(
    private readonly bus: EventBus,
    private readonly apValues: APValues,
    private readonly flightPlanner: FlightPlanner,
    private readonly obsDirector?: ObsDirector,
    private readonly lateralInterceptCurve?: LNavDirectorInterceptFunc,
    private readonly hasVectorAnticipation?: boolean
  ) {

    const sub = bus.getSubscriber<AdcEvents & AhrsEvents & ControlEvents & FlightPlannerEvents & GNSSEvents>();

    this.lnavData.sub(this.lnavDataHandler, true);

    sub.on('ambient_wind_velocity').handle(w => this.aircraftState.windSpeed = w);
    sub.on('ambient_wind_direction').handle(wd => this.aircraftState.windDirection = wd);
    sub.on('tas').handle(tas => this.aircraftState.tas = tas);
    sub.on('hdg_deg_true').handle(hdg => this.aircraftState.hdgTrue = hdg);
    sub.on('ground_speed').handle(gs => this.aircraftState.gs = gs);

    const nav = this.bus.getSubscriber<NavEvents>();
    nav.on('cdi_select').handle((src) => {
      if (this.state !== DirectorState.Inactive && src.type !== NavSourceType.Gps) {
        this.deactivate();
      }
    });

    sub.on('suspend_sequencing').handle((v) => {
      this.trySetSuspended(v);
    });

    sub.on('activate_missed_approach').handle((v) => {
      this.missedApproachActive = v;
    });

    sub.on('lnav_inhibit_next_sequence').handle(inhibit => {
      this.inhibitNextSequence = inhibit;
      if (inhibit) {
        this.suspendedLegIndex = 0;
      }
    });

    sub.on('fplActiveLegChange').handle(e => {
      if (e.planIndex === this.flightPlanner.activePlanIndex && e.type === ActiveLegType.Lateral) {
        this.resetVectors();
      }
    });

    sub.on('fplIndexChanged').handle(() => {
      this.resetVectors();
    });

    sub.on('fplCopied').handle((e) => {
      if (e.targetPlanIndex === this.flightPlanner.activePlanIndex) {
        this.resetVectors();
      }
    });

    sub.on('gps-position').handle(lla => {
      this.aircraftState.planePos.set(lla.lat, lla.long);
    });
    sub.on('track_deg_true').handle(t => this.aircraftState.track = t);
    sub.on('magvar').handle(m => this.aircraftState.magvar = m);

    this.isNavLock.sub((newState: boolean) => {
      if (SimVar.GetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool') !== newState) {
        SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', newState);
      }
    });

    this.state = DirectorState.Inactive;
  }

  /**
   * Resets the current vectors and transition mode.
   */
  private resetVectors(): void {
    this.currentVectorIndex = 0;
    this.transitionMode = LNavTransitionMode.Ingress;
    this.inhibitNextSequence = false;
    this.awaitCalculate();
  }

  /**
   * Activates the LNAV director.
   */
  public activate(): void {
    this.isInterceptingFromArmedState = true;
    this.trackAtActivation = this.aircraftState.track;
    this.state = DirectorState.Active;
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    this.setNavLock(true);
  }

  /**
   * Arms the LNAV director.
   */
  public arm(): void {
    if (this.state === DirectorState.Inactive) {
      this.isInterceptingFromArmedState = false;
      if (this.canArm) {
        this.state = DirectorState.Armed;
        if (this.onArm !== undefined) {
          this.onArm();
        }
        this.setNavLock(true);
      }
    }
  }

  /**
   * Deactivates the LNAV director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    if (this.obsDirector && this.obsDirector.state !== DirectorState.Inactive) {
      this.obsDirector.deactivate();
    }
    this.isInterceptingFromArmedState = false;
    this.setNavLock(false);
  }

  /**
   * Sets the NAV1 Lock state.
   * @param newState The new state of the NAV1 lock.
   */
  public setNavLock(newState: boolean): void {
    this.isNavLock.set(newState);
  }

  /**
   * Updates the lateral director.
   */
  public update(): void {
    let clearInhibitNextSequence = false;

    const flightPlan = this.flightPlanner.hasActiveFlightPlan() ? this.flightPlanner.getActiveFlightPlan() : undefined;
    this.currentLegIndex = flightPlan ? flightPlan.activeLateralLeg : 0;

    let isTracking = !!flightPlan && this.currentLegIndex <= flightPlan.length - 1;

    if (flightPlan && isTracking) {
      if (this.isAwaitingCalculate) {
        return;
      }

      this.currentLeg = flightPlan.getLeg(this.currentLegIndex);

      // We don't want to clear the inhibit next sequence flag until the active leg has been calculated
      // since we never sequence through non-calculated legs.
      clearInhibitNextSequence = !!this.currentLeg.calculated;

      this.calculateTracking();

      if (this.isAwaitingCalculate) {
        return;
      }

      isTracking = this.currentLegIndex <= flightPlan.length - 1;

      if (isTracking) {
        const calcs = this.currentLeg.calculated;

        if (this.obsDirector) {
          this.obsDirector.setLeg(this.currentLegIndex, this.currentLeg);

          if (this.obsDirector.obsActive) {
            this.isSuspended = true;
            this.suspendedLegIndex = this.currentLegIndex;

            if (!this.isObsDirectorTracking) {
              this.lnavData.unsub(this.lnavDataHandler);
              this.isObsDirectorTracking = true;
              this.obsDirector.startTracking();
            }

            if (this.state === DirectorState.Active && this.obsDirector.state !== DirectorState.Active) {
              this.obsDirector.activate();
              this.setNavLock(true);
            }

            if (this.state === DirectorState.Armed && this.obsDirector.canActivate()) {
              this.obsDirector.activate();
              this.state = DirectorState.Active;
              if (this.onActivate !== undefined) {
                this.onActivate();
              }
              this.setNavLock(true);
            }

            this.obsDirector.update();
            return;
          }
        }

        isTracking = calcs !== undefined;

        if (this.state !== DirectorState.Inactive && calcs !== undefined) {
          this.navigateFlightPath(calcs);
        }
      }
    }

    if (this.isObsDirectorTracking) {
      this.isSuspended = false;
    }

    this.canArm = isTracking;

    this.lnavData.set('isTracking', isTracking);
    this.lnavData.set('isSuspended', this.isSuspended);

    if (isTracking) {
      this.lnavData.set('dtk', this.dtk);
      this.lnavData.set('xtk', this.xtk);
      this.lnavData.set('legIndex', this.currentLegIndex);
      this.lnavData.set('vectorIndex', this.currentVectorIndex);
      this.lnavData.set('transitionMode', this.transitionMode);
      this.lnavData.set('courseToSteer', this.courseToSteer);
      this.lnavData.set('alongVectorDistance', this.alongVectorDistance);
      this.lnavData.set('vectorDistanceRemaining', this.vectorDistanceRemaining);
      this.lnavData.set('vectorAnticipationDistance', this.vectorAnticipationDistance);

      const currentLeg = this.currentLeg as LegDefinition;
      this.lnavData.set('alongLegDistance', this.getAlongLegDistance(currentLeg, this.currentVectorIndex, this.alongVectorDistance));
      this.lnavData.set('legDistanceRemaining', this.getLegDistanceRemaining(currentLeg, this.currentVectorIndex, this.vectorDistanceRemaining));
    } else {
      this.currentLeg = undefined;

      this.lnavData.set('dtk', 0);
      this.lnavData.set('xtk', 0);
      this.lnavData.set('legIndex', 0);
      this.lnavData.set('vectorIndex', 0);
      this.lnavData.set('transitionMode', LNavTransitionMode.None);
      this.lnavData.set('courseToSteer', 0);
      this.lnavData.set('alongLegDistance', 0);
      this.lnavData.set('vectorDistanceRemaining', 0);
      this.lnavData.set('alongVectorDistance', 0);
      this.lnavData.set('legDistanceRemaining', 0);
      this.lnavData.set('vectorAnticipationDistance', 0);
    }

    if (this.isObsDirectorTracking) {
      this.obsDirector?.stopTracking();
      this.lnavData.sub(this.lnavDataHandler, true);
      this.isObsDirectorTracking = false;
    }

    if (this.state === DirectorState.Armed) {
      this.tryActivate();
    }

    this.inhibitNextSequence &&= !clearInhibitNextSequence;
  }

  /**
   * Navigates the provided leg flight path.
   * @param calcs The legs calculations that has the provided flight path.
   */
  private navigateFlightPath(calcs: LegCalculations): void {
    let absInterceptAngle;
    let naturalAbsInterceptAngle = 0;

    if (this.lateralInterceptCurve !== undefined) {
      naturalAbsInterceptAngle = this.lateralInterceptCurve(this.dtk, this.xtk, this.aircraftState.tas);
    } else {
      naturalAbsInterceptAngle = Math.min(Math.pow(Math.abs(this.xtk) * 20, 1.35) + (Math.abs(this.xtk) * 50), 45);
      if (naturalAbsInterceptAngle <= 2.5) {
        naturalAbsInterceptAngle = NavMath.clamp(Math.abs(this.xtk * 150), 0, 2.5);
      }
    }

    if (this.isInterceptingFromArmedState) {
      absInterceptAngle = Math.abs(NavMath.diffAngle(this.trackAtActivation, this.dtk));
      if (absInterceptAngle > naturalAbsInterceptAngle || absInterceptAngle < 5 || absInterceptAngle < Math.abs(NavMath.diffAngle(this.dtk, this.bearingToVectorEnd))) {
        absInterceptAngle = naturalAbsInterceptAngle;
        this.isInterceptingFromArmedState = false;
      }
    } else {
      absInterceptAngle = naturalAbsInterceptAngle;
    }

    const interceptAngle = this.xtk < 0 ? absInterceptAngle : -1 * absInterceptAngle;
    this.courseToSteer = NavMath.normalizeHeading(this.dtk + interceptAngle);

    let bankAngle = this.desiredBank(this.courseToSteer);

    const vector = LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended)[this.currentVectorIndex];

    if (vector !== undefined && !FlightPathUtils.isVectorGreatCircle(vector)) {
      bankAngle = this.adjustBankAngleForArc(vector, bankAngle);
    }

    if (this.state === DirectorState.Active) {
      this.setBank(bankAngle);
    }
  }

  /**
   * Adjusts the desired bank angle for arc vectors.
   * @param vector The arc vector to adjust for.
   * @param bankAngle The current starting input desired bank angle.
   * @returns The adjusted bank angle.
   */
  private adjustBankAngleForArc(vector: CircleVector, bankAngle: number): number {
    const circle = FlightPathUtils.setGeoCircleFromVector(vector, this.geoCircleCache[0]);
    const turnDirection = FlightPathUtils.getTurnDirectionFromCircle(circle);
    const radius = UnitType.GA_RADIAN.convertTo(FlightPathUtils.getTurnRadiusFromCircle(circle), UnitType.METER);

    const relativeWindHeading = NavMath.normalizeHeading(this.aircraftState.windDirection - this.aircraftState.hdgTrue);
    const headwind = this.aircraftState.windSpeed * Math.cos(relativeWindHeading * Avionics.Utils.DEG2RAD);

    const distance = UnitType.GA_RADIAN.convertTo(circle.distance(this.aircraftState.planePos), UnitType.METER);
    const bankAdjustment = this.arcController.getOutput(distance);

    const turnBankAngle = NavMath.bankAngle(this.aircraftState.tas - headwind, radius) * (turnDirection === 'left' ? 1 : -1);
    const turnRadius = NavMath.turnRadius(this.aircraftState.tas - headwind, 25);

    const bankBlendFactor = Math.max(1 - (Math.abs(UnitType.NMILE.convertTo(this.xtk, UnitType.METER)) / turnRadius), 0);

    bankAngle = (bankAngle * (1 - bankBlendFactor)) + (turnBankAngle * bankBlendFactor) + bankAdjustment;

    return MathUtils.clamp(bankAngle, -30, 30);
  }

  /**
   * Sets the desired AP bank angle.
   * @param bankAngle The desired AP bank angle.
   */
  private setBank(bankAngle: number): void {
    if (isFinite(bankAngle)) {
      const maxBank = this.apValues.maxBankAngle.get();

      bankAngle = MathUtils.clamp(bankAngle, -maxBank, maxBank);

      this.currentBankRef = this.bankServo.drive(this.currentBankRef, bankAngle);
      SimVar.SetSimVarValue('AUTOPILOT BANK HOLD REF', 'degrees', this.currentBankRef);
    }
  }

  /**
   * Gets a desired bank from a desired track.
   * @param desiredTrack The desired track.
   * @returns The desired bank angle.
   */
  private desiredBank(desiredTrack: number): number {
    const turnDirection = NavMath.getTurnDirection(this.aircraftState.track, desiredTrack);
    const headingDiff = Math.abs(NavMath.diffAngle(this.aircraftState.track, desiredTrack));

    let baseBank = Math.min(1.25 * headingDiff, 30);
    baseBank *= (turnDirection === 'left' ? 1 : -1);

    return baseBank;
  }

  /**
   * Calculates the tracking from the current leg.
   */
  private calculateTracking(): void {
    const plan = this.flightPlanner.getActiveFlightPlan();

    let didAdvance;
    do {
      didAdvance = false;

      if (!this.currentLeg) {
        break;
      }

      //Don't really need to fly the intial leg?
      if (this.currentLeg.leg.type === LegType.IF && this.currentLegIndex === 0 && plan.length > 1) {
        this.currentLeg = plan.getLeg(++this.currentLegIndex);

        plan.setCalculatingLeg(this.currentLegIndex);
        plan.setLateralLeg(this.currentLegIndex);

        continue;
      }

      const transitionMode = this.transitionMode;
      const legIndex = this.currentLegIndex;
      const vectorIndex = this.currentVectorIndex;
      const isSuspended = this.isSuspended;

      const calcs = this.currentLeg.calculated;

      if (calcs) {
        const vectors = LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended);
        const vector = vectors[this.currentVectorIndex];

        if (vector && vector.radius > 0) {
          const planePos = this.aircraftState.planePos;

          const circle = FlightPathUtils.setGeoCircleFromVector(vector, this.geoCircleCache[0]);
          const start = GeoPoint.sphericalToCartesian(vector.startLat, vector.startLon, this.vec3Cache[0]);
          const end = GeoPoint.sphericalToCartesian(vector.endLat, vector.endLon, this.vec3Cache[1]);

          this.xtk = UnitType.GA_RADIAN.convertTo(circle.distance(planePos), UnitType.NMILE);
          this.dtk = circle.bearingAt(planePos, Math.PI);

          this.bearingToVectorEnd = MagVar.trueToMagnetic(planePos.bearingTo(vector.endLat, vector.endLon), planePos);

          const normDist = FlightPathUtils.getAlongArcNormalizedDistance(circle, start, end, planePos);

          const vectorDistanceNM = UnitType.METER.convertTo(vector.distance, UnitType.NMILE);
          this.alongVectorDistance = normDist * vectorDistanceNM;
          this.vectorDistanceRemaining = (1 - normDist) * vectorDistanceNM;

          if (this.hasVectorAnticipation) {
            const rollTimeSeconds = (this.apValues.maxBankAngle.get() + Math.abs(this.currentBankRef)) / 5;
            this.vectorAnticipationDistance = UnitType.SECOND.convertTo(rollTimeSeconds, UnitType.HOUR) * this.aircraftState.gs;
          }

          if (normDist > 1 || (this.hasVectorAnticipation && this.vectorDistanceRemaining < this.vectorAnticipationDistance)) {
            this.advanceVector(this.currentLeg);
          }
        } else {
          this.alongVectorDistance = 0;
          this.vectorDistanceRemaining = 0;
          this.vectorAnticipationDistance = 0;
          this.advanceVector(this.currentLeg);
        }

        didAdvance = transitionMode !== this.transitionMode
          || legIndex !== this.currentLegIndex
          || vectorIndex !== this.currentVectorIndex
          || isSuspended !== this.isSuspended;
      }
    } while (!this.isAwaitingCalculate && didAdvance && this.currentLegIndex <= plan.length - 1);
  }

  /**
   * Applies suspends that apply at the end of a leg.
   */
  private applyEndOfLegSuspends(): void {
    const plan = this.flightPlanner.getActiveFlightPlan();
    const leg = plan.getLeg(plan.activeLateralLeg);

    if (leg.leg.type === LegType.FM || leg.leg.type === LegType.VM || leg.leg.type === LegType.Discontinuity || this.inhibitNextSequence) {
      this.trySetSuspended(true, this.inhibitNextSequence, true);
    } else if (plan.activeLateralLeg < plan.length - 1) {
      const nextLeg = plan.getLeg(plan.activeLateralLeg + 1);
      if (
        !this.missedApproachActive
        && (
          leg.leg.fixTypeFlags === FixTypeFlags.MAP
          || (!BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach) && BitFlags.isAll(nextLeg.flags, LegDefinitionFlags.MissedApproach))
        )
      ) {
        this.trySetSuspended(true, undefined, true);
      }
    }
  }

  /**
   * Applies suspends that apply at the beginning of a leg.
   */
  private applyStartOfLegSuspends(): void {
    const plan = this.flightPlanner.getActiveFlightPlan();
    const leg = plan.getLeg(plan.activeLateralLeg);

    if (leg.leg.type === LegType.HM || plan.activeLateralLeg === plan.length - 1) {
      this.trySetSuspended(true);
    }
  }

  /**
   * Advances the current flight path vector along the flight path.
   * @param leg The definition of the leg being flown.
   */
  private advanceVector(leg: LegDefinition): void {
    let didAdvance = false;

    const plan = this.flightPlanner.getActiveFlightPlan();

    this.currentVectorIndex++;

    const calcs = leg.calculated;
    let vectors = calcs ? LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended) : undefined;

    while (!vectors || this.currentVectorIndex >= vectors.length) {
      switch (this.transitionMode) {
        case LNavTransitionMode.Ingress:
          this.arcController.reset();
          this.transitionMode = LNavTransitionMode.None;
          vectors = calcs ? LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended) : undefined;
          this.currentVectorIndex = Math.max(0, this.isSuspended ? calcs?.ingressJoinIndex ?? 0 : 0);
          didAdvance = true;
          break;
        case LNavTransitionMode.None:
          if (!this.isSuspended) {
            plan.setCalculatingLeg(this.currentLegIndex + 1);
            this.transitionMode = LNavTransitionMode.Egress;
            vectors = calcs ? LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended) : undefined;
            this.currentVectorIndex = 0;
            didAdvance = true;
          } else if (leg.leg.type === LegType.HM) {
            vectors = calcs?.flightPath;
            this.currentVectorIndex = 0;
            didAdvance = true;
          } else {
            if (!didAdvance && vectors) {
              this.currentVectorIndex = Math.max(0, vectors.length - 1);
            }
            return;
          }
          break;
        case LNavTransitionMode.Egress:
          this.advanceEgressToIngress(leg);
          return;
      }
    }
  }

  /**
   * Advances the current flight plan leg to the next leg.
   * @param leg The current leg being flown.
   * @returns Whether the leg was advanced.
   */
  private advanceEgressToIngress(leg: LegDefinition): boolean {
    const plan = this.flightPlanner.getActiveFlightPlan();
    this.applyEndOfLegSuspends();

    if (!this.isSuspended) {
      if (this.currentLegIndex + 1 >= plan.length) {
        this.transitionMode = LNavTransitionMode.None;
        this.currentVectorIndex = Math.max(0, (leg.calculated?.flightPath.length ?? 0) - 1);
        return false;
      }

      this.currentLeg = plan.getLeg(++this.currentLegIndex);
      this.transitionMode = LNavTransitionMode.Ingress;
      this.currentVectorIndex = 0;
      this.suspendedLegIndex = 0;

      plan.setCalculatingLeg(this.currentLegIndex);
      plan.setLateralLeg(this.currentLegIndex);

      this.applyStartOfLegSuspends();

      return true;
    } else {
      return false;
    }
  }

  /**
   * Sets flight plan advance in or out of SUSP.
   * @param isSuspended Whether or not advance is suspended.
   * @param resetVectorsOnSuspendEnd Whether to reset the tracked vector to the beginning of the leg when the applied
   * suspend ends. Ignored if `isSuspended` is false. Defaults to false.
   * @param inhibitResuspend Whether to allow re-suspending a previously suspended leg.
   */
  private trySetSuspended(isSuspended: boolean, resetVectorsOnSuspendEnd?: boolean, inhibitResuspend?: boolean): void {
    if (isSuspended && this.currentLegIndex === this.suspendedLegIndex) {
      return;
    }

    if (isSuspended) {
      this.suspendedLegIndex = inhibitResuspend ? this.currentLegIndex : -1;
      this.resetVectorsOnSuspendEnd = resetVectorsOnSuspendEnd ?? false;
    }

    if (this.isSuspended !== isSuspended) {
      this.isSuspended = isSuspended;

      if (!isSuspended && this.resetVectorsOnSuspendEnd) {
        this.transitionMode = LNavTransitionMode.Ingress;
        this.currentVectorIndex = 0;
        this.resetVectorsOnSuspendEnd = false;
      } else {
        const legCalc = this.currentLeg?.calculated;
        const ingressJoinVector = legCalc?.flightPath[legCalc.ingressJoinIndex];
        if (legCalc && this.transitionMode === LNavTransitionMode.None && legCalc.ingressJoinIndex >= 0 && ingressJoinVector && legCalc.ingress.length > 0) {
          // reconcile vector indexes

          const vectors = isSuspended ? legCalc.flightPath : legCalc.ingressToEgress;
          const lastIngressVector = legCalc.ingress[legCalc.ingress.length - 1];
          const offset = (this.geoPointCache[0].set(lastIngressVector.endLat, lastIngressVector.endLon).equals(ingressJoinVector.endLat, ingressJoinVector.endLon)
            ? 2
            : 1
          ) * (isSuspended ? 1 : -1);

          // Not using Utils.Clamp() because I need it to clamp to >=0 last.
          this.currentVectorIndex = Math.max(0, Math.min(this.currentVectorIndex + offset, vectors.length - 1));
        }

        if (this.isSuspended && this.transitionMode === LNavTransitionMode.Egress) {
          this.transitionMode = LNavTransitionMode.None;
          this.currentVectorIndex = Math.max(0, (legCalc?.flightPath.length ?? 1) - 1);
        }
      }
    }
  }

  /**
   * Tries to activate when armed.
   */
  private tryActivate(): void {
    const headingDiff = NavMath.diffAngle(this.aircraftState.track, this.dtk);
    if (Math.abs(this.xtk) < 0.6 && Math.abs(headingDiff) < 110) {
      this.activate();
    }
  }

  /**
   * Awaits a flight plan calculation. Starts a calculation of the active flight plan and suspends all tracking and
   * sequencing until the calculation is finished. If this method is called while a previous execution is still
   * awaiting, the new await takes precedence.
   */
  private async awaitCalculate(): Promise<void> {
    if (!this.flightPlanner.hasActiveFlightPlan()) {
      return;
    }

    this.isAwaitingCalculate = true;
    const id = ++this.awaitCalculateId;

    const plan = this.flightPlanner.getActiveFlightPlan();
    try {
      await plan.calculate();
    } catch { /* continue */ }

    if (id !== this.awaitCalculateId) {
      return;
    }

    this.isAwaitingCalculate = false;
  }

  /**
   * Gets the along-track distance from the start of the currently tracked flight plan leg to the airplane's present
   * position, in nautical miles.
   * @param leg The currently tracked flight plan leg.
   * @param vectorIndex The index of the currently tracked vector.
   * @param alongVectorDistance The along-track distance from the start of the currently tracked vector to the
   * airplane's present position, in nautical miles.
   * @returns The along-track distance from the start of the currently tracked flight plan leg to the airplane's
   * present position, in nautical miles.
   */
  private getAlongLegDistance(leg: LegDefinition, vectorIndex: number, alongVectorDistance: number): number {
    const calcs = leg.calculated;

    if (!calcs) {
      return 0;
    }

    let vectors = LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, false);
    const vector = vectors[vectorIndex];

    if (!vector) {
      return 0;
    }

    let distanceAlong = 0;
    for (let i = vectorIndex - 1; i >= 0; i--) {
      distanceAlong += vectors[i].distance;
    }

    switch (this.transitionMode) {
      case LNavTransitionMode.Egress:
        vectors = calcs.ingressToEgress;
        for (let i = vectors.length - 1; i >= 0; i--) {
          distanceAlong += vectors[i].distance;
        }
      // eslint-disable-next-line no-fallthrough
      case LNavTransitionMode.None:
        vectors = calcs.ingress;
        for (let i = vectors.length - 1; i >= 0; i--) {
          distanceAlong += vectors[i].distance;
        }
    }

    return UnitType.METER.convertTo(distanceAlong, UnitType.NMILE) + alongVectorDistance;
  }

  /**
   * Gets the along-track distance from the airplane's present position to the end of the currently tracked flight plan
   * leg, in nautical miles.
   * @param leg The currently tracked flight plan leg.
   * @param vectorIndex The index of the currently tracked vector.
   * @param vectorDistanceRemaining The along-track distance from the airplane's present position to the end of the
   * currently tracked vector, in nautical miles.
   * @returns The along-track distance from the airplane's present position to the end of the currently tracked flight
   * plan leg, in nautical miles.
   */
  private getLegDistanceRemaining(leg: LegDefinition, vectorIndex: number, vectorDistanceRemaining: number): number {
    const calcs = leg.calculated;

    if (!calcs) {
      return 0;
    }

    let vectors = LNavDirector.getVectorsForTransitionMode(calcs, this.transitionMode, this.isSuspended);
    const vector = vectors[vectorIndex];

    if (!vector) {
      return 0;
    }

    let distanceRemaining = 0;
    for (let i = vectorIndex + 1; i < vectors.length; i++) {
      distanceRemaining += vectors[i].distance;
    }

    switch (this.transitionMode) {
      case LNavTransitionMode.Ingress:
        vectors = LNavDirector.getVectorsForTransitionMode(calcs, LNavTransitionMode.None, this.isSuspended);
        for (let i = Math.max(0, this.isSuspended ? calcs.ingressJoinIndex : 0); i < vectors.length; i++) {
          const currentVector = vectors[i];

          if (this.isSuspended && i === calcs.ingressJoinIndex) {
            const lastIngressVector = calcs.ingress[calcs.ingress.length - 1];
            if (lastIngressVector) {
              const circle = FlightPathUtils.setGeoCircleFromVector(currentVector, this.geoCircleCache[0]);
              distanceRemaining += UnitType.GA_RADIAN.convertTo(circle.distanceAlong(
                this.geoPointCache[0].set(lastIngressVector.endLat, lastIngressVector.endLon),
                this.geoPointCache[1].set(currentVector.endLat, currentVector.endLon)
              ), UnitType.METER);
              continue;
            }
          }

          distanceRemaining += currentVector.distance;
        }
      // eslint-disable-next-line no-fallthrough
      case LNavTransitionMode.None:
        if (!this.isSuspended) {
          vectors = calcs.egress;
          for (let i = 0; i < vectors.length; i++) {
            distanceRemaining += vectors[i].distance;
          }
        }
    }

    return UnitType.METER.convertTo(distanceRemaining, UnitType.NMILE) + vectorDistanceRemaining;
  }

  /**
   * Gets the flight path vectors to navigate for a leg and a given transition mode.
   * @param calc The calculations for a flight plan leg.
   * @param mode A transition mode.
   * @param isSuspended Whether sequencing is suspended.
   * @returns The flight path vectors to navigate for the given leg and transition mode.
   */
  public static getVectorsForTransitionMode(calc: LegCalculations, mode: LNavTransitionMode, isSuspended: boolean): FlightPathVector[] {
    switch (mode) {
      case LNavTransitionMode.None:
        return isSuspended ? calc.flightPath : calc.ingressToEgress;
      case LNavTransitionMode.Ingress:
        return calc.ingress;
      case LNavTransitionMode.Egress:
        return calc.egress;
    }
  }
}