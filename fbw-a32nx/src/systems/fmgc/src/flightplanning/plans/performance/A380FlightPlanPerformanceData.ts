// Copyright (c) 2021-2026 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';
import { MappedSubject, MutableSubscribable, Subject, Subscription } from '@microsoft/msfs-sdk';
import {
  ClimbDerated,
  CostIndexMode,
  DefaultPerformanceData,
  FlightPlanPerformanceData,
  FlightPlanPerformanceDataProperties,
  SerializedFlightPlanPerformanceData,
  TakeoffAntiIce,
  TakeoffDerated,
  TakeoffPacks,
  TakeoffPowerSetting,
} from './FlightPlanPerformanceData';
import { FlightPlanWindEntry, WindVector } from '../../data/wind';

// TODO this should go to fbw-a380x/ once FMS is moved to fbw-common
export class A380FlightPlanPerformanceData implements FlightPlanPerformanceData {
  private readonly subscriptions: Map<keyof FlightPlanPerformanceDataProperties & string, Subscription> = new Map();

  constructor(defaultTaxiFuel = 1.5) {
    this.defaultTaxiFuel.set(defaultTaxiFuel);
  }

  public clone(): this {
    const cloned = new A380FlightPlanPerformanceData();

    this.assignFieldsFromOriginal(cloned);

    return cloned as this;
  }

  protected assignFieldsFromOriginal(cloned: FlightPlanPerformanceData): FlightPlanPerformanceData {
    cloned.v1.set(this.v1.get());
    cloned.vr.set(this.vr.get());
    cloned.v2.set(this.v2.get());

    cloned.pilotThrustReductionAltitude.set(this.pilotThrustReductionAltitude.get());
    cloned.defaultThrustReductionAltitude.set(this.defaultThrustReductionAltitude.get());

    cloned.pilotAccelerationAltitude.set(this.pilotAccelerationAltitude.get());
    cloned.defaultAccelerationAltitude.set(this.defaultAccelerationAltitude.get());

    cloned.pilotEngineOutAccelerationAltitude.set(this.pilotEngineOutAccelerationAltitude.get());
    cloned.defaultEngineOutAccelerationAltitude.set(this.defaultEngineOutAccelerationAltitude.get());

    cloned.pilotMissedThrustReductionAltitude.set(this.pilotMissedThrustReductionAltitude.get());
    cloned.defaultMissedThrustReductionAltitude.set(this.defaultMissedThrustReductionAltitude.get());

    cloned.pilotMissedAccelerationAltitude.set(this.pilotMissedAccelerationAltitude.get());
    cloned.defaultMissedAccelerationAltitude.set(this.defaultMissedAccelerationAltitude.get());

    cloned.pilotMissedEngineOutAccelerationAltitude.set(this.pilotMissedEngineOutAccelerationAltitude.get());
    cloned.defaultMissedEngineOutAccelerationAltitude.set(this.defaultMissedEngineOutAccelerationAltitude.get());

    cloned.databaseTransitionAltitude.set(this.databaseTransitionAltitude.get());
    cloned.pilotTransitionAltitude.set(this.pilotTransitionAltitude.get());

    cloned.databaseTransitionLevel.set(this.databaseTransitionLevel.get());
    cloned.pilotTransitionLevel.set(this.pilotTransitionLevel.get());

    cloned.cruiseFlightLevel.set(this.cruiseFlightLevel.get());
    cloned.cruiseTemperatureIsaTemp?.set(this.cruiseTemperatureIsaTemp.get());
    cloned.cruiseTemperaturePilotEntry.set(this.cruiseTemperaturePilotEntry.get());
    cloned.costIndex.set(this.costIndex.get());
    cloned.pilotTropopause.set(this.pilotTropopause.get());
    cloned.defaultTropopause.set(this.defaultTropopause.get());

    cloned.climbSpeedLimitSpeed.set(this.climbSpeedLimitSpeed.get());
    cloned.climbSpeedLimitAltitude.set(this.climbSpeedLimitAltitude.get());
    cloned.isClimbSpeedLimitPilotEntered.set(this.isClimbSpeedLimitPilotEntered.get());

    cloned.descentSpeedLimitSpeed.set(this.descentSpeedLimitSpeed.get());
    cloned.descentSpeedLimitAltitude.set(this.descentSpeedLimitAltitude.get());
    cloned.isDescentSpeedLimitPilotEntered.set(this.isDescentSpeedLimitPilotEntered.get());

    cloned.alternateClimbSpeedLimitSpeed.set(this.alternateClimbSpeedLimitSpeed.get());
    cloned.alternateClimbSpeedLimitAltitude.set(this.alternateClimbSpeedLimitAltitude.get());
    cloned.isAlternateClimbSpeedLimitPilotEntered.set(this.isAlternateClimbSpeedLimitPilotEntered.get());

    cloned.alternateDescentSpeedLimitSpeed.set(this.alternateDescentSpeedLimitSpeed.get());
    cloned.alternateDescentSpeedLimitAltitude.set(this.alternateDescentSpeedLimitAltitude.get());
    cloned.isAlternateDescentSpeedLimitPilotEntered.set(this.isAlternateDescentSpeedLimitPilotEntered.get());

    cloned.zeroFuelWeight.set(this.zeroFuelWeight.get());
    cloned.zeroFuelWeightCenterOfGravity.set(this.zeroFuelWeightCenterOfGravity.get());
    cloned.blockFuel.set(this.blockFuel.get());
    cloned.pilotTaxiFuel.set(this.pilotTaxiFuel.get());
    cloned.defaultTaxiFuel.set(this.defaultTaxiFuel.get());
    cloned.pilotRouteReserveFuel.set(this.pilotRouteReserveFuel.get());
    cloned.pilotRouteReserveFuelPercentage.set(this.pilotRouteReserveFuelPercentage.get());
    cloned.defaultRouteReserveFuelPercentage.set(this.defaultRouteReserveFuelPercentage.get());
    cloned.pilotAlternateFuel.set(this.pilotAlternateFuel.get());
    cloned.pilotFinalHoldingFuel.set(this.pilotFinalHoldingFuel.get());
    cloned.pilotFinalHoldingTime.set(this.pilotFinalHoldingTime.get());
    cloned.defaultFinalHoldingTime.set(this.defaultFinalHoldingTime.get());
    cloned.pilotMinimumDestinationFuelOnBoard.set(this.pilotMinimumDestinationFuelOnBoard.get());
    cloned.pilotTripWind.set(this.pilotTripWind.get());

    cloned.takeoffShift.set(this.takeoffShift.get());
    cloned.takeoffFlaps.set(this.takeoffFlaps.get());
    cloned.trimmableHorizontalStabilizer.set(this.trimmableHorizontalStabilizer.get());
    cloned.flexTakeoffTemperature.set(this.flexTakeoffTemperature.get());
    cloned.preselectedClimbSpeed.set(this.preselectedClimbSpeed.get());
    cloned.preselectedCruiseSpeed.set(this.preselectedCruiseSpeed.get());
    cloned.pilotManagedDescentSpeed.set(this.pilotManagedDescentSpeed.get());
    cloned.pilotManagedDescentMach.set(this.pilotManagedDescentMach.get());
    cloned.approachQnh.set(this.approachQnh.get());
    cloned.approachTemperature.set(this.approachTemperature.get());
    cloned.approachWindDirection.set(this.approachWindDirection.get());
    cloned.approachWindMagnitude.set(this.approachWindMagnitude.get());
    cloned.isApproachWindPilotEntered.set(this.isApproachWindPilotEntered.get());
    cloned.pilotVapp.set(this.pilotVapp.get());
    cloned.approachBaroMinimum.set(this.approachBaroMinimum.get());
    cloned.approachRadioMinimum.set(this.approachRadioMinimum.get());
    cloned.approachFlapsThreeSelected.set(this.approachFlapsThreeSelected.get());
    cloned.estimatedTakeoffTime.set(this.estimatedTakeoffTime.get());
    cloned.estimatedTakeoffTimeExpired.set(this.estimatedTakeoffTimeExpired.get());

    cloned.paxNumber?.set(this.paxNumber.get());
    cloned.takeoffPowerSetting?.set(this.takeoffPowerSetting.get());
    cloned.takeoffDeratedSetting?.set(this.takeoffDeratedSetting.get());
    cloned.takeoffThsFor?.set(this.takeoffThsFor.get());
    cloned.takeoffPacks?.set(this.takeoffPacks.get());
    cloned.takeoffAntiIce?.set(this.takeoffAntiIce.get());
    cloned.noiseEnabled?.set(this.noiseEnabled.get());
    cloned.noiseN1?.set(this.noiseN1.get());
    cloned.noiseSpeed?.set(this.noiseSpeed.get());
    cloned.noiseEndAltitude?.set(this.noiseEndAltitude.get());
    cloned.costIndexMode?.set(this.costIndexMode.get());
    cloned.climbDerated?.set(this.climbDerated.get());
    cloned.descentCabinRate?.set(this.descentCabinRate.get());

    return cloned;
  }

  pipeTo(other: FlightPlanPerformanceData, isBeforeEngineStart: boolean): void {
    this.pipe('cruiseFlightLevel', this.cruiseFlightLevel, other.cruiseFlightLevel);
    this.pipe('cruiseTemperaturePilotEntry', this.cruiseTemperaturePilotEntry, other.cruiseTemperaturePilotEntry);
    this.pipe('pilotTropopause', this.pilotTropopause, other.pilotTropopause);
    this.pipe('costIndex', this.costIndex, other.costIndex);
    this.pipe('pilotRouteReserveFuel', this.pilotRouteReserveFuel, other.pilotRouteReserveFuel);
    this.pipe(
      'pilotRouteReserveFuelPercentage',
      this.pilotRouteReserveFuelPercentage,
      other.pilotRouteReserveFuelPercentage,
    );
    this.pipe('pilotFinalHoldingFuel', this.pilotFinalHoldingFuel, other.pilotFinalHoldingFuel);
    this.pipe('pilotFinalHoldingTime', this.pilotFinalHoldingTime, other.pilotFinalHoldingTime);

    if (other.cruiseTemperatureIsaTemp) {
      this.pipe('cruiseTemperatureIsaTemp', this.cruiseTemperatureIsaTemp, other.cruiseTemperatureIsaTemp);
    }
    if (other.paxNumber) {
      this.pipe('paxNumber', this.paxNumber, other.paxNumber);
    }

    if (other.costIndexMode) {
      this.pipe('costIndexMode', this.costIndexMode, other.costIndexMode);
    }

    if (isBeforeEngineStart) {
      this.pipe('zeroFuelWeight', this.zeroFuelWeight, other.zeroFuelWeight);
      this.pipe(
        'zeroFuelWeightCenterOfGravity',
        this.zeroFuelWeightCenterOfGravity,
        other.zeroFuelWeightCenterOfGravity,
      );
      this.pipe(
        'pilotMinimumDestinationFuelOnBoard',
        this.pilotMinimumDestinationFuelOnBoard,
        other.pilotMinimumDestinationFuelOnBoard,
      );
      this.pipe('blockFuel', this.blockFuel, other.blockFuel);
      this.pipe('estimatedTakeoffTime', this.estimatedTakeoffTime, other.estimatedTakeoffTime);
      this.pipe('estimatedTakeoffTimeExpired', this.estimatedTakeoffTimeExpired, other.estimatedTakeoffTimeExpired);
    }
  }

  protected pipe<T>(
    key: keyof FlightPlanPerformanceDataProperties & string,
    from: MutableSubscribable<T>,
    to: MutableSubscribable<T>,
  ): void {
    // Just in case we've somehow already linked this key to something, we destory the subscription first.
    this.subscriptions.get(key)?.destroy();
    this.subscriptions.set(key, from.pipe(to));
  }

  public destroy(): void {
    this.subscriptions.forEach((sub) => sub.destroy());
    this.subscriptions.clear();
  }

  public hasSubscription(key: keyof FlightPlanPerformanceDataProperties & string): boolean {
    return this.subscriptions.has(key);
  }

  readonly cruiseFlightLevel = Subject.create<number | null>(null);

  readonly cruiseTemperatureIsaTemp = Subject.create<number | null>(null);

  readonly cruiseTemperaturePilotEntry = Subject.create<number | null>(null);

  readonly cruiseTemperature = MappedSubject.create(
    ([isa, pe]) => (pe !== null ? pe : isa),
    this.cruiseTemperatureIsaTemp,
    this.cruiseTemperaturePilotEntry,
  );

  readonly isCruiseTemperaturePilotEntered = this.cruiseTemperaturePilotEntry.map((it) => it !== null);

  /**
   * Cost index; Unit: No unit; Null if not set.
   */
  readonly costIndex = Subject.create<number | null>(null);

  /**
   * Tropopause altitude entered by the pilot; Unit: Feet; Null if not set.
   */
  readonly pilotTropopause = Subject.create<number | null>(null);

  /**
   * Default tropopause altitude; Unit: Feet; Null if not set.
   */
  readonly defaultTropopause = Subject.create<number>(36090);

  readonly tropopause = MappedSubject.create(
    ([pilotTropopause, defaultTropopause]) => {
      const rawAlt = pilotTropopause ?? defaultTropopause;
      return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
    },
    this.pilotTropopause,
    this.defaultTropopause,
  );

  /**
   * Whether tropopause is pilot entered.
   */
  readonly tropopauseIsPilotEntered = MappedSubject.create(
    ([pilotTropopause]) => pilotTropopause !== null,
    this.pilotTropopause,
  );

  /**
   * V1 speed; Unit: Knots; Null if not set.
   */
  readonly v1 = Subject.create<number | null>(null);

  /**
   * Vr speed; Unit: Knots; Null if not set.
   */
  readonly vr = Subject.create<number | null>(null);

  /**
   * V2 speed; Unit: Knots; Null if not set.
   */
  readonly v2 = Subject.create<number | null>(null);

  // THR RED

  /**
   * Pilot entered thrust reduction altitude; Unit: Feet; Null if not set.
   */
  readonly pilotThrustReductionAltitude = Subject.create<number | null>(null);

  /**
   * Thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultThrustReductionAltitude = Subject.create<number | null>(null);

  /**
   * Pilot entered thrust reduction altitude if set, from nav database otherwise; Unit: Feet; Null if not set.
   */
  readonly thrustReductionAltitude = MappedSubject.create(
    ([pilotThrustReductionAltitude, defaultThrustReductionAltitude]) => {
      const rawAlt = pilotThrustReductionAltitude ?? defaultThrustReductionAltitude;
      return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
    },
    this.pilotThrustReductionAltitude,
    this.defaultThrustReductionAltitude,
  );

  /**
   * Whether thrust reduction altitude is pilot entered;
   */
  readonly thrustReductionAltitudeIsPilotEntered = MappedSubject.create(
    ([pilotThrustReductionAltitude]) => pilotThrustReductionAltitude !== null,
    this.pilotThrustReductionAltitude,
  );

  // ACC

  /**
   * Pilot entered acceleration altitude; Unit: Feet; Null if not set.
   */
  readonly pilotAccelerationAltitude = Subject.create<number | null>(null);

  /**
   * Acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultAccelerationAltitude = Subject.create<number | null>(null);

  /**
   * Returns pilot entered acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  readonly accelerationAltitude = MappedSubject.create(
    ([pilotAccelerationAltitude, defaultAccelerationAltitude]) => {
      const rawAlt = pilotAccelerationAltitude ?? defaultAccelerationAltitude;
      return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
    },
    this.pilotAccelerationAltitude,
    this.defaultAccelerationAltitude,
  );

  /**
   * Whether acceleration altitude is pilot entered; Null if not set.
   */
  readonly accelerationAltitudeIsPilotEntered = MappedSubject.create(
    ([pilotAccelerationAltitude]) => pilotAccelerationAltitude !== null,
    this.pilotAccelerationAltitude,
  );

  // EO ACC

  /**
   * Pilot entered engine-out acceleration altitude; Unit: Feet; Null if not set.
   */
  readonly pilotEngineOutAccelerationAltitude = Subject.create<number | null>(null);

  /**
   * Engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultEngineOutAccelerationAltitude = Subject.create<number | null>(null);

  /**
   * Returns pilot entered engine-out acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  readonly engineOutAccelerationAltitude = MappedSubject.create(
    ([pilotEngineOutAccelerationAltitude, defaultEngineOutAccelerationAltitude]) => {
      const rawAlt = pilotEngineOutAccelerationAltitude ?? defaultEngineOutAccelerationAltitude;
      return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
    },
    this.pilotEngineOutAccelerationAltitude,
    this.defaultEngineOutAccelerationAltitude,
  );

  /**
   * Whether engine-out acceleration altitude is pilot entered; Null if not set.
   */
  readonly engineOutAccelerationAltitudeIsPilotEntered = MappedSubject.create(
    ([pilotEngineOutAccelerationAltitude]) => pilotEngineOutAccelerationAltitude !== null,
    this.pilotEngineOutAccelerationAltitude,
  );

  // MISSED THR RED

  /**
   * Pilot entered missed apch thrust reduction altitude; Unit: Feet; Null if not set.
   */
  readonly pilotMissedThrustReductionAltitude = Subject.create<number | null>(null);

  /**
   * Missed apch thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedThrustReductionAltitude = Subject.create<number | null>(null);

  /**
   * Returns pilot entered missed apch thrust reduction altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  readonly missedThrustReductionAltitude = MappedSubject.create(
    ([pilotMissedThrustReductionAltitude, defaultMissedThrustReductionAltitude]) => {
      const rawAlt = pilotMissedThrustReductionAltitude ?? defaultMissedThrustReductionAltitude;
      return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
    },
    this.pilotMissedThrustReductionAltitude,
    this.defaultMissedThrustReductionAltitude,
  );

  /**
   * Whether missed apch thrust reduction altitude is pilot entered
   */
  readonly missedThrustReductionAltitudeIsPilotEntered = MappedSubject.create(
    ([pilotMissedThrustReductionAltitude]) => pilotMissedThrustReductionAltitude !== null,
    this.pilotMissedThrustReductionAltitude,
  );

  // MISSED ACC

  /**
   * Pilot entered missed apch acceleration altitude; Unit: Feet; Null if not set.
   */
  readonly pilotMissedAccelerationAltitude = Subject.create<number | null>(null);

  /**
   * Missed apch acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedAccelerationAltitude = Subject.create<number | null>(null);

  /**
   * Returns pilot entered missed apch acceleration altitude of set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  readonly missedAccelerationAltitude = MappedSubject.create(
    ([pilotMissedAccelerationAltitude, defaultMissedAccelerationAltitude]) => {
      const rawAlt = pilotMissedAccelerationAltitude ?? defaultMissedAccelerationAltitude;
      return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
    },
    this.pilotMissedAccelerationAltitude,
    this.defaultMissedAccelerationAltitude,
  );

  /**
   * Whether missed apch acceleration altitude is pilot entered
   */
  readonly missedAccelerationAltitudeIsPilotEntered = MappedSubject.create(
    ([pilotMissedAccelerationAltitude]) => pilotMissedAccelerationAltitude !== null,
    this.pilotMissedAccelerationAltitude,
  );

  // MISSED EO ACC

  /**
   * Pilot entered missed apch engine-out acceleration altitude; Unit: Feet; Null if not set.
   */
  readonly pilotMissedEngineOutAccelerationAltitude = Subject.create<number | null>(null);

  /**
   * Missed apch engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedEngineOutAccelerationAltitude = Subject.create<number | null>(null);

  /**
   * Returns pilot entered missed apch engine-out acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  readonly missedEngineOutAccelerationAltitude = MappedSubject.create(
    ([pilotMissedEngineOutAccelerationAltitude, defaultMissedEngineOutAccelerationAltitude]) => {
      const rawAlt = pilotMissedEngineOutAccelerationAltitude ?? defaultMissedEngineOutAccelerationAltitude;
      return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
    },
    this.pilotMissedEngineOutAccelerationAltitude,
    this.defaultMissedEngineOutAccelerationAltitude,
  );

  /**
   * Whether missed apch engine-out acceleration altitude is pilot entered
   */
  readonly missedEngineOutAccelerationAltitudeIsPilotEntered = MappedSubject.create(
    ([pilotMissedEngineOutAccelerationAltitude]) => pilotMissedEngineOutAccelerationAltitude !== null,
    this.pilotMissedEngineOutAccelerationAltitude,
  );

  /**
   * Transition altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly databaseTransitionAltitude = Subject.create<number | null>(null);

  /**
   * Transition level from database; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly pilotTransitionAltitude = Subject.create<number | null>(null);

  /**
   * Returns pilot entered altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  readonly transitionAltitude = MappedSubject.create(
    ([pilotTransitionAltitude, databaseTransitionAltitude]) => {
      const rawAlt = pilotTransitionAltitude ?? databaseTransitionAltitude;
      return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
    },
    this.pilotTransitionAltitude,
    this.databaseTransitionAltitude,
  );

  /**
   * Whether returned transition altitude is from nav database;
   */
  readonly transitionAltitudeIsFromDatabase = MappedSubject.create(
    ([pilotTransitionAltitude]) => pilotTransitionAltitude === null,
    this.pilotTransitionAltitude,
  );

  /**
   * Transition level from database; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly databaseTransitionLevel = Subject.create<number | null>(null);

  /**
   * Pilot entered transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly pilotTransitionLevel = Subject.create<number | null>(null);

  /**
   * Transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly transitionLevel = MappedSubject.create(
    ([pilotTransitionLevel, databaseTransitionLevel]) => {
      const rawLevel = pilotTransitionLevel ?? databaseTransitionLevel;
      return rawLevel !== null ? MathUtils.round(rawLevel, 1) : null;
    },
    this.pilotTransitionLevel,
    this.databaseTransitionLevel,
  );

  /**
   * Whether returned transition level is from nav database;
   */
  readonly transitionLevelIsFromDatabase = MappedSubject.create(
    ([pilotTransitionLevel]) => pilotTransitionLevel === null,
    this.pilotTransitionLevel,
  );

  /**
   * The maximum speed imposed by the climb speed limit of the main flight plan or null if not set.
   */
  readonly climbSpeedLimitSpeed = Subject.create<number | null>(DefaultPerformanceData.ClimbSpeedLimitSpeed);

  /**
   * The altitude below which the climb speed limit of the main flight plan applies or null if not set.
   */
  readonly climbSpeedLimitAltitude = Subject.create<number | null>(DefaultPerformanceData.ClimbSpeedLimitAltitude);

  /**
   * Whether the climb speed limit is pilot entered.
   */
  readonly isClimbSpeedLimitPilotEntered = Subject.create<boolean>(false);

  /**
   * The maximum speed imposed by the descent speed limit of the main flight plan or null if not set.
   */
  readonly descentSpeedLimitSpeed = Subject.create<number | null>(DefaultPerformanceData.DescentSpeedLimitSpeed);

  /**
   * The altitude below which the descent speed limit of the main flight plan applies or null if not set.
   */
  readonly descentSpeedLimitAltitude = Subject.create<number | null>(DefaultPerformanceData.DescentSpeedLimitAltitude);

  /**
   * Whether the descent speed limit of the main flight plan is pilot entered.
   */
  readonly isDescentSpeedLimitPilotEntered = Subject.create<boolean>(false);

  /**
   * The maximum speed imposed by the climb speed limit of the alternate flight plan or null if not set.
   */
  readonly alternateClimbSpeedLimitSpeed = Subject.create<number | null>(DefaultPerformanceData.ClimbSpeedLimitSpeed);

  /**
   * The altitude below which the climb speed limit of the alternate flight plan applies or null if not set.
   */
  readonly alternateClimbSpeedLimitAltitude = Subject.create<number | null>(
    DefaultPerformanceData.ClimbSpeedLimitAltitude,
  );

  /**
   * Whether the climb speed limit of the alternate flight plan is pilot entered.
   */
  readonly isAlternateClimbSpeedLimitPilotEntered = Subject.create<boolean>(false);

  /**
   * The maximum speed imposed by the descent speed limit of the alternate flight plan or null if not set.
   */
  readonly alternateDescentSpeedLimitSpeed = Subject.create<number | null>(
    DefaultPerformanceData.DescentSpeedLimitSpeed,
  );

  /**
   * The altitude below which the descent speed limit of the alternate flight plan applies or null if not set.
   */
  readonly alternateDescentSpeedLimitAltitude = Subject.create<number | null>(
    DefaultPerformanceData.DescentSpeedLimitAltitude,
  );

  /**
   * Whether the descent speed limit of the alternate flight plan is pilot entered.
   */
  readonly isAlternateDescentSpeedLimitPilotEntered = Subject.create<boolean>(false);

  /**
   * The zero fuel weight entered by the pilot in tonnes, or null if not set.
   */
  readonly zeroFuelWeight = Subject.create<number | null>(null);

  /**
   * The zero fuel weight center of gravity entered by the pilot as a percentage, or null if not set
   */
  readonly zeroFuelWeightCenterOfGravity = Subject.create<number | null>(null);

  /**
   * The block fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly blockFuel = Subject.create<number | null>(null);

  /**
   * The taxi fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotTaxiFuel = Subject.create<number | null>(null);

  /**
   * The taxi fuel from the AMI database in tonnes
   * FIXME should come from the AMI database
   */
  readonly defaultTaxiFuel = Subject.create<number>(0.2);

  readonly taxiFuel = MappedSubject.create(
    ([pilotTaxiFuel, defaultTaxiFuel]) => pilotTaxiFuel ?? defaultTaxiFuel,
    this.pilotTaxiFuel,
    this.defaultTaxiFuel,
  );

  readonly taxiFuelIsPilotEntered = MappedSubject.create(
    ([pilotTaxiFuel]) => pilotTaxiFuel !== null,
    this.pilotTaxiFuel,
  );

  /**
   * The route reserve fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotRouteReserveFuel = Subject.create<number | null>(null);

  /**
   * Whether the route reserve fuel percentage is pilot entered.
   */
  readonly isRouteReserveFuelPilotEntered = MappedSubject.create(
    ([pilotRouteReserveFuel]) => pilotRouteReserveFuel !== null,
    this.pilotRouteReserveFuel,
  );

  /**
   * The route reserve percentage entered by the pilot as a percentage, or null if not set.
   */
  readonly pilotRouteReserveFuelPercentage = Subject.create<number | null>(null);

  /**
   * The route reserve percentage from the AMI database
   * FIXME should come from the AMI database
   */
  readonly defaultRouteReserveFuelPercentage = Subject.create<number>(5);

  /**
   * Returns the pilot entered route reserve fuel percentage if set, the AMI route reserve fuel percentage value otherwise
   */
  readonly routeReserveFuelPercentage = MappedSubject.create(
    ([pilotRouteReserveFuelPercentage, defaultRouteReserveFuelPercentage]) =>
      pilotRouteReserveFuelPercentage ?? defaultRouteReserveFuelPercentage,
    this.pilotRouteReserveFuelPercentage,
    this.defaultRouteReserveFuelPercentage,
  );

  /**
   * Whether the route reserve fuel percentage is pilot entered.
   */
  readonly isRouteReserveFuelPercentagePilotEntered = this.isRouteReserveFuelPilotEntered.map((it) => !it);

  /**
   * The alternate fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotAlternateFuel = Subject.create<number | null>(null);

  /**
   * The calculated alternate fuel in tons calculated by predictions.
   */
  readonly calculatedAlternateFuel = Subject.create<number | null>(0);

  readonly alternateFuel = MappedSubject.create(
    ([pilotAlternateFuel, calculatedAlternateFuel]) => pilotAlternateFuel ?? calculatedAlternateFuel,
    this.pilotAlternateFuel,
    this.calculatedAlternateFuel,
  );
  readonly isAlternateFuelPilotEntered = this.pilotAlternateFuel.map((it) => it !== null);

  /**
   * The final holding fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotFinalHoldingFuel = Subject.create<number | null>(null);

  /**
   * Whether final holding fuel is pilot entered.
   */
  readonly isFinalHoldingFuelPilotEntered = MappedSubject.create(
    ([pilotFinalHoldingFuel]) => pilotFinalHoldingFuel !== null,
    this.pilotFinalHoldingFuel,
  );

  /**
   * The final holding time entered by the pilot in minutes, or null if not set.
   */
  readonly pilotFinalHoldingTime = Subject.create<number | null>(null);

  /** The final holding time from the AMI database in minutes */
  readonly defaultFinalHoldingTime = Subject.create<number>(30);

  /**
   * The calculated final holding time in minutes, or null if not set.
   */
  readonly calculatedFinalHoldingTime = Subject.create<number | null>(null);

  /**
   * Returns the pilot entered final holding time in minutes if set, the AMI final holding time value otherwise
   */
  readonly finalHoldingTime = MappedSubject.create(
    ([pilotFinalHoldingTime, calculatedFinalHoldingTime, defaultFinalHoldingTime]) =>
      pilotFinalHoldingTime ?? calculatedFinalHoldingTime ?? defaultFinalHoldingTime,
    this.pilotFinalHoldingTime,
    this.calculatedFinalHoldingTime,
    this.defaultFinalHoldingTime,
  );

  /**
   * Whether final holding time is pilot entered.
   */
  readonly isFinalHoldingTimePilotEntered = this.isFinalHoldingFuelPilotEntered.map((it) => !it);

  /**
   * The calculated final holding fuel by predictions based on the final holding time.
   */
  readonly calculatedFinalHoldingFuel = Subject.create<number | null>(null);

  readonly finalHoldingFuel = MappedSubject.create(
    ([pilotFinalHoldingFuel, calculatedFinalHoldingFuel]) => pilotFinalHoldingFuel ?? calculatedFinalHoldingFuel,
    this.pilotFinalHoldingFuel,
    this.calculatedFinalHoldingFuel,
  );

  /**
   * The minimum fuel on board at the destination entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotMinimumDestinationFuelOnBoard = Subject.create<number | null>(null);

  readonly calculatedMinimumDestinationFuelOnBoard = MappedSubject.create(
    ([altnFuel, finalHoldingFuel]) => {
      return altnFuel !== null && finalHoldingFuel !== null ? altnFuel + finalHoldingFuel : null;
    },
    this.alternateFuel,
    this.finalHoldingFuel,
  );

  readonly minimumDestinationFuelOnBoard = MappedSubject.create(
    ([pilotEntry, calculated]) => {
      return pilotEntry ?? calculated;
    },
    this.pilotMinimumDestinationFuelOnBoard,
    this.calculatedMinimumDestinationFuelOnBoard,
  );

  /**
   * Whether minimum fuel on board at the destination is pilot entered.
   */
  readonly isMinimumDestinationFuelOnBoardPilotEntered = MappedSubject.create(
    ([pilotMinimumDestinationFuelOnBoard]) => pilotMinimumDestinationFuelOnBoard !== null,
    this.pilotMinimumDestinationFuelOnBoard,
  );

  /**
   * The trip wind value entered by the pilot in kts, or null if not set.
   * +ve for tailwind, -ve for headwind
   */
  readonly pilotTripWind = Subject.create<number | null>(null);

  /**
   * The takeoff shift entered by the pilot in metres, or null if not set.
   */
  readonly takeoffShift = Subject.create<number | null>(null);

  /**
   * The takeoff flaps setting entered by the pilot, or null if not set.
   */
  readonly takeoffFlaps = Subject.create<0 | 1 | 2 | 3 | null>(null);

  /**
   * The THS setting entered by the pilot, or null if not set.
   * +ve for nose up, -ve for nose down
   */
  readonly trimmableHorizontalStabilizer = Subject.create<number | null>(null);

  /**
   * The flex takeoff temperature entered by the pilot in degrees, or null if not set.
   */
  readonly flexTakeoffTemperature = Subject.create<number | null>(null);

  /**
   * The preselected climb speed entered by the pilot in knots, or null if not set.
   */
  readonly preselectedClimbSpeed = Subject.create<number | null>(null);

  /**
   * The preselected cruise speed entered by the pilot either in kts or as a Mach number, or null if not set.
   */
  readonly preselectedCruiseSpeed = Subject.create<number | null>(null);

  /**
   * The managed descent speed entered by the pilot in knots, or null if not set.
   */
  readonly pilotManagedDescentSpeed = Subject.create<number | null>(null);

  /**
   * The managed descent Mach number entered by the pilot in knots, or null if not set.
   */
  readonly pilotManagedDescentMach = Subject.create<number | null>(null);

  /**
   * The QNH at the destination airport entered by the pilot in hPa or inHg, or null if not set.
   */
  readonly approachQnh = Subject.create<number | null>(null);

  /**
   * The temperature at the destination airport entered by the pilot in degrees, or null if not set.
   */
  readonly approachTemperature = Subject.create<number | null>(null);

  /**
   * The wind direction at the destination airport entered by the pilot in degrees magnetic, or null if not set.
   */
  readonly approachWindDirection = Subject.create<number | null>(null);

  /**
   * The wind magnitude at the destination airport entered by the pilot in knots, or null if not set.
   */
  readonly approachWindMagnitude = Subject.create<number | null>(null);

  /**
   * Whether the wind magnitude and direction were entered by the pilot, false if no entry has been made or if the wind
   * has been automatically transferred from a descent wind entry at ground level
   */
  readonly isApproachWindPilotEntered = Subject.create<boolean>(false);

  /**
   * The approach speed Vapp manually overridden by the pilot in knots, or null if not set.
   */
  readonly pilotVapp = Subject.create<number | null>(null);

  /**
   * The barometric minimum entered by the pilot, or null if not set.
   */
  readonly approachBaroMinimum = Subject.create<number | null>(null);

  /**
   * The radio minimum entered by the pilot or 'NO DH', or null if not set.
   */
  readonly approachRadioMinimum = Subject.create<'NO DH' | number | null>(null);

  /**
   * Whether the flaps three setting is selected by the pilot for the approach
   */
  readonly approachFlapsThreeSelected = Subject.create<boolean>(false);

  readonly estimatedTakeoffTime = Subject.create<number | null>(null);

  readonly estimatedTakeoffTimeExpired = Subject.create<boolean | null>(false);

  readonly paxNumber = Subject.create<number | null>(null);

  readonly takeoffPowerSetting = Subject.create<TakeoffPowerSetting>(TakeoffPowerSetting.TOGA);

  readonly takeoffDeratedSetting = Subject.create<TakeoffDerated>(TakeoffDerated.D01);

  readonly takeoffThsFor = Subject.create<number | null>(null);

  readonly takeoffPacks = Subject.create<TakeoffPacks | null>(TakeoffPacks.ON);

  readonly takeoffAntiIce = Subject.create<TakeoffAntiIce | null>(TakeoffAntiIce.OFF);

  readonly noiseEnabled = Subject.create<boolean>(false);

  readonly noiseN1 = Subject.create<number | null>(null);

  readonly noiseSpeed = Subject.create<number | null>(null);

  readonly noiseEndAltitude = Subject.create<number | null>(null);

  readonly costIndexMode = Subject.create<CostIndexMode | null>(CostIndexMode.ECON);

  readonly climbDerated = Subject.create<ClimbDerated | null>(ClimbDerated.NONE);

  readonly descentCabinRate = Subject.create<number | null>(-350);

  /**
   * The wind entries for the climb segment entered by the pilot
   */
  readonly climbWindEntries = Subject.create<FlightPlanWindEntry[]>([]);

  /**
   * The wind entries for the descent segment entered by the pilot
   */
  readonly descentWindEntries = Subject.create<FlightPlanWindEntry[]>([]);

  /**
   * The average wind vector for the alternate flight plan, or null if not set.
   */
  readonly alternateWind = Subject.create<WindVector | null>(null);

  serialize(): SerializedFlightPlanPerformanceData {
    return {
      cruiseFlightLevel: this.cruiseFlightLevel.get(),
      cruiseTemperatureIsaTemp: this.cruiseTemperatureIsaTemp.get(),
      cruiseTemperaturePilotEntry: this.cruiseTemperaturePilotEntry.get(),
      costIndex: this.costIndex.get(),
      pilotTropopause: this.pilotTropopause.get(),
      defaultTropopause: this.defaultTropopause.get(),
      v1: this.v1.get(),
      vr: this.vr.get(),
      v2: this.v2.get(),
      pilotThrustReductionAltitude: this.pilotThrustReductionAltitude.get(),
      defaultThrustReductionAltitude: this.defaultThrustReductionAltitude.get(),
      pilotAccelerationAltitude: this.pilotAccelerationAltitude.get(),
      defaultAccelerationAltitude: this.defaultAccelerationAltitude.get(),
      pilotEngineOutAccelerationAltitude: this.pilotEngineOutAccelerationAltitude.get(),
      defaultEngineOutAccelerationAltitude: this.defaultEngineOutAccelerationAltitude.get(),
      pilotMissedThrustReductionAltitude: this.pilotMissedThrustReductionAltitude.get(),
      defaultMissedThrustReductionAltitude: this.defaultMissedThrustReductionAltitude.get(),
      pilotMissedAccelerationAltitude: this.pilotMissedAccelerationAltitude.get(),
      defaultMissedAccelerationAltitude: this.defaultMissedAccelerationAltitude.get(),
      pilotMissedEngineOutAccelerationAltitude: this.pilotMissedEngineOutAccelerationAltitude.get(),
      defaultMissedEngineOutAccelerationAltitude: this.defaultMissedEngineOutAccelerationAltitude.get(),
      databaseTransitionAltitude: this.databaseTransitionAltitude.get(),
      pilotTransitionAltitude: this.pilotTransitionAltitude.get(),
      databaseTransitionLevel: this.databaseTransitionLevel.get(),
      pilotTransitionLevel: this.pilotTransitionLevel.get(),
      climbSpeedLimitSpeed: this.climbSpeedLimitSpeed.get(),
      climbSpeedLimitAltitude: this.climbSpeedLimitAltitude.get(),
      isClimbSpeedLimitPilotEntered: this.isClimbSpeedLimitPilotEntered.get(),
      descentSpeedLimitSpeed: this.descentSpeedLimitSpeed.get(),
      descentSpeedLimitAltitude: this.descentSpeedLimitAltitude.get(),
      isDescentSpeedLimitPilotEntered: this.isDescentSpeedLimitPilotEntered.get(),
      alternateClimbSpeedLimitSpeed: this.alternateClimbSpeedLimitSpeed.get(),
      alternateClimbSpeedLimitAltitude: this.alternateClimbSpeedLimitAltitude.get(),
      isAlternateClimbSpeedLimitPilotEntered: this.isAlternateClimbSpeedLimitPilotEntered.get(),
      alternateDescentSpeedLimitSpeed: this.alternateDescentSpeedLimitSpeed.get(),
      alternateDescentSpeedLimitAltitude: this.alternateDescentSpeedLimitAltitude.get(),
      isAlternateDescentSpeedLimitPilotEntered: this.isAlternateDescentSpeedLimitPilotEntered.get(),
      zeroFuelWeight: this.zeroFuelWeight.get(),
      zeroFuelWeightCenterOfGravity: this.zeroFuelWeightCenterOfGravity.get(),
      blockFuel: this.blockFuel.get(),
      pilotTaxiFuel: this.pilotTaxiFuel.get(),
      defaultTaxiFuel: this.defaultTaxiFuel.get(),
      pilotRouteReserveFuel: this.pilotRouteReserveFuel.get(),
      pilotRouteReserveFuelPercentage: this.pilotRouteReserveFuelPercentage.get(),
      defaultRouteReserveFuelPercentage: this.defaultRouteReserveFuelPercentage.get(),
      pilotAlternateFuel: this.pilotAlternateFuel.get(),
      pilotFinalHoldingFuel: this.pilotFinalHoldingFuel.get(),
      pilotFinalHoldingTime: this.pilotFinalHoldingTime.get(),
      defaultFinalHoldingTime: this.defaultFinalHoldingTime.get(),
      pilotMinimumDestinationFuelOnBoard: this.pilotMinimumDestinationFuelOnBoard.get(),
      pilotTripWind: this.pilotTripWind.get(),
      takeoffShift: this.takeoffShift.get(),
      takeoffFlaps: this.takeoffFlaps.get(),
      trimmableHorizontalStabilizer: this.trimmableHorizontalStabilizer.get(),
      flexTemperature: this.flexTakeoffTemperature.get(),
      preselectedClimbSpeed: this.preselectedClimbSpeed.get(),
      preselectedCruiseSpeed: this.preselectedCruiseSpeed.get(),
      pilotManagedDescentSpeed: this.pilotManagedDescentSpeed.get(),
      pilotManagedDescentMach: this.pilotManagedDescentMach.get(),
      approachQnh: this.approachQnh.get(),
      approachTemperature: this.approachTemperature.get(),
      approachWindDirection: this.approachWindDirection.get(),
      approachWindMagnitude: this.approachWindMagnitude.get(),
      isApproachWindPilotEntered: this.isApproachWindPilotEntered.get(),
      pilotVapp: this.pilotVapp.get(),
      approachBaroMinimum: this.approachBaroMinimum.get(),
      approachRadioMinimum: this.approachRadioMinimum.get(),
      approachFlapsThreeSelected: this.approachFlapsThreeSelected.get(),
      estimatedTakeoffTime: this.estimatedTakeoffTime.get(),
      estimatedTakeoffTimeExpired: this.estimatedTakeoffTimeExpired.get(),
      paxNumber: this.paxNumber.get(),
      takeoffPowerSetting: this.takeoffPowerSetting.get(),
      takeoffDeratedSetting: this.takeoffDeratedSetting.get(),
      takeoffThsFor: this.takeoffThsFor.get(),
      takeoffPacks: this.takeoffPacks.get(),
      takeoffAntiIce: this.takeoffAntiIce.get(),
      noiseEnabled: this.noiseEnabled.get(),
      noiseN1: this.noiseN1.get(),
      noiseSpeed: this.noiseSpeed.get(),
      noiseEndAltitude: this.noiseEndAltitude.get(),
      costIndexMode: this.costIndexMode.get(),
      climbDerated: this.climbDerated.get(),
      descentCabinRate: this.descentCabinRate.get(),
      climbWindEntries: this.climbWindEntries.get(),
      descentWindEntries: this.descentWindEntries.get(),
      alternateWind: this.alternateWind.get(),
    };
  }
}
