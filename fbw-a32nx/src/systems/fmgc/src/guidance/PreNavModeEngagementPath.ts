import { Arinc429Register, LegType, TurnDirection } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { Geo } from '@fmgc/utils/Geo';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { Geometry } from '@fmgc/guidance/Geometry';
import { PointSide, sideOfPointOnCourseToFix } from '@fmgc/guidance/lnav/CommonGeometry';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { WaypointFactory } from '@fmgc/flightplanning/waypoints/WaypointFactory';
import { Coordinates, distanceTo } from 'msfs-geo';
import { GeometryFactory } from '@fmgc/guidance/geometry/GeometryFactory';

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

  constructor(
    private readonly fmgcIndex: number,
    private navigation: NavigationProvider,
    private flightPlanService: FlightPlanService,
  ) {}

  update(deltaTime: number, geometry: Geometry) {
    this.updateState();

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

  private updateState() {
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

  private onNavModeActivated() {}

  private onNavModeDisengaged() {
    this.resetPath();
  }

  private onNavModeArmed() {
    this.resetPath();
    this.enqueueRecomputation();
  }

  private onNavModeDisarmed() {
    this.resetPath();
  }

  private updateWhileDisengaged() {}

  private updateWhileArmed(deltaTime: number, activeGeometry: Geometry) {
    this.recomputationTimer += deltaTime;
    if (this.recomputationTimer < this.RECOMPUTATION_INTERVAL) {
      return;
    }

    this.recomputeInterceptPath(activeGeometry);
  }

  private recomputeInterceptPath(activeGeometry: Geometry) {
    this.recomputationTimer = 0;

    if (!this.flightPlanService.has(FlightPlanIndex.Active)) {
      this.resetPath();
      return;
    }

    const activePlan = this.flightPlanService.active;
    const activeLegIndex = activePlan.activeLegIndex;
    const activeFlightPlanLeg: FlightPlanElement | null = activePlan.activeLeg;
    if (!this.shouldComputeInterceptPath(activeFlightPlanLeg)) {
      this.resetPath();
      return;
    }

    const ppos = this.navigation.getPpos();
    const trueTrack = this.navigation.getTrueTrack();
    const trueAirspeed = this.navigation.getTrueAirspeed();
    const groundSpeed = this.navigation.getGroundSpeed();
    const activeGeometryLeg = activeGeometry.legs.get(activeLegIndex);

    if (
      ppos === null ||
      trueTrack === null ||
      trueAirspeed === null ||
      groundSpeed === null ||
      activeGeometryLeg === null
    ) {
      this.resetPath();
      return;
    }

    let intercept: Coordinates | null = null;
    try {
      intercept = Geo.legIntercept(ppos, trueTrack, activeGeometryLeg);
    } catch (e) {
      this.resetPath();
      return;
    }

    if (intercept === null) {
      this.resetPath();
      return;
    }

    // Check intercept lies on path
    const isInterceptAhead = sideOfPointOnCourseToFix(ppos, trueTrack, intercept) === PointSide.After;
    const dtg = activeGeometryLeg.getDistanceToGo(intercept);
    const isOnLeg = dtg >= 0 && dtg <= activeGeometryLeg.distance;

    if (!isInterceptAhead || !isOnLeg) {
      this.resetPath();
      return;
    }

    if (this.geometry === null) {
      this.geometry = GeometryFactory.createFromFlightPlan(activePlan, true);
    } else {
      GeometryFactory.updateFromFlightPlan(this.geometry, activePlan, true);
    }

    const distanceToIntercept = distanceTo(ppos, intercept);

    if (this.intercept === null) {
      this.intercept = {
        location: intercept,
        distanceToIntercept,
      };
    } else {
      this.intercept.location = intercept;
      this.intercept.distanceToIntercept = distanceToIntercept;
    }

    const leg = new CFLeg(
      WaypointFactory.fromLocation('INTCPT', intercept),
      trueTrack,
      distanceToIntercept,
      {
        flightPlanLegDefinition: {
          type: LegType.CF,
          procedureIdent: '',
          overfly: false,
        },
        turnDirection: TurnDirection.Either,
      },
      activeGeometryLeg.segment,
    );

    this.geometry.legs.set(activeLegIndex - 1, leg);
    this.geometry.recomputeWithParameters(trueAirspeed, groundSpeed, ppos, trueTrack, activeLegIndex - 1, -1);
  }

  private updateWhileActive() {}

  private shouldComputeInterceptPath(leg: FlightPlanElement): leg is FlightPlanLeg {
    // Possible leg types we can intercept AF, CF, DF, FA, FC, FD, FM, HA, HF, HM, PI, RF, TF
    return (
      leg.isDiscontinuity === false &&
      !leg.isVx() &&
      (!leg.isCx() || leg.type === LegType.CF) &&
      leg.type !== LegType.IF
    );
  }

  private resetPath() {
    this.geometry = null;
    this.intercept = null;
  }

  private enqueueRecomputation() {
    this.recomputationTimer = this.RECOMPUTATION_INTERVAL;
  }
}

export interface PreNavModeEngagementPath {
  doesExist(): boolean;
  getGeometry(): Readonly<Geometry> | null;
  getIntercept(): Readonly<NavModeIntercept> | null;
}
