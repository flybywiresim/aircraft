// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { RequestedVerticalMode, TargetAltitude, TargetVerticalSpeed } from '@fmgc/guidance/ControlLaws';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { AircraftToDescentProfileRelation } from '@fmgc/guidance/vnav/descent/AircraftToProfileRelation';
import { NavGeometryProfile } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { VerticalMode } from '@shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';
import { SpeedMargin } from './SpeedMargin';
import { TodGuidance } from './TodGuidance';
import { AircraftConfig } from '../../../flightplanning/AircraftConfigTypes';

enum DescentVerticalGuidanceState {
  InvalidProfile,
  ProvidingGuidance,
  Observing,
}

enum DescentSpeedGuidanceState {
  NotInDescentPhase,
  TargetOnly,
  TargetAndMargins,
}

enum PathCaptureState {
  OffPath,
  OnPath,
  InPathCapture,
}

interface PathCaptureProfile {
  /**
   * Gain used to calculate whether the difference between current and target VS is enough to start path capture
   */
  pathCaptureGain: number;
  /**
   * Gain used to calculate whether the difference between current and target VS is too large to continue path capture
   */
  pathDisengagementGain: number;
  /**
   * If we don't get a valid VS value from the ADIRS, path capture will start if linear deviation is less than this value
   */
  fallbackPathCaptureDeviation: number;
  /**
   * Maximum linear deviation before we disengage from the path if path capture condition is no longer met
   */
  maxOnPathDeviation: number;
  /**
   * If linear deviation is less than this value, path capture will always start regardless of VS
   */
  minCaptureDeviation: number;
  /**
   * If linear deviation is greater than this value, path capture will never start
   */
  maxCaptureDeviation: number;
}

const VPATH_CAPTURE_PROFILE: PathCaptureProfile = {
  pathCaptureGain: 0.1,
  pathDisengagementGain: 0.2,
  fallbackPathCaptureDeviation: 100,
  maxOnPathDeviation: 100,
  minCaptureDeviation: 50,
  maxCaptureDeviation: 500,
};

export class DescentGuidance {
  private verticalState: DescentVerticalGuidanceState = DescentVerticalGuidanceState.InvalidProfile;

  private speedState: DescentSpeedGuidanceState = DescentSpeedGuidanceState.NotInDescentPhase;

  private requestedVerticalMode: RequestedVerticalMode = RequestedVerticalMode.None;

  private targetAltitude: TargetAltitude = 0;

  private targetAltitudeGuidance: TargetAltitude = 0;

  private targetVerticalSpeed: TargetVerticalSpeed = 0;

  private showLinearDeviationOnPfd: boolean = false;

  private showDescentLatchOnPfd: boolean = false;

  private speedMargin: SpeedMargin;

  private todGuidance: TodGuidance;

  private speedTarget: Knots | Mach;

  // An "overspeed condition" just means we are above the speed margins, not that we are in the red band.
  // We use a boolean here for hysteresis
  private isInOverspeedCondition: boolean = false;

  private isInUnderspeedCondition: boolean = false;

  private readonly pathCaptureProfile: PathCaptureProfile = VPATH_CAPTURE_PROFILE;

  private pathCaptureState: PathCaptureState = PathCaptureState.OffPath;

  constructor(
    config: AircraftConfig,
    private guidanceController: GuidanceController,
    private aircraftToDescentProfileRelation: AircraftToDescentProfileRelation,
    private observer: VerticalProfileComputationParametersObserver,
    private atmosphericConditions: AtmosphericConditions,
  ) {
    this.speedMargin = new SpeedMargin(config, this.observer);
    this.todGuidance = new TodGuidance(
      this.aircraftToDescentProfileRelation,
      this.observer,
      this.atmosphericConditions,
    );

    this.writeToSimVars();
  }

  updateProfile(profile: NavGeometryProfile) {
    this.aircraftToDescentProfileRelation.updateProfile(profile);

    if (
      this.verticalState !== DescentVerticalGuidanceState.InvalidProfile &&
      !this.aircraftToDescentProfileRelation.isValid
    ) {
      this.changeState(DescentVerticalGuidanceState.InvalidProfile);
    } else if (
      this.verticalState === DescentVerticalGuidanceState.InvalidProfile &&
      this.aircraftToDescentProfileRelation.isValid
    ) {
      this.changeState(DescentVerticalGuidanceState.Observing);
    }
  }

  private changeState(newState: DescentVerticalGuidanceState) {
    if (this.verticalState === newState) {
      return;
    }

    if (newState === DescentVerticalGuidanceState.InvalidProfile) {
      this.reset();
      this.writeToSimVars();
    } else if (newState === DescentVerticalGuidanceState.Observing) {
      this.pathCaptureState = PathCaptureState.OffPath;
    }

    this.verticalState = newState;
  }

  reset() {
    this.requestedVerticalMode = RequestedVerticalMode.None;
    this.targetAltitude = 0;
    this.targetVerticalSpeed = 0;
    this.showLinearDeviationOnPfd = false;
    this.showDescentLatchOnPfd = false;
    this.isInOverspeedCondition = false;
    this.pathCaptureState = PathCaptureState.OffPath;
  }

  update(deltaTime: number, distanceToEnd: NauticalMiles) {
    this.aircraftToDescentProfileRelation.update(distanceToEnd);

    if (!this.aircraftToDescentProfileRelation.isValid) {
      this.changeState(DescentVerticalGuidanceState.InvalidProfile);
      return;
    }

    if (
      (this.observer.get().fcuVerticalMode === VerticalMode.DES) !==
      (this.verticalState === DescentVerticalGuidanceState.ProvidingGuidance)
    ) {
      this.changeState(
        this.verticalState === DescentVerticalGuidanceState.ProvidingGuidance
          ? DescentVerticalGuidanceState.Observing
          : DescentVerticalGuidanceState.ProvidingGuidance,
      );
    }

    this.updateSpeedMarginState();
    this.updateSpeedTarget();
    this.updateSpeedGuidance();
    this.updateOverUnderspeedCondition();
    this.updateLinearDeviation();

    if (this.verticalState === DescentVerticalGuidanceState.ProvidingGuidance) {
      this.updateDesModeGuidance();
    }

    this.writeToSimVars();
    this.todGuidance.update(deltaTime);
  }

  private updateLinearDeviation() {
    const { fcuVerticalMode, flightPhase } = this.observer.get();

    this.targetAltitude = this.aircraftToDescentProfileRelation.currentTargetAltitude();

    this.showLinearDeviationOnPfd =
      flightPhase < FmgcFlightPhase.GoAround &&
      (flightPhase >= FmgcFlightPhase.Descent || this.aircraftToDescentProfileRelation.isPastTopOfDescent()) &&
      fcuVerticalMode !== VerticalMode.GS_CPT &&
      fcuVerticalMode !== VerticalMode.GS_TRACK &&
      fcuVerticalMode !== VerticalMode.LAND &&
      fcuVerticalMode !== VerticalMode.FLARE &&
      fcuVerticalMode !== VerticalMode.ROLL_OUT;
  }

  private updateDesModeGuidance() {
    const isOnGeometricPath = this.aircraftToDescentProfileRelation.isOnGeometricPath();
    const isAboveSpeedLimitAltitude = this.aircraftToDescentProfileRelation.isAboveSpeedLimitAltitude();
    const isCloseToAirfieldElevation = this.aircraftToDescentProfileRelation.isCloseToAirfieldElevation();
    const isBeforeTopOfDescent = !this.aircraftToDescentProfileRelation.isPastTopOfDescent();
    const linearDeviation = this.aircraftToDescentProfileRelation.computeLinearDeviation();
    const isSpeedAuto = Simplane.getAutoPilotAirspeedManaged();
    const isApproachPhaseActive = this.observer.get().flightPhase === FmgcFlightPhase.Approach;
    const isHoldActive = this.guidanceController.isManualHoldActive();
    const targetVerticalSpeed = this.aircraftToDescentProfileRelation.currentTargetVerticalSpeed();

    this.targetAltitudeGuidance = this.atmosphericConditions.currentPressureAltitude - linearDeviation;

    this.updatePathCaptureState(linearDeviation, targetVerticalSpeed);
    const shouldGoOffPath = this.pathCaptureState === PathCaptureState.OffPath;

    if ((!isHoldActive && shouldGoOffPath && linearDeviation > 0) || this.isInOverspeedCondition) {
      // above path
      this.requestedVerticalMode = RequestedVerticalMode.SpeedThrust;
    } else if (shouldGoOffPath || isBeforeTopOfDescent || isHoldActive) {
      // below path
      if (isHoldActive) {
        this.requestedVerticalMode = RequestedVerticalMode.VsSpeed;
        this.targetVerticalSpeed = -1000;
      } else if (isOnGeometricPath) {
        this.requestedVerticalMode = RequestedVerticalMode.FpaSpeed;
        this.targetVerticalSpeed = this.aircraftToDescentProfileRelation.currentTargetPathAngle() / 2;
      } else {
        this.requestedVerticalMode = RequestedVerticalMode.VsSpeed;
        this.targetVerticalSpeed = isAboveSpeedLimitAltitude && !isCloseToAirfieldElevation ? -1000 : -500;
      }
    } else if (!isOnGeometricPath && isSpeedAuto && !this.isInUnderspeedCondition && !isApproachPhaseActive) {
      // on idle path

      this.requestedVerticalMode = RequestedVerticalMode.VpathThrust;
      this.targetVerticalSpeed = targetVerticalSpeed;
    } else {
      // on geometric path

      this.requestedVerticalMode = RequestedVerticalMode.VpathSpeed;
      this.targetVerticalSpeed = targetVerticalSpeed;
    }
  }

  private updatePathCaptureState(linearDeviation: Feet, targetVerticalSpeed: FeetPerMinute): void {
    const allowPathCapture = this.isPathCaptureConditionMet(
      linearDeviation,
      targetVerticalSpeed,
      this.pathCaptureProfile.pathCaptureGain,
    );

    switch (this.pathCaptureState) {
      case PathCaptureState.OffPath:
        if (allowPathCapture) {
          this.pathCaptureState = PathCaptureState.InPathCapture;
        }

        break;
      case PathCaptureState.OnPath:
        if (Math.abs(linearDeviation) > this.pathCaptureProfile.minCaptureDeviation && !allowPathCapture) {
          this.pathCaptureState = PathCaptureState.OffPath;
        }

        break;
      case PathCaptureState.InPathCapture: {
        const shouldDisengageFromActiveCapture = !this.isPathCaptureConditionMet(
          linearDeviation,
          targetVerticalSpeed,
          this.pathCaptureProfile.pathCaptureGain,
        );

        if (shouldDisengageFromActiveCapture) {
          this.pathCaptureState = PathCaptureState.OffPath;
        } else if (Math.abs(linearDeviation) < this.pathCaptureProfile.minCaptureDeviation) {
          this.pathCaptureState = PathCaptureState.OnPath;
        }

        break;
      }
      default:
        break;
    }
  }

  private isPathCaptureConditionMet(linearDeviation: Feet, targetVerticalSpeed: FeetPerMinute, gain: number): boolean {
    const verticalSpeed = this.getVerticalSpeed();
    if (!verticalSpeed) {
      // Fallback path capture condition
      return Math.abs(linearDeviation) < this.pathCaptureProfile.fallbackPathCaptureDeviation;
    }

    return (
      Math.abs(linearDeviation) <
      Math.min(
        this.pathCaptureProfile.maxCaptureDeviation,
        Math.max(this.pathCaptureProfile.minCaptureDeviation, gain * Math.abs(verticalSpeed - targetVerticalSpeed)),
      )
    );
  }

  private getVerticalSpeed(): FeetPerMinute | null {
    const barometricVs = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_BAROMETRIC_VERTICAL_SPEED');
    const inertialVs = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_IR_1_VERTICAL_SPEED');

    if (inertialVs.isNormalOperation()) {
      return inertialVs.value;
    }

    if (barometricVs.isNormalOperation()) {
      return barometricVs.value;
    }

    return null;
  }

  private updateSpeedTarget() {
    const { fcuSpeed, managedDescentSpeedMach, flightPhase } = this.observer.get();
    const inManagedSpeed = Simplane.getAutoPilotAirspeedManaged();

    // In the approach phase we want to fetch the correct speed target from the JS code.
    // This is because the guidance logic is a bit different in this case.
    const managedSpeedTarget =
      flightPhase === FmgcFlightPhase.Approach
        ? SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots')
        : Math.round(
            this.iasOrMach(SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots'), managedDescentSpeedMach),
          );

    const fcuSpeedIas = fcuSpeed < 1 ? SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', fcuSpeed) : fcuSpeed;
    this.speedTarget = inManagedSpeed ? managedSpeedTarget : fcuSpeedIas;
  }

  private writeToSimVars() {
    SimVar.SetSimVarValue('L:A32NX_FG_REQUESTED_VERTICAL_MODE', 'Enum', this.requestedVerticalMode);
    SimVar.SetSimVarValue('L:A32NX_FG_TARGET_ALTITUDE', 'Feet', this.targetAltitudeGuidance);
    SimVar.SetSimVarValue('L:A32NX_FG_TARGET_VERTICAL_SPEED', 'number', this.targetVerticalSpeed);

    SimVar.SetSimVarValue('L:A32NX_PFD_TARGET_ALTITUDE', 'Feet', this.targetAltitude);
    SimVar.SetSimVarValue('L:A32NX_PFD_LINEAR_DEVIATION_ACTIVE', 'Bool', this.showLinearDeviationOnPfd);
    SimVar.SetSimVarValue('L:A32NX_PFD_VERTICAL_PROFILE_LATCHED', 'Bool', this.showDescentLatchOnPfd);
  }

  private updateSpeedGuidance() {
    if (this.speedState === DescentSpeedGuidanceState.NotInDescentPhase) {
      return;
    }
    if (this.speedState === DescentSpeedGuidanceState.TargetOnly) {
      SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', this.speedTarget);

      return;
    }

    const [lower, upper] = this.speedMargin.getMargins(this.speedTarget);
    const isOnGeometricPath = this.aircraftToDescentProfileRelation.isOnGeometricPath();

    let guidanceTarget = this.speedTarget;
    if (this.requestedVerticalMode === RequestedVerticalMode.SpeedThrust && !this.isInOverspeedCondition) {
      // If we're above the profile, target the upper speed margin to get back on the profile

      guidanceTarget = upper;
    } else if (
      this.requestedVerticalMode === RequestedVerticalMode.VpathThrust ||
      (this.requestedVerticalMode === RequestedVerticalMode.VpathSpeed && !isOnGeometricPath)
    ) {
      // In VPATH THRUST, the speed target does not matter, so set it to lower margin already in case we start underspeeding
      // If we get into VPATH SPEED on the idle path, we must have been underspeeding, so try keeping lower margin speed or go into idle

      guidanceTarget = lower;
    }

    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', guidanceTarget);
    SimVar.SetSimVarValue('L:A32NX_PFD_LOWER_SPEED_MARGIN', 'Knots', lower);
    SimVar.SetSimVarValue('L:A32NX_PFD_UPPER_SPEED_MARGIN', 'Knots', upper);
  }

  private updateSpeedMarginState() {
    const { flightPhase } = this.observer.get();
    const isHoldActive = this.guidanceController.isManualHoldActive();

    if (flightPhase !== FmgcFlightPhase.Descent) {
      this.changeSpeedState(DescentSpeedGuidanceState.NotInDescentPhase);
      return;
    }

    const shouldShowMargins =
      !isHoldActive &&
      this.verticalState === DescentVerticalGuidanceState.ProvidingGuidance &&
      Simplane.getAutoPilotAirspeedManaged();
    this.changeSpeedState(
      shouldShowMargins ? DescentSpeedGuidanceState.TargetAndMargins : DescentSpeedGuidanceState.TargetOnly,
    );
  }

  private changeSpeedState(newState: DescentSpeedGuidanceState) {
    if (this.speedState === newState) {
      return;
    }

    // Hide margins if they were previously visible, but the state changed to literally anything else
    if (this.speedState === DescentSpeedGuidanceState.TargetAndMargins) {
      SimVar.SetSimVarValue('L:A32NX_PFD_SHOW_SPEED_MARGINS', 'boolean', false);
      SimVar.SetSimVarValue('L:A32NX_PFD_LOWER_SPEED_MARGIN', 'Knots', 0);
      SimVar.SetSimVarValue('L:A32NX_PFD_UPPER_SPEED_MARGIN', 'Knots', 0);
    } else if (newState === DescentSpeedGuidanceState.TargetAndMargins) {
      SimVar.SetSimVarValue('L:A32NX_PFD_SHOW_SPEED_MARGINS', 'boolean', true);
    }

    this.speedState = newState;
  }

  private iasOrMach(ias: Knots, mach: Mach) {
    const machAsIas = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', mach);

    if (ias > machAsIas) {
      return machAsIas;
    }

    return ias;
  }

  private updateOverUnderspeedCondition() {
    const airspeed = this.atmosphericConditions.currentAirspeed;

    let upperLimit = this.speedTarget;
    let lowerLimit = this.speedTarget - 5;
    if (this.speedState === DescentSpeedGuidanceState.TargetAndMargins) {
      const [lower, upper] = this.speedMargin.getMargins(this.speedTarget);

      lowerLimit = lower;
      upperLimit = upper;
    }

    if (this.isInOverspeedCondition && airspeed < upperLimit) {
      this.isInOverspeedCondition = false;
    } else if (!this.isInOverspeedCondition && airspeed > upperLimit + 5) {
      this.isInOverspeedCondition = true;
      // Make sure we're not in over and underspeed at the same time
      this.isInUnderspeedCondition = false;
    }

    if (!this.isInUnderspeedCondition && airspeed < lowerLimit) {
      this.isInUnderspeedCondition = true;
      this.isInOverspeedCondition = false;
    } else if (this.isInUnderspeedCondition && airspeed > lowerLimit + 5) {
      this.isInUnderspeedCondition = false;
    }
  }

  public getDesSubmode(): RequestedVerticalMode {
    return this.requestedVerticalMode;
  }

  public getTargetVerticalSpeed(): FeetPerMinute {
    return this.targetVerticalSpeed;
  }

  public getLinearDeviation(): Feet | undefined {
    if (!this.aircraftToDescentProfileRelation.isValid) {
      return undefined;
    }

    return this.aircraftToDescentProfileRelation.computeLinearDeviation();
  }
}
