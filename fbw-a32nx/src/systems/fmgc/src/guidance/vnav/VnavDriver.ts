//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { VerticalMode, LateralMode, isArmed, ArmedLateralMode } from '@shared/autopilot';
import {
  VerticalProfileComputationParameters,
  VerticalProfileComputationParametersObserver,
} from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { McduSpeedProfile, ManagedSpeedType } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { BaseGeometryProfile, PerfCrzToPrediction } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ConstraintReader } from '@fmgc/guidance/vnav/ConstraintReader';
import { FmgcFlightPhase } from '@shared/flightphase';
import { LatchedDescentGuidance } from '@fmgc/guidance/vnav/descent/LatchedDescentGuidance';
import { DescentGuidance } from '@fmgc/guidance/vnav/descent/DescentGuidance';
import { AircraftToDescentProfileRelation } from '@fmgc/guidance/vnav/descent/AircraftToProfileRelation';
import { WindProfileFactory } from '@fmgc/guidance/vnav/wind/WindProfileFactory';
import { NavHeadingProfile } from '@fmgc/guidance/vnav/wind/AircraftHeadingProfile';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { VerticalProfileManager } from '@fmgc/guidance/vnav/VerticalProfileManager';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { Geometry } from '../Geometry';
import { GuidanceComponent } from '../GuidanceComponent';
import {
  isSpeedChangePoint,
  NavGeometryProfile,
  VerticalCheckpoint,
  VerticalCheckpointReason,
  VerticalWaypointPrediction,
} from './profile/NavGeometryProfile';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { VnavConfig } from './VnavConfig';

export class VnavDriver implements GuidanceComponent {
  version: number = 0;

  private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

  private currentMcduSpeedProfile: McduSpeedProfile;

  // TODO this is public because it's needed in the StepAhead FMMessage. Make this private and pass it to the message class once we don't instantiate
  // those from vanilla JS
  public constraintReader: ConstraintReader;

  private aircraftToDescentProfileRelation: AircraftToDescentProfileRelation;

  private descentGuidance: DescentGuidance | LatchedDescentGuidance;

  private headingProfile: NavHeadingProfile;

  private profileManager: VerticalProfileManager;

  // We cache this here, so we don't have to recompute it every guidance step
  private decelPoint: VerticalCheckpoint = null;

  // Saved variables to check for changes

  private previousManagedDescentSpeedTarget: Knots;

  private lastParameters: VerticalProfileComputationParameters = null;

  // Here, we keep a copy of the whatever legs we used to update the descent profile last. We compare it with the legs we get from any new geometries to figure out
  // if the descent profile should be recomputed.
  private oldLegs: Map<number, Leg> = new Map();

  /**
   * To check
   */
  private requestDescentProfileRecomputation: boolean = false;

  private prevMcduPredReadyToDisplay = false;

  constructor(
    private readonly flightPlanService: FlightPlanService,
    private readonly guidanceController: GuidanceController,
    private readonly computationParametersObserver: VerticalProfileComputationParametersObserver,
    private readonly atmosphericConditions: AtmosphericConditions,
    private readonly windProfileFactory: WindProfileFactory,
    private readonly acConfig: AircraftConfig,
  ) {
    this.headingProfile = new NavHeadingProfile(flightPlanService);
    this.currentMcduSpeedProfile = new McduSpeedProfile(this.computationParametersObserver, 0, [], []);

    this.constraintReader = new ConstraintReader(flightPlanService, guidanceController);

    this.aircraftToDescentProfileRelation = new AircraftToDescentProfileRelation(this.computationParametersObserver);
    this.descentGuidance = this.acConfig.vnavConfig.VNAV_USE_LATCHED_DESCENT_MODE
      ? new LatchedDescentGuidance(
          this.acConfig,
          this.guidanceController,
          this.aircraftToDescentProfileRelation,
          computationParametersObserver,
          this.atmosphericConditions,
        )
      : new DescentGuidance(
          this.acConfig,
          this.guidanceController,
          this.aircraftToDescentProfileRelation,
          computationParametersObserver,
          this.atmosphericConditions,
        );

    this.profileManager = new VerticalProfileManager(
      this.flightPlanService,
      this.guidanceController,
      this.computationParametersObserver,
      this.atmosphericConditions,
      this.constraintReader,
      this.headingProfile,
      this.windProfileFactory,
      this.aircraftToDescentProfileRelation,
      this.acConfig,
    );
  }

  init(): void {
    console.log('[FMGC/Guidance] VnavDriver initialized!');
  }

  acceptMultipleLegGeometry(geometry: Geometry) {
    this.recompute(geometry);
  }

  update(deltaTime: number): void {
    try {
      const { flightPhase } = this.computationParametersObserver.get();

      this.updateDebugInformation();
      this.updateDistanceToDestination();

      if (flightPhase >= FmgcFlightPhase.Takeoff) {
        this.updateHoldSpeed();
        this.updateDescentSpeedGuidance();
        this.descentGuidance.update(deltaTime, this.guidanceController.alongTrackDistanceToDestination);
      }
    } catch (e) {
      console.error('[FMS] Failed to calculate vertical profile. See exception below.');
      console.error(e);
    }
  }

  recompute(geometry: Geometry): void {
    this.constraintReader.updateFlightPlan();

    if (geometry.legs.size <= 0 || !this.computationParametersObserver.canComputeProfile()) {
      this.reset();
      return;
    }

    const newParameters = this.computationParametersObserver.get();

    this.windProfileFactory.updateAircraftDistanceFromStart(this.constraintReader.distanceToPresentPosition);
    this.headingProfile.updateGeometry(geometry);
    this.currentMcduSpeedProfile?.update(this.constraintReader.distanceToPresentPosition);

    // No predictions in go around phase
    if (newParameters.flightPhase !== FmgcFlightPhase.GoAround) {
      this.profileManager.computeTacticalMcduPath();
    } else if (this.mcduProfile?.isReadyToDisplay) {
      this.mcduProfile.invalidate();
    }

    const newLegs = new Map(geometry?.legs ?? []);
    if (this.shouldUpdateDescentProfile(newParameters, newLegs) || this.requestDescentProfileRecomputation) {
      this.oldLegs = new Map(newLegs);
      this.lastParameters = newParameters;
      this.requestDescentProfileRecomputation = false;
      this.previousManagedDescentSpeedTarget = newParameters.managedDescentSpeed;

      this.profileManager.computeDescentPath();

      // TODO: This doesn't really do much, the profile is automatically updated by reference.
      this.descentGuidance.updateProfile(this.profileManager.descentProfile);
      this.decelPoint = this.profileManager.descentProfile.findVerticalCheckpoint(VerticalCheckpointReason.Decel);
    }

    if (this.profileManager.mcduProfile.isReadyToDisplay !== this.prevMcduPredReadyToDisplay) {
      SimVar.SetSimVarValue(
        'L:A32NX_FM_VERTICAL_PROFILE_AVAIL',
        'Bool',
        this.profileManager.mcduProfile.isReadyToDisplay,
      );
      this.prevMcduPredReadyToDisplay = this.profileManager.mcduProfile.isReadyToDisplay;
    }

    this.updateLegSpeedPredictions();

    this.profileManager.computeTacticalNdProfile();
    this.profileManager.computeVerticalProfileForExpediteClimb();

    this.guidanceController.pseudoWaypoints.acceptVerticalProfile();

    this.version++;
  }

  private reset() {
    if (this.version !== 0) {
      this.version = 0;
      this.profileManager.reset();
      this.constraintReader.reset();
      this.aircraftToDescentProfileRelation.reset();
      this.descentGuidance.reset();
      this.currentMcduSpeedProfile = new McduSpeedProfile(this.computationParametersObserver, 0, [], []);
      this.decelPoint = null;
      this.lastParameters = null;
      this.oldLegs.clear();
      this.guidanceController.pseudoWaypoints.acceptVerticalProfile();
      this.previousManagedDescentSpeedTarget = undefined;

      SimVar.SetSimVarValue('L:A32NX_FM_VERTICAL_PROFILE_AVAIL', 'Bool', false);
      this.prevMcduPredReadyToDisplay = false;
    }
  }

  isLatAutoControlActive(): boolean {
    const { fcuLateralMode } = this.computationParametersObserver.get();

    return (
      fcuLateralMode === LateralMode.NAV ||
      fcuLateralMode === LateralMode.LOC_CPT ||
      fcuLateralMode === LateralMode.LOC_TRACK ||
      fcuLateralMode === LateralMode.RWY
    );
  }

  isLatAutoControlArmedWithIntercept(): boolean {
    const { fcuArmedLateralMode } = this.computationParametersObserver.get();

    // FIXME: Figure out if intercept exists
    return isArmed(fcuArmedLateralMode, ArmedLateralMode.NAV);
  }

  isSelectedVerticalModeActive(): boolean {
    const { fcuVerticalMode, fcuExpediteModeActive } = this.computationParametersObserver.get();

    return (
      fcuExpediteModeActive ||
      fcuVerticalMode === VerticalMode.VS ||
      fcuVerticalMode === VerticalMode.FPA ||
      fcuVerticalMode === VerticalMode.OP_CLB ||
      fcuVerticalMode === VerticalMode.OP_DES
    );
  }

  get mcduProfile(): NavGeometryProfile | undefined {
    return this.profileManager.mcduProfile;
  }

  get ndProfile(): BaseGeometryProfile | undefined {
    return this.profileManager.ndProfile;
  }

  get expediteProfile(): BaseGeometryProfile | undefined {
    return this.profileManager.expediteProfile;
  }

  private updateDescentSpeedGuidance() {
    if (!this.ndProfile?.isReadyToDisplay) {
      return;
    }

    const {
      flightPhase,
      managedDescentSpeed,
      managedDescentSpeedMach,
      presentPosition,
      approachSpeed,
      fcuExpediteModeActive,
    } = this.computationParametersObserver.get();
    const isHoldActive = this.guidanceController.isManualHoldActive() || this.guidanceController.isManualHoldNext();
    const currentDistanceFromStart = this.isLatAutoControlActive()
      ? this.constraintReader.distanceToPresentPosition
      : 0;
    const currentAltitude = presentPosition.alt;

    // Speed guidance for holds is handled elsewhere for now, so we don't want to interfere here
    if (flightPhase !== FmgcFlightPhase.Descent || fcuExpediteModeActive || isHoldActive) {
      return;
    }

    // We get this value because we only want to a speed constraint if this is not covered by the decel point already
    const decelPointSpeed = this.decelPoint?.speed ?? 0;

    let newSpeedTarget = Math.min(managedDescentSpeed, this.previousManagedDescentSpeedTarget);
    if (this.isLatAutoControlActive()) {
      // We get the managed target here because this function is only supposed to update the managed speed
      const targetFromProfile = this.currentMcduSpeedProfile.getManagedTarget(
        currentDistanceFromStart,
        currentAltitude,
        ManagedSpeedType.Descent,
      );

      newSpeedTarget = Math.min(newSpeedTarget, targetFromProfile);
    }

    for (let i = 0; i < this.profileManager.ndProfile.checkpoints.length - 2; i++) {
      const checkpoint = this.profileManager.ndProfile.checkpoints[i];

      if (checkpoint.distanceFromStart - currentDistanceFromStart > 1) {
        break;
      }

      const isPastCstrDeceleration =
        checkpoint.reason === VerticalCheckpointReason.StartDecelerationToConstraint &&
        MathUtils.isCloseToGreaterThan(currentDistanceFromStart, checkpoint.distanceFromStart);
      const isPastLimitDeceleration =
        checkpoint.reason === VerticalCheckpointReason.StartDecelerationToLimit &&
        MathUtils.isCloseToLessThan(currentAltitude, checkpoint.altitude);
      if (
        isSpeedChangePoint(checkpoint) &&
        checkpoint.targetSpeed >= decelPointSpeed &&
        (isPastCstrDeceleration || isPastLimitDeceleration)
      ) {
        newSpeedTarget = Math.min(newSpeedTarget, checkpoint.targetSpeed);

        break;
      }
    }

    this.previousManagedDescentSpeedTarget = newSpeedTarget;

    const vLs = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');
    const vMan = this.getVman(approachSpeed);
    const econMachAsCas = this.atmosphericConditions.computeCasFromMach(presentPosition.alt, managedDescentSpeedMach);
    SimVar.SetSimVarValue(
      'L:A32NX_SPEEDS_MANAGED_PFD',
      'knots',
      Math.max(vLs, vMan, Math.min(newSpeedTarget, econMachAsCas)),
    );
  }

  // TODO: This appears too many times in different places. Centralize
  private getVman(vApp: Knots): Knots {
    // TODO: I wonder where these speeds come from IRL. It's probably the FAC.
    switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
      case 0:
        return SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
      case 1:
        return SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
      case 2:
        return SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
      case 3:
      case 4:
        return vApp;
      default:
        return SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');
    }
  }

  private updateHoldSpeed(): void {
    if (!this.guidanceController.isManualHoldActive() && !this.guidanceController.isManualHoldNext()) {
      return;
    }

    let holdSpeedCas = SimVar.GetSimVarValue('L:A32NX_FM_HOLD_SPEED', 'number');
    const holdDecelReached = SimVar.GetSimVarValue('L:A32NX_FM_HOLD_DECEL', 'bool');

    const speedControlManual = Simplane.getAutoPilotAirspeedSelected();
    const isMach = Simplane.getAutoPilotMachModeActive();
    if (speedControlManual && holdDecelReached) {
      if (isMach) {
        const holdValue = Simplane.getAutoPilotMachHoldValue();
        holdSpeedCas = this.atmosphericConditions.computeCasFromMach(
          this.atmosphericConditions.currentAltitude,
          holdValue,
        );
      } else {
        holdSpeedCas = Simplane.getAutoPilotAirspeedHoldValue();
      }
    }

    const holdSpeedTas = this.atmosphericConditions.computeTasFromCas(
      this.atmosphericConditions.currentAltitude,
      holdSpeedCas,
    );

    this.guidanceController.setHoldSpeed(holdSpeedTas);
  }

  getLinearDeviation(): Feet | null {
    if (!this.aircraftToDescentProfileRelation.isValid) {
      return null;
    }

    return this.aircraftToDescentProfileRelation.computeLinearDeviation();
  }

  private shouldUpdateDescentProfile(
    newParameters: VerticalProfileComputationParameters,
    newLegs: Map<number, Leg>,
  ): boolean {
    // While in the descent phase, we don't want to update the profile anymore
    if (this.lastParameters === null) {
      return true;
    }

    return (
      newParameters.flightPhase < FmgcFlightPhase.Descent ||
      newParameters.flightPhase > FmgcFlightPhase.Approach ||
      (!this.flightPlanService.hasTemporary && this.didLegsChange(this.oldLegs, newLegs)) ||
      numberOrNanChanged(this.lastParameters.cruiseAltitude, newParameters.cruiseAltitude) ||
      numberOrNanChanged(this.lastParameters.managedDescentSpeed, newParameters.managedDescentSpeed) ||
      numberOrNanChanged(this.lastParameters.managedDescentSpeedMach, newParameters.managedDescentSpeedMach) ||
      numberOrNanChanged(this.lastParameters.approachQnh, newParameters.approachQnh) ||
      numberOrNanChanged(this.lastParameters.approachTemperature, newParameters.approachTemperature) ||
      numberOrNanChanged(this.lastParameters.descentSpeedLimit?.speed, newParameters.descentSpeedLimit?.speed) ||
      numberOrNanChanged(
        this.lastParameters.descentSpeedLimit?.underAltitude,
        newParameters.descentSpeedLimit?.underAltitude,
      )
    );
  }

  private didLegsChange(oldLegs: Map<number, Leg>, newLegs: Map<number, Leg>): boolean {
    for (const [index, legA] of newLegs) {
      const legB = oldLegs.get(index);

      if (index < this.guidanceController.activeLegIndex) {
        continue;
      }

      if (!legA?.repr !== !legB?.repr) {
        return true;
      }
    }

    return false;
  }

  /**
   * Compute predictions for EFOB, ETE, etc. at destination
   */
  public getDestinationPrediction(): VerticalWaypointPrediction | null {
    const destLegIndex = this.flightPlanService.active.destinationLegIndex;

    return this.profileManager.mcduProfile?.waypointPredictions?.get(destLegIndex);
  }

  /**
   * Compute predictions to be shown on the PERF CRZ page
   */
  public getPerfCrzToPrediction(): PerfCrzToPrediction | null {
    if (!this.profileManager.mcduProfile?.isReadyToDisplay) {
      return null;
    }

    const todOrStep = this.profileManager.mcduProfile.findVerticalCheckpoint(
      VerticalCheckpointReason.StepClimb,
      VerticalCheckpointReason.StepDescent,
      VerticalCheckpointReason.TopOfDescent,
    );

    if (!todOrStep) {
      return null;
    }

    return {
      reason: todOrStep.reason,
      distanceFromPresentPosition: todOrStep.distanceFromStart - this.constraintReader.distanceToPresentPosition,
      secondsFromPresent: todOrStep.secondsFromPresent,
    };
  }

  public findNextSpeedChange(): NauticalMiles | null {
    const { presentPosition, flightPhase, fcuAltitude, fcuSpeedManaged, fcuExpediteModeActive } =
      this.computationParametersObserver.get();

    if (!this.ndProfile || !fcuSpeedManaged || fcuExpediteModeActive || flightPhase === FmgcFlightPhase.Approach) {
      return null;
    }

    let speedTargetType: ManagedSpeedType = ManagedSpeedType.Climb;
    if (flightPhase === FmgcFlightPhase.Cruise) {
      speedTargetType = ManagedSpeedType.Cruise;
    } else if (flightPhase === FmgcFlightPhase.Descent) {
      speedTargetType = ManagedSpeedType.Descent;
    }

    const distanceToPresentPosition = this.ndProfile.distanceToPresentPosition;
    const decelPointSpeed = this.decelPoint?.speed;

    // We don't want to show the speed change dot at acceleration altiude, so we have to make sure the speed target is econ speed, not SRS speed.
    const speedTarget =
      flightPhase < FmgcFlightPhase.Climb
        ? this.currentMcduSpeedProfile.getTarget(distanceToPresentPosition, presentPosition.alt, ManagedSpeedType.Climb)
        : SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots');

    for (let i = 1; i < this.profileManager.ndProfile.checkpoints.length - 1; i++) {
      const checkpoint = this.profileManager.ndProfile.checkpoints[i];

      if (checkpoint.distanceFromStart < distanceToPresentPosition) {
        continue;
      } else if (
        checkpoint.reason === VerticalCheckpointReason.TopOfClimb ||
        checkpoint.reason === VerticalCheckpointReason.TopOfDescent
      ) {
        // At T/C, T/D, we expect to see a speed change the the respective ECON speed, but this is not indicated to the pilots
        return null;
      }

      if (speedTargetType === ManagedSpeedType.Climb || speedTargetType === ManagedSpeedType.Cruise) {
        if (
          Math.min(
            checkpoint.speed,
            this.atmosphericConditions.computeCasFromMach(checkpoint.altitude, checkpoint.mach),
          ) -
            Math.max(this.profileManager.ndProfile.checkpoints[i - 1].speed, speedTarget) >
          1
        ) {
          // Candiate for a climb speed change
          return this.profileManager.ndProfile.checkpoints[i - 1].distanceFromStart;
        }
      } else if (
        isSpeedChangePoint(checkpoint) &&
        checkpoint.targetSpeed - speedTarget < -1 &&
        checkpoint.targetSpeed >= decelPointSpeed
      ) {
        // Check if decel point, or `StartDeceleration` point with target speed lower than current target, but larger than the speed the decel point is placed at.

        // Only show deceleration to speed limit if we are going to descend below it.
        if (
          checkpoint.reason === VerticalCheckpointReason.StartDecelerationToConstraint ||
          fcuAltitude < checkpoint.altitude
        ) {
          return checkpoint.distanceFromStart;
        }
      }
    }

    return null;
  }

  public invalidateFlightPlanProfile(): void {
    this.requestDescentProfileRecomputation = true;

    // Invalidate MCDU profile, so the FPLAN page shows blank predictions
    this.profileManager.mcduProfile?.invalidate();
  }

  // Only used to check whether T/D PWP should be displayed despite not being in lat auto control
  public isFlightPhasePreflight(): boolean {
    return this.computationParametersObserver.get().flightPhase === FmgcFlightPhase.Preflight;
  }

  private updateLegSpeedPredictions(): void {
    // No VNAV predictions
    if (!this.profileManager.mcduProfile?.isReadyToDisplay) {
      return;
    }

    const geometry = this.guidanceController.activeGeometry;
    const activeLegIndex = this.guidanceController.activeLegIndex;

    for (let i = activeLegIndex; geometry.legs.get(i) || geometry.legs.get(i + 1); i++) {
      const leg = geometry.legs.get(i);
      if (!leg) {
        continue;
      } else if (!leg.calculated) {
        leg.predictedTas = undefined;
        leg.predictedGs = undefined;

        continue;
      }

      const prediction = this.profileManager.mcduProfile.interpolateEverythingFromStart(
        leg.calculated.cumulativeDistanceWithTransitions,
      );
      const tasPrediction = this.atmosphericConditions.computeTasFromCas(prediction.altitude, prediction.speed);

      // TODO: Use wind speed prediction for that leg instead of current wind speed
      const gsPrediction = tasPrediction + this.atmosphericConditions.currentWindSpeed;

      leg.predictedTas = tasPrediction;
      leg.predictedGs = gsPrediction;
    }
  }

  updateDebugInformation() {
    if (!VnavConfig.DEBUG_GUIDANCE) {
      return;
    }

    this.listener.triggerToAllSubscribers(
      'A32NX_FM_DEBUG_VNAV_STATUS',
      'A32NX FMS VNAV STATUS\n' +
        `DTG ${this.guidanceController.activeLegAlongTrackCompletePathDtg?.toFixed(2) ?? '---'} NM\n` +
        `DIST TO DEST ${this.guidanceController.alongTrackDistanceToDestination?.toFixed(2) ?? '---'} NM\n` +
        `DIST FROM START ${this.constraintReader.distanceToPresentPosition?.toFixed(2) ?? '---'} NM\n` +
        `TOTAL DIST ${this.constraintReader.totalFlightPlanDistance?.toFixed(2) ?? '---'} NM\n` +
        '---\n' +
        `MODE ${this.descentGuidance.getDesSubmode()} \n` +
        `VDEV ${this.descentGuidance.getLinearDeviation()?.toFixed(0) ?? '---'} FT\n` +
        `VS ${this.descentGuidance.getTargetVerticalSpeed()?.toFixed(0) ?? '---'} FT/MIN\n`,
    );
  }

  private updateDistanceToDestination(): void {
    const geometry = this.guidanceController.activeGeometry;
    if (!geometry || geometry.legs.size <= 0) {
      this.guidanceController.activeLegAlongTrackCompletePathDtg = undefined;
      this.guidanceController.alongTrackDistanceToDestination = undefined;

      return;
    }

    // TODO: Proper navigation
    const ppos = this.guidanceController.lnavDriver.ppos;
    const trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree');

    const activeLegIndx = this.guidanceController.activeLegIndex;
    const activeLeg = geometry.legs.get(activeLegIndx);

    let referenceLegIndex = activeLegIndx;
    if (!activeLeg) {
      referenceLegIndex = activeLegIndx + 1;
    } else if (activeLeg instanceof VMLeg || activeLeg instanceof FMLeg) {
      referenceLegIndex = activeLegIndx + 2;
    }
    const referenceLeg = geometry.legs.get(referenceLegIndex);

    if (!referenceLeg) {
      this.guidanceController.activeLegAlongTrackCompletePathDtg = undefined;
      this.guidanceController.alongTrackDistanceToDestination = undefined;

      return;
    }

    const inboundTransition = geometry.transitions.get(referenceLegIndex - 1);
    const outboundTransition = geometry.transitions.get(referenceLegIndex);

    const completeLegAlongTrackPathDtg = Geometry.completeLegAlongTrackPathDistanceToGo(
      ppos,
      trueTrack,
      referenceLeg,
      inboundTransition,
      outboundTransition,
    );

    this.guidanceController.activeLegAlongTrackCompletePathDtg = completeLegAlongTrackPathDtg;
    this.guidanceController.alongTrackDistanceToDestination = Number.isFinite(
      referenceLeg.calculated?.cumulativeDistanceToEndWithTransitions,
    )
      ? completeLegAlongTrackPathDtg + referenceLeg.calculated.cumulativeDistanceToEndWithTransitions
      : undefined;
  }

  shouldShowTooSteepPathAhead(): boolean {
    return this.profileManager.shouldShowTooSteepPathAhead();
  }
}

/// To check whether the value changed from old to new, but not if both values are NaN. (NaN !== NaN in JS)
export function numberOrNanChanged(oldValue: number, newValue: number): boolean {
  return (!Number.isNaN(oldValue) || !Number.isNaN(newValue)) && oldValue !== newValue;
}
