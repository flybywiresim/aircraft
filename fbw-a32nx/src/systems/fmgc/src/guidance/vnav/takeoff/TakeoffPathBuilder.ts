// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { Common, FlapConf } from '@fmgc/guidance/vnav/common';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { Predictions } from '@fmgc/guidance/vnav/Predictions';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';

export class TakeoffPathBuilder {
  constructor(
    private observer: VerticalProfileComputationParametersObserver,
    private atmosphericConditions: AtmosphericConditions,
  ) {}

  buildTakeoffPath(profile: BaseGeometryProfile, config: AircraftConfig) {
    this.addTakeoffRollCheckpoint(profile);
    this.buildPathToThrustReductionAltitude(profile, config);
    this.buildPathToAccelerationAltitude(profile, config);
  }

  private addTakeoffRollCheckpoint(profile: BaseGeometryProfile) {
    const { departureElevation, v2Speed, fuelOnBoard, managedClimbSpeedMach } = this.observer.get();

    profile.checkpoints.push({
      reason: VerticalCheckpointReason.Liftoff,
      distanceFromStart: 0,
      secondsFromPresent: 0,
      altitude: departureElevation,
      remainingFuelOnBoard: fuelOnBoard,
      speed: v2Speed + 10,
      mach: managedClimbSpeedMach,
    });
  }

  private buildPathToThrustReductionAltitude(profile: BaseGeometryProfile, config: AircraftConfig) {
    const {
      perfFactor,
      zeroFuelWeight,
      v2Speed,
      tropoPause,
      thrustReductionAltitude,
      takeoffFlapsSetting,
      managedClimbSpeedMach,
    } = this.observer.get();

    const lastCheckpoint = profile.lastCheckpoint;

    const startingAltitude = lastCheckpoint.altitude;
    const midwayAltitude = (startingAltitude + thrustReductionAltitude) / 2;

    const predictedN1 = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA', 'Number');
    const speed = v2Speed + 10;

    const delta = Common.getDelta(midwayAltitude, midwayAltitude > tropoPause);
    const mach = Common.CAStoMach(speed, delta);
    const theta = Common.getTheta(midwayAltitude, this.atmosphericConditions.isaDeviation, midwayAltitude > tropoPause);
    const theta2 = Common.getTheta2(theta, mach);
    const correctedN1 = EngineModel.getCorrectedN1(predictedN1, theta2);

    const { fuelBurned, distanceTraveled, timeElapsed } = Predictions.altitudeStep(
      config,
      startingAltitude,
      thrustReductionAltitude - startingAltitude,
      speed,
      managedClimbSpeedMach,
      correctedN1,
      zeroFuelWeight,
      profile.lastCheckpoint.remainingFuelOnBoard,
      0,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
      false,
      takeoffFlapsSetting,
      false,
      perfFactor,
    );

    profile.checkpoints.push({
      reason: VerticalCheckpointReason.ThrustReductionAltitude,
      distanceFromStart: profile.lastCheckpoint.distanceFromStart + distanceTraveled,
      secondsFromPresent: profile.lastCheckpoint.secondsFromPresent + timeElapsed,
      altitude: thrustReductionAltitude,
      remainingFuelOnBoard: profile.lastCheckpoint.remainingFuelOnBoard - fuelBurned,
      speed,
      mach: managedClimbSpeedMach,
    });
  }

  private buildPathToAccelerationAltitude(profile: BaseGeometryProfile, config: AircraftConfig) {
    const lastCheckpoint = profile.lastCheckpoint;
    const { accelerationAltitude, v2Speed, zeroFuelWeight, perfFactor, tropoPause, managedClimbSpeedMach } =
      this.observer.get();

    const speed = v2Speed + 10;
    const startingAltitude = lastCheckpoint.altitude;
    const midwayAltitude = (startingAltitude + accelerationAltitude) / 2;

    const v2PlusTenMach = this.atmosphericConditions.computeMachFromCas(midwayAltitude, speed);
    const estimatedTat = this.atmosphericConditions.totalAirTemperatureFromMach(midwayAltitude, v2PlusTenMach);

    const predictedN1 = EngineModel.getClimbThrustCorrectedN1(
      config.engineModelParameters,
      midwayAltitude,
      estimatedTat,
    );

    const { fuelBurned, distanceTraveled, timeElapsed } = Predictions.altitudeStep(
      config,
      startingAltitude,
      accelerationAltitude - startingAltitude,
      speed,
      1, // We never want to compute this in Mach, so we set the critical Mach to 1
      predictedN1,
      zeroFuelWeight,
      lastCheckpoint.remainingFuelOnBoard,
      0,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
      false,
      FlapConf.CLEAN,
      false,
      perfFactor,
    );

    profile.checkpoints.push({
      reason: VerticalCheckpointReason.AccelerationAltitude,
      distanceFromStart: lastCheckpoint.distanceFromStart + distanceTraveled,
      secondsFromPresent: lastCheckpoint.secondsFromPresent + timeElapsed,
      altitude: accelerationAltitude,
      remainingFuelOnBoard: lastCheckpoint.remainingFuelOnBoard - fuelBurned,
      speed,
      mach: managedClimbSpeedMach,
    });
  }
}
