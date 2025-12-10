// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';
import { MappedSubject, MutableSubscribable, Subject, Subscription } from '@microsoft/msfs-sdk';
import {
  DefaultPerformanceData,
  FlightPlanPerformanceData,
  FlightPlanPerformanceDataProperties,
  SerializedFlightPlanPerformanceData,
} from './FlightPlanPerformanceData';

// TODO this should remain in fbw-a32nx/ once FMS is moved to fbw-common
export class A320FlightPlanPerformanceData implements FlightPlanPerformanceData {
  private readonly subscriptions: Map<keyof FlightPlanPerformanceDataProperties & string, Subscription> = new Map();

  public clone(): this {
    const cloned = new A320FlightPlanPerformanceData();

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
    cloned.cruiseTemperaturePilotEntry.set(this.cruiseTemperaturePilotEntry.get());
    cloned.pilotGroundTemperature.set(this.pilotGroundTemperature.get());
    cloned.defaultGroundTemperature.set(this.defaultGroundTemperature.get());
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
    cloned.pilotVapp.set(this.pilotVapp.get());
    cloned.approachBaroMinimum.set(this.approachBaroMinimum.get());
    cloned.approachRadioMinimum.set(this.approachRadioMinimum.get());
    cloned.approachFlapsThreeSelected.set(this.approachFlapsThreeSelected.get());

    return cloned;
  }

  pipeTo(other: A320FlightPlanPerformanceData, isBeforeEngineStart: boolean): void {
    other.pipe('cruiseFlightLevel', this.cruiseFlightLevel, other.cruiseFlightLevel);
    other.pipe('cruiseTemperaturePilotEntry', this.cruiseTemperaturePilotEntry, other.cruiseTemperaturePilotEntry);
    other.pipe('pilotTropopause', this.pilotTropopause, other.pilotTropopause);
    other.pipe('costIndex', this.costIndex, other.costIndex);
    other.pipe('pilotRouteReserveFuel', this.pilotRouteReserveFuel, other.pilotRouteReserveFuel);
    other.pipe(
      'pilotRouteReserveFuelPercentage',
      this.pilotRouteReserveFuelPercentage,
      other.pilotRouteReserveFuelPercentage,
    );
    other.pipe('pilotFinalHoldingFuel', this.pilotFinalHoldingFuel, other.pilotFinalHoldingFuel);
    other.pipe('pilotFinalHoldingTime', this.pilotFinalHoldingTime, other.pilotFinalHoldingTime);

    if (isBeforeEngineStart) {
      other.pipe('zeroFuelWeight', this.zeroFuelWeight, other.zeroFuelWeight);
      other.pipe(
        'zeroFuelWeightCenterOfGravity',
        this.zeroFuelWeightCenterOfGravity,
        other.zeroFuelWeightCenterOfGravity,
      );
      other.pipe(
        'pilotMinimumDestinationFuelOnBoard',
        this.pilotMinimumDestinationFuelOnBoard,
        other.pilotMinimumDestinationFuelOnBoard,
      );
      other.pipe('blockFuel', this.blockFuel, other.blockFuel);
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

  readonly cruiseFlightLevel: Subject<number | null> = Subject.create(null);

  readonly cruiseTemperaturePilotEntry: Subject<number | null> = Subject.create(null);

  readonly cruiseTemperature = this.cruiseTemperaturePilotEntry.map((it) => it);

  readonly cruiseTemperatureIsPilotEntered = this.cruiseTemperaturePilotEntry.map((it) => it !== null);

  readonly defaultGroundTemperature: Subject<number | null> = Subject.create(null);

  readonly pilotGroundTemperature: Subject<number | null> = Subject.create(null);

  readonly groundTemperature = MappedSubject.create(
    ([pilotGroundTemperature, defaultGroundTemperature]) => pilotGroundTemperature ?? defaultGroundTemperature,
    this.pilotGroundTemperature,
    this.defaultGroundTemperature,
  );

  readonly groundTemperatureIsPilotEntered = MappedSubject.create(
    ([pilotGroundTemperature]) => pilotGroundTemperature !== null,
    this.pilotGroundTemperature,
  );

  /**
   * Cost index; Unit: No unit; Null if not set.
   */
  readonly costIndex: Subject<number | null> = Subject.create(null);

  /**
   * Tropopause altitude entered by the pilot; Unit: Feet; Null if not set.
   */
  readonly pilotTropopause: Subject<number | null> = Subject.create(null);

  /**
   * Default tropopause altitude; Unit: Feet; Null if not set.
   */
  readonly defaultTropopause: Subject<number | null> = Subject.create(36090);

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
  readonly v1: Subject<number | null> = Subject.create(null);

  /**
   * Vr speed; Unit: Knots; Null if not set.
   */
  readonly vr: Subject<number | null> = Subject.create(null);

  /**
   * V2 speed; Unit: Knots; Null if not set.
   */
  readonly v2: Subject<number | null> = Subject.create(null);

  // THR RED

  /**
   * Pilot entered thrust reduction altitude; Unit: Feet; Null if not set.
   */
  readonly pilotThrustReductionAltitude: Subject<number | null> = Subject.create(null);

  /**
   * Thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultThrustReductionAltitude: Subject<number | null> = Subject.create(null);

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
  readonly pilotAccelerationAltitude: Subject<number | null> = Subject.create(null);

  /**
   * Acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultAccelerationAltitude: Subject<number | null> = Subject.create(null);

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
  readonly pilotEngineOutAccelerationAltitude: Subject<number | null> = Subject.create(null);

  /**
   * Engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultEngineOutAccelerationAltitude: Subject<number | null> = Subject.create(null);

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
  readonly pilotMissedThrustReductionAltitude: Subject<number | null> = Subject.create(null);

  /**
   * Missed apch thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedThrustReductionAltitude: Subject<number | null> = Subject.create(null);

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
  readonly pilotMissedAccelerationAltitude: Subject<number | null> = Subject.create(null);

  /**
   * Missed apch acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedAccelerationAltitude: Subject<number | null> = Subject.create(null);

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
  readonly pilotMissedEngineOutAccelerationAltitude: Subject<number | null> = Subject.create(null);

  /**
   * Missed apch engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedEngineOutAccelerationAltitude: Subject<number | null> = Subject.create(null);

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
  readonly databaseTransitionAltitude: Subject<number | null> = Subject.create(null);

  /**
   * Transition level from database; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly pilotTransitionAltitude: Subject<number | null> = Subject.create(null);

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
  readonly databaseTransitionLevel: Subject<number | null> = Subject.create(null);

  /**
   * Pilot entered transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly pilotTransitionLevel: Subject<number | null> = Subject.create(null);

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
  readonly climbSpeedLimitSpeed: Subject<number | null> = Subject.create(DefaultPerformanceData.ClimbSpeedLimitSpeed);

  /**
   * The altitude below which the climb speed limit of the main flight plan applies or null if not set.
   */
  readonly climbSpeedLimitAltitude: Subject<number | null> = Subject.create(
    DefaultPerformanceData.ClimbSpeedLimitAltitude,
  );

  /**
   * Whether the climb speed limit is pilot entered.
   */
  readonly isClimbSpeedLimitPilotEntered = Subject.create(false);

  /**
   * The maximum speed imposed by the descent speed limit of the main flight plan or null if not set.
   */
  readonly descentSpeedLimitSpeed: Subject<number | null> = Subject.create(
    DefaultPerformanceData.DescentSpeedLimitSpeed,
  );

  /**
   * The altitude below which the descent speed limit of the main flight plan applies or null if not set.
   */
  readonly descentSpeedLimitAltitude: Subject<number | null> = Subject.create(
    DefaultPerformanceData.DescentSpeedLimitAltitude,
  );

  /**
   * Whether the descent speed limit of the main flight plan is pilot entered.
   */
  readonly isDescentSpeedLimitPilotEntered = Subject.create(false);

  /**
   * The maximum speed imposed by the climb speed limit of the alternate flight plan or null if not set.
   */
  readonly alternateClimbSpeedLimitSpeed: Subject<number | null> = Subject.create(
    DefaultPerformanceData.ClimbSpeedLimitSpeed,
  );

  /**
   * The altitude below which the climb speed limit of the alternate flight plan applies or null if not set.
   */
  readonly alternateClimbSpeedLimitAltitude: Subject<number | null> = Subject.create(
    DefaultPerformanceData.ClimbSpeedLimitAltitude,
  );

  /**
   * Whether the climb speed limit of the alternate flight plan is pilot entered.
   */
  readonly isAlternateClimbSpeedLimitPilotEntered = Subject.create(false);

  /**
   * The maximum speed imposed by the descent speed limit of the alternate flight plan or null if not set.
   */
  readonly alternateDescentSpeedLimitSpeed: Subject<number | null> = Subject.create(
    DefaultPerformanceData.DescentSpeedLimitSpeed,
  );

  /**
   * The altitude below which the descent speed limit of the alternate flight plan applies or null if not set.
   */
  readonly alternateDescentSpeedLimitAltitude: Subject<number | null> = Subject.create(
    DefaultPerformanceData.DescentSpeedLimitAltitude,
  );

  /**
   * Whether the descent speed limit of the alternate flight plan is pilot entered.
   */
  readonly isAlternateDescentSpeedLimitPilotEntered = Subject.create(false);

  /**
   * The zero fuel weight entered by the pilot in tonnes, or null if not set.
   */
  readonly zeroFuelWeight: Subject<number | null> = Subject.create(null);

  /**
   * The zero fuel weight center of gravity entered by the pilot as a percentage, or null if not set
   */
  readonly zeroFuelWeightCenterOfGravity: Subject<number | null> = Subject.create(null);

  /**
   * The block fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly blockFuel: Subject<number | null> = Subject.create(null);

  /**
   * The taxi fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotTaxiFuel: Subject<number | null> = Subject.create(null);

  /**
   * The taxi fuel from the AMI database in tonnes
   * FIXME should come from the AMI database
   */
  readonly defaultTaxiFuel = Subject.create(0.2);

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
  readonly pilotRouteReserveFuel: Subject<number | null> = Subject.create(null);

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
  readonly pilotRouteReserveFuelPercentage: Subject<number | null> = Subject.create(null);

  /**
   * The route reserve percentage from the AMI database
   * FIXME should come from the AMI database
   */
  readonly defaultRouteReserveFuelPercentage = Subject.create(5);

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
  readonly isRouteReserveFuelPercentagePilotEntered = MappedSubject.create(
    ([pilotRouteReserveFuelPercentage]) => pilotRouteReserveFuelPercentage !== null,
    this.pilotRouteReserveFuelPercentage,
  );

  /**
   * The alternate fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotAlternateFuel: Subject<number | null> = Subject.create(null);

  readonly alternateFuel = this.pilotAlternateFuel.map((it) => it);
  readonly isAlternateFuelPilotEntered = this.pilotAlternateFuel.map((it) => it !== null);

  /**
   * The final holding fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotFinalHoldingFuel: Subject<number | null> = Subject.create(null);

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
  readonly pilotFinalHoldingTime: Subject<number | null> = Subject.create(null);

  /**
   * The final holding time from the AMI database in minutes
   */
  readonly defaultFinalHoldingTime = Subject.create(30);

  /**
   * Returns the pilot entered final holding time in minutes if set, the AMI final holding time value otherwise
   */
  readonly finalHoldingTime = MappedSubject.create(
    ([pilotFinalHoldingTime, defaultFinalHoldingTime]) => pilotFinalHoldingTime ?? defaultFinalHoldingTime,
    this.pilotFinalHoldingTime,
    this.defaultFinalHoldingTime,
  );

  /**
   * Whether final holding time is pilot entered.
   */
  readonly isFinalHoldingTimePilotEntered = MappedSubject.create(
    ([pilotFinalHoldingTime]) => pilotFinalHoldingTime !== null,
    this.pilotFinalHoldingTime,
  );

  /**
   * The minimum fuel on board at the destination entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotMinimumDestinationFuelOnBoard: Subject<number | null> = Subject.create(null);

  readonly minimumDestinationFuelOnBoard = this.pilotMinimumDestinationFuelOnBoard.map((it) => it);

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
  readonly pilotTripWind: Subject<number | null> = Subject.create(null);

  /**
   * The takeoff shift entered by the pilot in metres, or null if not set.
   */
  readonly takeoffShift: Subject<number | null> = Subject.create(null);

  /**
   * The takeoff flaps setting entered by the pilot, or null if not set.
   */
  readonly takeoffFlaps: Subject<0 | 1 | 2 | 3 | null> = Subject.create(null);

  /**
   * The THS setting entered by the pilot, or null if not set.
   * +ve for nose up, -ve for nose down
   */
  readonly trimmableHorizontalStabilizer: Subject<number | null> = Subject.create(null);

  /**
   * The flex takeoff temperature entered by the pilot in degrees, or null if not set.
   */
  readonly flexTakeoffTemperature: Subject<number | null> = Subject.create(null);

  /**
   * The preselected climb speed entered by the pilot in knots, or null if not set.
   */
  readonly preselectedClimbSpeed: Subject<number | null> = Subject.create(null);

  /**
   * The preselected cruise speed entered by the pilot either in kts or as a Mach number, or null if not set.
   */
  readonly preselectedCruiseSpeed: Subject<number | null> = Subject.create(null);

  /**
   * The managed descent speed entered by the pilot in knots, or null if not set.
   */
  readonly pilotManagedDescentSpeed: Subject<number | null> = Subject.create(null);

  /**
   * The managed descent Mach number entered by the pilot in knots, or null if not set.
   */
  readonly pilotManagedDescentMach: Subject<number | null> = Subject.create(null);

  /**
   * The QNH at the destination airport entered by the pilot in hPa or inHg, or null if not set.
   */
  readonly approachQnh: Subject<number | null> = Subject.create(null);

  /**
   * The temperature at the destination airport entered by the pilot in degrees, or null if not set.
   */
  readonly approachTemperature: Subject<number | null> = Subject.create(null);

  /**
   * The wind direction at the destination airport entered by the pilot in degrees magnetic, or null if not set.
   */
  readonly approachWindDirection: Subject<number | null> = Subject.create(null);

  /**
   * The wind magnitude at the destination airport entered by the pilot in knots, or null if not set.
   */
  readonly approachWindMagnitude: Subject<number | null> = Subject.create(null);

  /**
   * The approach speed Vapp manually overridden by the pilot in knots, or null if not set.
   */
  readonly pilotVapp: Subject<number | null> = Subject.create(null);

  /**
   * The barometric minimum entered by the pilot, or null if not set.
   */
  readonly approachBaroMinimum: Subject<number | null> = Subject.create(null);

  /**
   * The radio minimum entered by the pilot or 'NO DH', or null if not set.
   */
  readonly approachRadioMinimum: Subject<'NO DH' | number | null> = Subject.create(null);

  /**
   * Whether the flaps three setting is selected by the pilot for the approach
   */
  readonly approachFlapsThreeSelected = Subject.create(false);

  serialize(): SerializedFlightPlanPerformanceData {
    return {
      cruiseFlightLevel: this.cruiseFlightLevel.get(),
      cruiseTemperaturePilotEntry: this.cruiseTemperaturePilotEntry.get(),
      defaultGroundTemperature: this.defaultGroundTemperature.get(),
      pilotGroundTemperature: this.pilotGroundTemperature.get(),
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
      pilotVapp: this.pilotVapp.get(),
      approachBaroMinimum: this.approachBaroMinimum.get(),
      approachRadioMinimum: this.approachRadioMinimum.get(),
      approachFlapsThreeSelected: this.approachFlapsThreeSelected.get(),
    };
  }
}
