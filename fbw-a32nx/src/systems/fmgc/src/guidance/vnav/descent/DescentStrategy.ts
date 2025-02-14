// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { FlightPathAngleStrategy, VerticalSpeedStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import {
  AircraftConfiguration as AircraftCtlSurfcConfiguration,
  DEFAULT_AIRCRAFT_CONTROL_SURFACE_CONFIG,
} from '@fmgc/guidance/vnav/descent/ApproachPathBuilder';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { Predictions, StepResults } from '@fmgc/guidance/vnav/Predictions';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { WindComponent } from '@fmgc/guidance/vnav/wind';

export interface DescentStrategy {
  /**
   * Computes predictions for a single segment using the atmospheric conditions in the middle.
   * @param initialAltitude Altitude at the start of descent
   * @param finalAltitude Altitude to terminate the descent
   * @param speed
   * @param mach
   * @param fuelOnBoard Remainging fuel on board at the start of the descent
   * @returns `StepResults`
   */
  predictToAltitude(
    initialAltitude: number,
    finalAltitude: number,
    speed: Knots,
    mach: Mach,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config?: AircraftCtlSurfcConfiguration,
  ): StepResults;

  /**
   * Computes a descent step forwards
   * @param initialAltitude Altitude that you should end up at after descending
   * @param distance
   * @param speed
   * @param mach
   * @param fuelOnBoard
   */
  predictToDistance(
    initialAltitude: number,
    distance: NauticalMiles,
    speed: Knots,
    mach: Mach,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config?: AircraftCtlSurfcConfiguration,
  ): StepResults;

  /**
   * Computes a step from an initial altitude until the aircraft reaches finalSpeed
   * @param initialAltitude
   * @param initialSpeed
   * @param finalSpeed
   * @param mach
   * @param fuelOnBoard
   */
  predictToSpeed(
    initialAltitude: number,
    finalSpeed: Knots,
    initialSpeed: Knots,
    mach: Mach,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config?: AircraftCtlSurfcConfiguration,
  ): StepResults;
}

export class DesModeStrategy implements DescentStrategy {
  private readonly decelerationStrategy: DescentStrategy;

  private constructor(
    observer: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    private readonly descentStrategy: DescentStrategy,
    private readonly acConfig: AircraftConfig,
  ) {
    this.decelerationStrategy = new IdleDescentStrategy(observer, atmosphericConditions, this.acConfig);
  }

  static aboveProfile(
    observer: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    acConfig: AircraftConfig,
  ): DesModeStrategy {
    return new DesModeStrategy(
      observer,
      atmosphericConditions,
      new IdleDescentStrategy(observer, atmosphericConditions, acConfig, {
        flapConfig: FlapConf.CLEAN,
        gearExtended: false,
        speedbrakesExtended: true,
      }),
      acConfig,
    );
  }

  static belowProfileVs(
    observer: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    verticalSpeed: FeetPerMinute,
    acConfig: AircraftConfig,
  ): DescentStrategy {
    return new DesModeStrategy(
      observer,
      atmosphericConditions,
      new VerticalSpeedStrategy(observer, atmosphericConditions, verticalSpeed, acConfig),
      acConfig,
    );
  }

  static belowProfileFpa(
    observer: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    flightPathAngle: Degrees,
    acConfig: AircraftConfig,
  ): DescentStrategy {
    return new DesModeStrategy(
      observer,
      atmosphericConditions,
      new FlightPathAngleStrategy(observer, atmosphericConditions, flightPathAngle, acConfig),
      acConfig,
    );
  }

  predictToAltitude(
    initialAltitude: number,
    finalAltitude: number,
    speed: number,
    mach: number,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config?: AircraftCtlSurfcConfiguration,
  ): StepResults {
    return this.descentStrategy.predictToAltitude(
      initialAltitude,
      finalAltitude,
      speed,
      mach,
      fuelOnBoard,
      headwindComponent,
      config,
    );
  }

  predictToDistance(
    initialAltitude: number,
    distance: number,
    speed: number,
    mach: number,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config?: AircraftCtlSurfcConfiguration,
  ): StepResults {
    return this.descentStrategy.predictToDistance(
      initialAltitude,
      distance,
      speed,
      mach,
      fuelOnBoard,
      headwindComponent,
      config,
    );
  }

  predictToSpeed(
    initialAltitude: number,
    finalSpeed: number,
    initialSpeed: number,
    mach: number,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config?: AircraftCtlSurfcConfiguration,
  ): StepResults {
    return this.decelerationStrategy.predictToSpeed(
      initialAltitude,
      finalSpeed,
      initialSpeed,
      mach,
      fuelOnBoard,
      headwindComponent,
      config,
    );
  }
}

export class IdleDescentStrategy implements DescentStrategy {
  constructor(
    private observer: VerticalProfileComputationParametersObserver,
    private atmosphericConditions: AtmosphericConditions,
    private readonly acConfig: AircraftConfig,
    private defaultConfig: AircraftCtlSurfcConfiguration = DEFAULT_AIRCRAFT_CONTROL_SURFACE_CONFIG,
  ) {}

  predictToAltitude(
    initialAltitude: number,
    finalAltitude: number,
    speed: number,
    mach: number,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config: Partial<AircraftCtlSurfcConfiguration> = this.defaultConfig,
  ): StepResults {
    const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();
    const { flapConfig, gearExtended, speedbrakesExtended } = { ...this.defaultConfig, ...config };

    const midwayAltitude = (initialAltitude + finalAltitude) / 2;
    const computedMach = Math.min(this.atmosphericConditions.computeMachFromCas(midwayAltitude, speed), mach);
    const predictedN1 =
      EngineModel.getIdleCorrectedN1(this.acConfig.engineModelParameters, midwayAltitude, computedMach, tropoPause) +
      this.acConfig.vnavConfig.IDLE_N1_MARGIN;

    return Predictions.altitudeStep(
      this.acConfig,
      initialAltitude,
      finalAltitude - initialAltitude,
      speed,
      mach,
      predictedN1,
      zeroFuelWeight,
      fuelOnBoard,
      headwindComponent.value,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
      speedbrakesExtended,
      flapConfig,
      gearExtended,
      perfFactor,
    );
  }

  predictToDistance(
    initialAltitude: number,
    distance: number,
    speed: number,
    mach: number,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config: Partial<AircraftCtlSurfcConfiguration> = this.defaultConfig,
  ): StepResults {
    const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();
    const { flapConfig, gearExtended, speedbrakesExtended } = { ...this.defaultConfig, ...config };

    const computedMach = Math.min(this.atmosphericConditions.computeMachFromCas(initialAltitude, speed), mach);
    const predictedN1 =
      EngineModel.getIdleCorrectedN1(this.acConfig.engineModelParameters, initialAltitude, computedMach, tropoPause) +
      this.acConfig.vnavConfig.IDLE_N1_MARGIN;

    return Predictions.distanceStep(
      this.acConfig,
      initialAltitude,
      distance,
      speed,
      mach,
      predictedN1,
      zeroFuelWeight,
      fuelOnBoard,
      headwindComponent.value,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
      speedbrakesExtended,
      flapConfig,
      gearExtended,
      perfFactor,
    );
  }

  predictToSpeed(
    initialAltitude: number,
    finalSpeed: Knots,
    initialSpeed: Knots,
    mach: Mach,
    fuelOnBoard: number,
    headwindComponent: WindComponent,
    config: Partial<AircraftCtlSurfcConfiguration> = this.defaultConfig,
  ): StepResults {
    const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();
    const { flapConfig, gearExtended, speedbrakesExtended } = { ...this.defaultConfig, ...config };

    const computedMach = Math.min(this.atmosphericConditions.computeMachFromCas(initialAltitude, initialSpeed), mach);
    const predictedN1 =
      EngineModel.getIdleCorrectedN1(this.acConfig.engineModelParameters, initialAltitude, computedMach, tropoPause) +
      this.acConfig.vnavConfig.IDLE_N1_MARGIN;

    const initialMach = Math.min(this.atmosphericConditions.computeMachFromCas(initialAltitude, initialSpeed), mach);
    const finalMach = Math.min(this.atmosphericConditions.computeMachFromCas(initialAltitude, finalSpeed), mach);

    return Predictions.speedChangeStep(
      this.acConfig,
      -1,
      initialAltitude,
      initialSpeed,
      finalSpeed,
      initialMach,
      finalMach,
      predictedN1,
      zeroFuelWeight,
      fuelOnBoard,
      headwindComponent.value,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
      gearExtended,
      flapConfig,
      speedbrakesExtended,
      perfFactor,
    );
  }
}
