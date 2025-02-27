import { Arinc429Register, Constants, LegType, MathUtils, TurnDirection } from '@flybywiresim/fbw-sdk';
import { Coordinates, distanceTo } from 'msfs-geo';
import { FlightPlanElement, FlightPlanLeg, isDiscontinuity } from '../flightplanning/legs/FlightPlanLeg';
import { NavigationProvider } from '../navigation/NavigationProvider';
import { Geo } from '../utils/Geo';
import { FlightPlanService } from '../flightplanning/FlightPlanService';
import { FlightPlanIndex } from '../flightplanning/FlightPlanManager';
import { Geometry } from './Geometry';
import { maxBank, minBank, PointSide, sideOfPointOnCourseToFix } from './lnav/CommonGeometry';
import { WaypointFactory } from '../flightplanning/waypoints/WaypointFactory';
import { GeometryFactory } from './geometry/GeometryFactory';
import { CILeg } from './lnav/legs/CI';
import { IFLeg } from './lnav/legs/IF';
import { TransitionPicker } from './lnav/TransitionPicker';
import { LegMetadata } from './lnav/legs';
import { Leg } from './lnav/legs/Leg';

enum State {
  NavDisarmed,
  NavArmed,
  NavActive,
}

export interface NavModeIntercept {
  location: Coordinates;
  distanceToIntercept: number;
}

export class PreNavModeEngagementPathCalculation implements PreNavModeEngagementPath {
  private state: State = State.NavDisarmed;

  private RECOMPUTATION_INTERVAL = 2_500; // milliseconds

  private recomputationTimer = 0;

  private geometry: Geometry | null = null;

  private intercept: NavModeIntercept | null = null;

  private register: Arinc429Register = Arinc429Register.empty();

  private ppos: Coordinates | null = null;

  private cachedIfLeg: IFLeg | null = null;

  private static readonly ciLegMetadata: Readonly<LegMetadata> = {
    flightPlanLegDefinition: {
      type: LegType.CI,
      procedureIdent: '',
      overfly: false,
    },
    turnDirection: TurnDirection.Either,
  };

  private shouldInterceptPathExist: boolean = false;

  private crossTrackError: number = 0;

  private trackAngleError: number = 0;

  private previousNavCaptureCondition: boolean = false;

  constructor(
    private readonly fmgcIndex: number,
    private navigation: NavigationProvider,
    private flightPlanService: FlightPlanService,
  ) {
    this.ppos = navigation.getPpos();
  }

  update(deltaTime: number, geometry: Geometry) {
    this.updateState();
    this.updateNavCaptureCondition(geometry);

    switch (this.state) {
      case State.NavDisarmed:
        this.updateWhileDisengaged();
        break;
      case State.NavArmed:
        this.updateWhileArmed(deltaTime, geometry);
        break;
      case State.NavActive:
        this.updateWhileActive();
    }
  }

  doesExist(): boolean {
    return this.geometry !== null;
  }

  getGeometry(): Readonly<Geometry> | null {
    return this.geometry;
  }

  getIntercept(): Readonly<NavModeIntercept> | null {
    return this.intercept;
  }

  shouldShowNoNavInterceptMessage(): boolean {
    return this.shouldInterceptPathExist && !this.doesExist();
  }

  getAlongTrackDistanceToGo(trueTrack: number): number | null {
    if (!this.doesExist() || !this.flightPlanService.has(FlightPlanIndex.Active)) {
      return null;
    }

    const activePlan = this.flightPlanService.active;

    const ciLeg = this.geometry.legs.get(activePlan.activeLegIndex - 1);

    const referenceLegIndex = !ciLeg?.isAbeam(this.ppos) ? activePlan.activeLegIndex : activePlan.activeLegIndex - 1;
    const referenceInboundTransition = this.geometry.transitions.get(referenceLegIndex - 1);
    const referenceLeg = this.geometry.legs.get(referenceLegIndex);
    const referenceOutboundTransition = this.geometry.transitions.get(referenceLegIndex);

    let atdtg = 0;

    atdtg += Geometry.completeLegAlongTrackPathDistanceToGo(
      this.ppos,
      trueTrack,
      referenceLeg,
      referenceInboundTransition,
      referenceOutboundTransition,
    );

    if (ciLeg?.isAbeam(this.ppos)) {
      atdtg +=
        activePlan.activeLeg?.isDiscontinuity === false ? activePlan.activeLeg.calculated.distanceWithTransitions : 0;
    }

    return atdtg;
  }

  private updateState() {
    this.crossTrackError = SimVar.GetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles');
    this.trackAngleError = SimVar.GetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree');

    const isNavModeArmed = this.register
      .setFromSimVar(`L:A32NX_FMGC_${this.fmgcIndex}_DISCRETE_WORD_3`)
      .bitValueOr(14, false);
    const isNavModeActive = this.register
      .setFromSimVar(`L:A32NX_FMGC_${this.fmgcIndex}_DISCRETE_WORD_2`)
      .bitValueOr(12, false);

    switch (this.state) {
      case State.NavDisarmed:
        if (isNavModeArmed) {
          this.state = State.NavArmed;
          this.onNavModeArmed();
        } else if (isNavModeActive) {
          this.state = State.NavActive;
          this.onNavModeActivated();
        }
        break;
      case State.NavArmed:
        if (isNavModeActive) {
          this.state = State.NavActive;
          this.onNavModeActivated();
        } else if (!isNavModeArmed) {
          this.state = State.NavDisarmed;
          this.onNavModeDisarmed();
        }
        break;
      case State.NavActive:
        if (isNavModeArmed) {
          this.state = State.NavArmed;
          this.onNavModeArmed();
        } else if (!isNavModeActive) {
          this.state = State.NavDisarmed;
          this.onNavModeDisengaged();
        }
        break;
    }
  }

  private onNavModeActivated() {
    this.shouldInterceptPathExist = false;
    this.sequence();
  }

  private onNavModeDisengaged() {
    this.shouldInterceptPathExist = false;
    this.resetPath();
    this.setNavCaptureCondition(false);
  }

  private onNavModeArmed() {
    this.resetPath();
    this.enqueueRecomputation();
  }

  private onNavModeDisarmed() {
    this.shouldInterceptPathExist = false;
    this.resetPath();
    this.setNavCaptureCondition(false);
  }

  private updateWhileDisengaged() {}

  private updateWhileArmed(deltaTime: number, activeGeometry: Geometry) {
    this.recomputationTimer += deltaTime;
    if (this.recomputationTimer < this.RECOMPUTATION_INTERVAL) {
      return;
    }

    this.register.setFromSimVar(`L:A32NX_FMGC_${this.fmgcIndex}_DISCRETE_WORD_2`);
    const isHdgModeActive = this.register.bitValueOr(16, false);
    const isTrkModeActive = this.register.bitValueOr(17, false);

    if (isHdgModeActive || isTrkModeActive) {
      this.recomputeInterceptPath(activeGeometry);
    }
  }

  private recomputeInterceptPath(activeGeometry: Geometry) {
    this.recomputationTimer = 0;
    this.shouldInterceptPathExist = false;

    if (!this.flightPlanService.has(FlightPlanIndex.Active)) {
      this.resetPath();
      return;
    }

    const activePlan = this.flightPlanService.active;
    const activeLegIndex = activePlan.activeLegIndex;
    const activeFlightPlanLeg: FlightPlanElement | null = activePlan.activeLeg;
    if (!this.shouldInterceptLeg(activeFlightPlanLeg)) {
      this.resetPath();
      return;
    }

    if ((this.ppos === null) !== (this.navigation.getPpos() === null)) {
      this.ppos = this.navigation.getPpos();
    }

    const trueTrack = this.navigation.getTrueTrack();
    const trueAirspeed = this.navigation.getTrueAirspeed();
    const groundSpeed = this.navigation.getGroundSpeed();
    const activeGeometryLeg = activeGeometry.legs.get(activeLegIndex);

    if (
      this.ppos === null ||
      trueTrack === null ||
      trueAirspeed === null ||
      groundSpeed === null ||
      !Number.isFinite(activeGeometryLeg?.outboundCourse)
    ) {
      this.resetPath();
      return;
    }

    this.shouldInterceptPathExist = true;

    const interceptAngle = Math.min(
      MathUtils.normalise360(trueTrack - activeGeometryLeg.outboundCourse),
      MathUtils.normalise360(activeGeometryLeg.outboundCourse - trueTrack),
    );

    // TODO figure out if this is supposed to be 160 or 120
    if (interceptAngle > 160) {
      this.resetPath();
      return;
    }

    if (!this.tryUpdateIntercept(trueTrack, activeGeometryLeg)) {
      this.resetPath();
      return;
    }

    if (this.geometry === null) {
      this.geometry = GeometryFactory.createFromFlightPlan(activePlan, true);
    } else {
      GeometryFactory.updateFromFlightPlan(this.geometry, activePlan, true);
    }

    const ifLeg = this.updateIfLeg(activeGeometryLeg);
    const ciLeg = this.updateCiLeg(trueTrack, activeGeometryLeg);

    this.geometry.legs.set(activeLegIndex - 2, ifLeg);
    this.geometry.legs.set(activeLegIndex - 1, ciLeg);
    this.geometry.transitions.set(activeLegIndex - 1, TransitionPicker.forLegs(ciLeg, activeGeometryLeg));
    this.geometry.transitions.delete(activeLegIndex - 2);
    this.geometry.recomputeWithParameters(trueAirspeed, groundSpeed, this.ppos, trueTrack, activeLegIndex - 1, -1);
    this.geometry.updateDistances(activePlan, activeLegIndex - 1, activePlan.firstMissedApproachLegIndex);
  }

  private tryUpdateIntercept(trueTrack: number, activeGeometryLeg: Leg): boolean {
    let intercept: Coordinates | null = null;
    try {
      intercept = Geo.legIntercept(this.ppos, trueTrack, activeGeometryLeg) ?? null;
    } catch (e) {
      this.resetPath();
      return false;
    }

    if (intercept === null) {
      return false;
    }

    // Check intercept lies on path
    const isInterceptAhead = sideOfPointOnCourseToFix(this.ppos, trueTrack, intercept) === PointSide.After;
    const dtg = activeGeometryLeg.getDistanceToGo(intercept);
    const isOnLeg = (dtg === undefined || dtg > 0) && activeGeometryLeg.isAbeam(intercept);

    if (!isInterceptAhead || !isOnLeg) {
      return false;
    }

    const distanceToIntercept = distanceTo(this.ppos, intercept);

    if (this.intercept === null) {
      this.intercept = {
        location: intercept,
        distanceToIntercept,
      };
    } else {
      this.intercept.location = intercept;
      this.intercept.distanceToIntercept = distanceToIntercept;
    }

    return true;
  }

  private updateIfLeg(activeGeometryLeg: Leg): IFLeg {
    if (this.cachedIfLeg === null) {
      this.cachedIfLeg = new IFLeg(
        WaypointFactory.fromLocation('PPOS', this.ppos),
        {
          flightPlanLegDefinition: {
            type: LegType.IF,
            procedureIdent: '',
            overfly: false,
          },
          turnDirection: TurnDirection.Either,
        },
        activeGeometryLeg.segment,
      );
    } else {
      this.cachedIfLeg.segment = activeGeometryLeg.segment;
    }

    return this.cachedIfLeg;
  }

  private updateCiLeg(trueTrack: number, activeGeometryLeg: Leg): CILeg {
    return new CILeg(
      trueTrack,
      activeGeometryLeg,
      PreNavModeEngagementPathCalculation.ciLegMetadata,
      activeGeometryLeg.segment,
    );
  }

  private updateWhileActive() {
    if (!this.doesExist()) {
      return;
    }

    if (Math.abs(this.crossTrackError) < 0.2) {
      this.resetPath();
    }
  }

  private canAlwaysCapture(leg: FlightPlanLeg) {
    return leg.isVx() || (leg.isCx() && leg.type !== LegType.CF);
  }

  private shouldInterceptLeg(leg?: FlightPlanElement): leg is FlightPlanLeg {
    // TODO check for the correct lateral modes here too?

    // Possible leg types we can intercept AF, CF, DF, FA, FC, FD, FM, (IF), (HA, HF, HM), (PI), (RF), TF
    // We know Vx and Cx (except CF) legs don't get intercepts drawn,
    // the others I've excluded here because I don't see how they should word
    return (
      leg?.isDiscontinuity === false &&
      !this.canAlwaysCapture(leg) &&
      leg.type !== LegType.IF &&
      !leg.isHX() &&
      leg.type !== LegType.RF &&
      leg.type !== LegType.PI
    );
  }

  private resetPath() {
    this.geometry = null;
    this.intercept = null;
  }

  private enqueueRecomputation() {
    this.recomputationTimer = this.RECOMPUTATION_INTERVAL;
  }

  private isPreNavEngagementPathCaptureConditionMet(): boolean | undefined {
    if (!this.flightPlanService.hasActive) {
      return undefined;
    }

    const plan = this.flightPlanService.active;
    const activeLeg = plan.activeLeg;
    if (!isDiscontinuity(activeLeg) && this.canAlwaysCapture(activeLeg)) {
      return true;
    }

    if (!this.doesExist()) {
      return undefined;
    }

    const ciLeg = this.geometry.legs.get(plan.activeLegIndex - 1);
    const transition = this.geometry.transitions.get(plan.activeLegIndex - 1);
    const gs = this.navigation.getGroundSpeed();

    if (!ciLeg || !transition || gs === null) {
      return undefined;
    }

    const rad = this.geometry.getGuidableRollAnticipationDistance(gs, ciLeg, transition);

    return ciLeg.getDistanceToGo(this.ppos) < rad;
  }

  private updateNavCaptureCondition(activeGeometry: Geometry) {
    if (!this.flightPlanService.hasActive) {
      this.setNavCaptureCondition(false);
      return;
    }

    const plan = this.flightPlanService.active;
    const activeLeg = plan.activeLeg;

    if (!activeLeg || isDiscontinuity(activeLeg)) {
      this.setNavCaptureCondition(false);
      return;
    } else if (this.canAlwaysCapture(activeLeg)) {
      this.setNavCaptureCondition(true);
      return;
    } else {
      const activeGeometryLeg = activeGeometry.legs.get(plan.activeLegIndex);

      const tas = this.navigation.getTrueAirspeed();
      const gs = this.navigation.getGroundSpeed();

      if (!activeGeometryLeg || tas === null || gs === null) {
        this.setNavCaptureCondition(false);
        return;
      }

      const bankAngle = Math.abs(this.trackAngleError) / 2;
      const finalBankAngle = Math.max(Math.min(bankAngle, maxBank(tas, true)), minBank(activeGeometryLeg.segment));

      const currentTurnRadius = tas ** 2 / Math.tan(finalBankAngle * MathUtils.DEGREES_TO_RADIANS) / HpathLaw.g;
      const unsaturatedTrackAngleError = MathUtils.clamp(this.trackAngleError, -45, 45);

      const saturatedCaptureZone =
        Math.sign(this.trackAngleError) *
        currentTurnRadius *
        (Math.cos(unsaturatedTrackAngleError * MathUtils.DEGREES_TO_RADIANS) -
          Math.cos(this.trackAngleError * MathUtils.DEGREES_TO_RADIANS));

      const nominalRollAngle = activeGeometryLeg.getNominalRollAngle(gs) ?? 0;
      const unsaturatedCaptureZone = (nominalRollAngle / HpathLaw.k2 - unsaturatedTrackAngleError * gs) / HpathLaw.k1;

      const optimalCaptureZone = Math.abs(saturatedCaptureZone - unsaturatedCaptureZone);
      const minimumCaptureZone = currentTurnRadius;

      this.setNavCaptureCondition(Math.abs(this.crossTrackError) <= Math.max(optimalCaptureZone, minimumCaptureZone));
    }
  }

  private setNavCaptureCondition(navCaptureCondition: boolean) {
    if (navCaptureCondition !== this.previousNavCaptureCondition) {
      SimVar.SetSimVarValue(`L:A32NX_FM${this.fmgcIndex}_NAV_CAPTURE_CONDITION`, 'bool', navCaptureCondition);
      // FIXME remove
      SimVar.SetSimVarValue(`L:A32NX_FM${(this.fmgcIndex % 2) + 1}_NAV_CAPTURE_CONDITION`, 'bool', navCaptureCondition);
      this.previousNavCaptureCondition = navCaptureCondition;
    }
  }

  private sequence() {
    if (!this.doesExist() || !this.flightPlanService.hasActive) {
      return;
    }

    const plan = this.flightPlanService.active;
    const transition = this.geometry.transitions.get(plan.activeLegIndex - 1);

    transition?.freeze();
    this.geometry.legs.delete(plan.activeLegIndex - 2);
    this.geometry.legs.delete(plan.activeLegIndex - 1);
    this.geometry.version++;
  }
}

export interface PreNavModeEngagementPath {
  doesExist(): boolean;
  getGeometry(): Readonly<Geometry> | null;
  getIntercept(): Readonly<NavModeIntercept> | null;
  shouldShowNoNavInterceptMessage(): boolean;
  getAlongTrackDistanceToGo(trueTrack: number): number | null;
}

class HpathLaw {
  static readonly Tau = 3;
  static readonly Zeta = 0.8;
  static readonly g = Constants.G * 6997.84; // kts/h
  static readonly t = this.Tau / 3600;
  static readonly k1 = 180 / 4 / Math.PI ** 2 / this.Zeta / this.t;
  static readonly k2 = this.Zeta / Math.PI / this.g / this.t;
}
