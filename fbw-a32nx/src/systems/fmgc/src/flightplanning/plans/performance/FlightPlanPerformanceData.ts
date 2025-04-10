// @ts-strict-ignore
// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';
import {
  ArraySubject,
  MappedSubject,
  MutableSubscribable,
  Subject,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import { WindEntry, WindVector } from '../../data/wind';

export interface FlightPlanPerformanceData {
  /**
   * V1 speed; Unit: Knots; Null if not set.
   */
  readonly v1: MutableSubscribable<number | null>;

  /**
   * Vr speed; Unit: Knots; Null if not set.
   */
  readonly vr: MutableSubscribable<number | null>;

  /**
   * V2 speed; Unit: Knots; Null if not set.
   */
  readonly v2: MutableSubscribable<number | null>;

  /**
   * Transition altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly databaseTransitionAltitude: MutableSubscribable<number | null>;

  /**
   * Transition level from database; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly databaseTransitionLevel: MutableSubscribable<number | null>;

  /**
   * Pilot entered transition altitude; Unit: Feet; Null if not set.
   */
  readonly pilotTransitionAltitude: MutableSubscribable<number | null>;

  /**
   * Pilot entered transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly pilotTransitionLevel: MutableSubscribable<number | null>;

  /**
   * Returns pilot entered altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get transitionAltitude(): Subscribable<number | null>;

  /**
   * Whether returned transition altitude is from nav database;
   */
  get transitionAltitudeIsFromDatabase(): Subscribable<boolean>;

  /**
   * Transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  get transitionLevel(): Subscribable<number | null>;

  /**
   * Whether returned transition level is from nav database;
   */
  get transitionLevelIsFromDatabase(): Subscribable<boolean>;

  /**
   * Cost index; Unit: No unit; Null if not set.
   */
  readonly costIndex: MutableSubscribable<number | null>;

  /**
   * Cruise flight level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  readonly cruiseFlightLevel: MutableSubscribable<number | null>;

  /**
   * Cruise flight level; Unit: degrees C Null if not set.
   */
  readonly cruiseTemperature: MutableSubscribable<number | null>;

  /**
   * Default ground temperature; Unit: degrees C; Null if not set.
   */
  readonly defaultGroundTemperature: MutableSubscribable<number | null>;

  /**
   * Pilot ground temperature; Unit: degrees C; Null if not set.
   */
  readonly pilotGroundTemperature: MutableSubscribable<number | null>;

  /**
   * Ground temperature. Default if no pilot entry, pilot entered otherwise; Unit: degrees C; Null if not set.
   */
  get groundTemperature(): Subscribable<number | null>;

  /**
   * Whether ground temperature is pilot entered.
   */
  get groundTemperatureIsPilotEntered(): Subscribable<boolean>;

  /**
   * Pilot entered tropopause; Unit: Feet; Null if not set.
   */
  readonly pilotTropopause: MutableSubscribable<number | null>;

  /**
   * Default tropopause; Unit: Feet; Null if not set.
   */
  readonly defaultTropopause: MutableSubscribable<number | null>;

  /**
   * Tropopause. Default if no pilot entry, pilot entered otherwise; Unit: Feet; Null if not set.
   */
  get tropopause(): Subscribable<number | null>;

  /**
   * Whether tropopause is pilot entered.
   */
  get tropopauseIsPilotEntered(): Subscribable<boolean>;

  /**
   * Pilot entered thrust reduction altitude; Unit: Feet; Null if not set.
   */
  readonly pilotThrustReductionAltitude: MutableSubscribable<number | null>;

  /**
   * Thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultThrustReductionAltitude: MutableSubscribable<number | null>;

  /**
   * Pilot entered thrust reduction altitude if set, from nav database otherwise; Unit: Feet; Null if not set.
   */
  get thrustReductionAltitude(): Subscribable<number | null>;

  /**
   * Whether thrust reduction altitude is pilot entered;
   */
  get thrustReductionAltitudeIsPilotEntered(): Subscribable<boolean>;

  /**
   * Pilot entered acceleration altitude; Unit: Feet; Null if not set.
   */
  readonly pilotAccelerationAltitude: MutableSubscribable<number | null>;

  /**
   * Acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultAccelerationAltitude: MutableSubscribable<number | null>;

  /**
   * Returns pilot entered acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get accelerationAltitude(): Subscribable<number | null>;

  /**
   * Whether acceleration altitude is pilot entered; Null if not set.
   */
  get accelerationAltitudeIsPilotEntered(): Subscribable<boolean>;

  /**
   * Pilot entered engine-out acceleration altitude; Unit: Feet; Null if not set.
   */
  readonly pilotEngineOutAccelerationAltitude: MutableSubscribable<number | null>;

  /**
   * Engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultEngineOutAccelerationAltitude: MutableSubscribable<number | null>;

  /**
   * Returns pilot entered engine-out acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get engineOutAccelerationAltitude(): Subscribable<number | null>;

  /**
   * Whether engine-out acceleration altitude is pilot entered; Null if not set.
   */
  get engineOutAccelerationAltitudeIsPilotEntered(): Subscribable<boolean>;

  /**
   * Pilot entered missed apch thrust reduction altitude; Unit: Feet; Null if not set.
   */
  readonly pilotMissedThrustReductionAltitude: MutableSubscribable<number | null>;

  /**
   * Missed apch thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedThrustReductionAltitude: MutableSubscribable<number | null>;

  /**
   * Returns pilot entered missed apch thrust reduction altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedThrustReductionAltitude(): Subscribable<number | null>;

  /**
   * Whether missed apch thrust reduction altitude is pilot entered
   */
  get missedThrustReductionAltitudeIsPilotEntered(): Subscribable<boolean>;

  /**
   * Pilot entered missed apch acceleration altitude; Unit: Feet; Null if not set.
   */
  readonly pilotMissedAccelerationAltitude: MutableSubscribable<number | null>;

  /**
   * Missed apch acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedAccelerationAltitude: MutableSubscribable<number | null>;

  /**
   * Returns pilot entered missed apch acceleration altitude of set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedAccelerationAltitude(): Subscribable<number | null>;

  /**
   * Whether missed apch acceleration altitude is pilot entered
   */
  get missedAccelerationAltitudeIsPilotEntered(): Subscribable<boolean>;

  /**
   * Pilot entered missed apch engine-out acceleration altitude; Unit: Feet; Null if not set.
   */
  readonly pilotMissedEngineOutAccelerationAltitude: MutableSubscribable<number | null>;

  /**
   * Missed apch engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  readonly defaultMissedEngineOutAccelerationAltitude: MutableSubscribable<number | null>;

  /**
   * Returns pilot entered missed apch engine-out acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedEngineOutAccelerationAltitude(): Subscribable<number | null>;

  /**
   * Whether missed apch engine-out acceleration altitude is pilot entered
   */
  get missedEngineOutAccelerationAltitudeIsPilotEntered(): Subscribable<boolean>;

  /**
   * The maximum speed imposed by the climb speed limit of the main flight plan or null if not set.
   */
  readonly climbSpeedLimitSpeed: MutableSubscribable<number | null>;

  /**
   * The altitude below which the climb speed limit of the main flight plan applies or null if not set.
   */
  readonly climbSpeedLimitAltitude: MutableSubscribable<number | null>;

  /**
   * Whether the climb speed limit is pilot entered.
   */
  readonly isClimbSpeedLimitPilotEntered: MutableSubscribable<boolean>;

  /**
   * The maximum speed imposed by the descent speed limit of the main flight plan or null if not set.
   */
  readonly descentSpeedLimitSpeed: MutableSubscribable<number | null>;

  /**
   * The altitude below which the descent speed limit of the main flight plan applies or null if not set.
   */
  readonly descentSpeedLimitAltitude: MutableSubscribable<number | null>;

  /**
   * Whether the descent speed limit of the main flight plan is pilot entered.
   */
  readonly isDescentSpeedLimitPilotEntered: MutableSubscribable<boolean>;

  /**
   * The maximum speed imposed by the climb speed limit of the alternate flight plan or null if not set.
   */
  readonly alternateClimbSpeedLimitSpeed: MutableSubscribable<number | null>;

  /**
   * The altitude below which the climb speed limit of the alternate flight plan applies or null if not set.
   */
  readonly alternateClimbSpeedLimitAltitude: MutableSubscribable<number | null>;

  /**
   * Whether the climb speed limit of the alternate flight plan is pilot entered.
   */
  readonly isAlternateClimbSpeedLimitPilotEntered: MutableSubscribable<boolean>;

  /**
   * The maximum speed imposed by the descent speed limit of the alternate flight plan or null if not set.
   */
  readonly alternateDescentSpeedLimitSpeed: MutableSubscribable<number | null>;

  /**
   * The altitude below which the descent speed limit of the alternate flight plan applies or null if not set.
   */
  readonly alternateDescentSpeedLimitAltitude: MutableSubscribable<number | null>;

  /**
   * Whether the descent speed limit of the alternate flight plan is pilot entered.
   */
  readonly isAlternateDescentSpeedLimitPilotEntered: MutableSubscribable<boolean>;

  /**
   * The zero fuel weight entered by the pilot in tonnes, or null if not set.
   */
  readonly zeroFuelWeight: MutableSubscribable<number | null>;

  /**
   * The zero fuel weight center of gravity entered by the pilot as a percentage, or null if not set
   */
  readonly zeroFuelWeightCenterOfGravity: MutableSubscribable<number | null>;

  /**
   * The block fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly blockFuel: MutableSubscribable<number | null>;

  /**
   * The taxi fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotTaxiFuel: MutableSubscribable<number | null>;

  /**
   * The taxi fuel from the AMI database in tonnes
   */
  readonly defaultTaxiFuel: MutableSubscribable<number>;

  /**
   * Returns the pilot entered taxi fuel if set, the AMI taxi fuel value otherwise; Unit: tonnes; Null if not set.
   */
  get taxiFuel(): Subscribable<number | null>;

  /**
   * Whether taxi fuel is pilot entered.
   */
  get taxiFuelIsPilotEntered(): Subscribable<boolean>;

  /**
   * The route reserve fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotRouteReserveFuel: MutableSubscribable<number | null>;

  /**
   * The route reserve fuel percentage entered by the pilot as a percentage, or null if not set.
   */
  readonly pilotRouteReserveFuelPercentage: MutableSubscribable<number | null>;

  /**
   * The route reserve fuel percentage from the AMI database
   */
  readonly defaultRouteReserveFuelPercentage: MutableSubscribable<number>;

  /**
   * Returns the pilot entered route reserve fuel percentage if set, the AMI route reserve fuel percentage value otherwise
   */
  get routeReserveFuelPercentage(): Subscribable<number>;

  /**
   * Whether the route reserve fuel percentage is pilot entered.
   */
  get isRouteReserveFuelPrecentagePilotEntered(): Subscribable<boolean>;

  /**
   * The alternate fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotAlternateFuel: MutableSubscribable<number | null>;

  /**
   * The final holding fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotFinalHoldingFuel: MutableSubscribable<number | null>;

  /**
   * The final holding time entered by the pilot in minutes, or null if not set.
   */
  readonly pilotFinalHoldingTime: MutableSubscribable<number | null>;

  /**
   * The final holding time from the AMI database in minutes
   */
  readonly defaultFinalHoldingTime: MutableSubscribable<number>;

  /**
   * Returns the pilot entered final holding time in minutes if set, the AMI final holding time value otherwise
   */
  get finalHoldingTime(): Subscribable<number>;

  /**
   * Whether final holding time is pilot entered.
   */
  get isFinalHoldingTimePilotEntered(): Subscribable<boolean>;

  /**
   * The minimum fuel on board at the destination entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotMinimumDestinationFuelOnBoard: MutableSubscribable<number | null>;

  /**
   * The trip wind value entered by the pilot in kts, or null if not set.
   * Positive values indicate a tailwind, negative values indicate a headwind.
   */
  readonly pilotTripWind: MutableSubscribable<number | null>;

  /**
   * The takeoff shift entered by the pilot in metres, or null if not set.
   */
  readonly takeoffShift: MutableSubscribable<number | null>;

  /**
   * The takeoff flaps setting entered by the pilot, or null if not set.
   */
  readonly takeoffFlaps: MutableSubscribable<0 | 1 | 2 | 3 | null>;

  /**
   * The THS setting entered by the pilot, or null if not set.
   * +ve for nose up, -ve for nose down
   */
  readonly trimmableHorizontalStabilizer: MutableSubscribable<number | null>;

  /**
   * The flex takeoff temperature entered by the pilot in degrees, or null if not set.
   */
  readonly flexTakeoffTemperature: MutableSubscribable<number | null>;

  /**
   * The preselected climb speed entered by the pilot in knots, or null if not set.
   */
  readonly preselectedClimbSpeed: MutableSubscribable<number | null>;

  /**
   * The preselected cruise speed entered by the pilot either in kts or as a Mach number, or null if not set.
   */
  readonly preselectedCruiseSpeed: MutableSubscribable<number | null>;

  /**
   * The managed descent speed entered by the pilot in knots, or null if not set.
   */
  readonly pilotManagedDescentSpeed: MutableSubscribable<number | null>;

  /**
   * The managed descent Mach number entered by the pilot in knots, or null if not set.
   */
  readonly pilotManagedDescentMach: MutableSubscribable<number | null>;

  /**
   * The QNH at the destination airport entered by the pilot in hPa or inHg, or null if not set.
   */
  readonly approachQnh: MutableSubscribable<number | null>;

  /**
   * The temperature at the destination airport entered by the pilot in degrees, or null if not set.
   */
  readonly approachTemperature: MutableSubscribable<number | null>;

  /**
   * The wind direction at the destination airport entered by the pilot in degrees magnetic, or null if not set.
   */
  readonly approachWindDirection: MutableSubscribable<number | null>;

  /**
   * The wind magnitude at the destination airport entered by the pilot in knots, or null if not set.
   */
  readonly approachWindMagnitude: MutableSubscribable<number | null>;

  /**
   * The approach speed Vapp manually overridden by the pilot in knots, or null if not set.
   */
  readonly pilotVapp: MutableSubscribable<number | null>;

  /**
   * The barometric minimum entered by the pilot, or null if not set.
   */
  readonly approachBaroMinimum: MutableSubscribable<number | null>;

  /**
   * The radio minimum entered by the pilot, or null if not set.
   */
  readonly approachRadioMinimum: MutableSubscribable<'NO DH' | number | null>;

  /**
   * Whether the flaps three setting is selected by the pilot for the approach
   */
  readonly approachFlapsThreeSelected: MutableSubscribable<boolean>;

  /**
   * The wind entries for the climb segment entered by the pilot
   */
  readonly climbWindEntries: ArraySubject<WindEntry>;

  /**
   * The wind entries for the descent segment entered by the pilot
   */
  readonly descentWindEntries: ArraySubject<WindEntry>;

  /**
   * The average wind vector for the alternate flight plan, or null if not set.
   */
  readonly alternateWind: Subject<WindVector | null>;

  clone(): this;

  destroy(): void;

  hasSubscription(key: string): boolean;

  pipeTo(other: FlightPlanPerformanceData, isBeforeEngineStart: boolean): void;
}

export type FlightPlanPerformanceDataProperties = {
  [K in keyof FlightPlanPerformanceData as FlightPlanPerformanceData[K] extends MutableSubscribable<any>
    ? K
    : never]: FlightPlanPerformanceData[K] extends MutableSubscribable<infer T> ? MutableSubscribable<T> : never;
};

// TODO this should remain in fbw-a32nx/ once FMS is moved to fbw-common

export class A320FlightPlanPerformanceData implements FlightPlanPerformanceData {
  private readonly subscriptions: Map<keyof FlightPlanPerformanceDataProperties & string, Subscription> = new Map();

  public clone(): this {
    const cloned = new A320FlightPlanPerformanceData();

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
    cloned.cruiseTemperature.set(this.cruiseTemperature.get());
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

    return cloned as this;
  }

  pipeTo(other: A320FlightPlanPerformanceData, isBeforeEngineStart: boolean): void {
    other.pipe('cruiseFlightLevel', this.cruiseFlightLevel, other.cruiseFlightLevel);
    other.pipe('cruiseTemperature', this.cruiseTemperature, other.cruiseTemperature);
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

  private pipe<T>(
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

  readonly cruiseTemperature: Subject<number | null> = Subject.create(null);

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
  readonly isRouteReserveFuelPrecentagePilotEntered = MappedSubject.create(
    ([pilotRouteReserveFuelPercentage]) => pilotRouteReserveFuelPercentage !== null,
    this.pilotRouteReserveFuelPercentage,
  );

  /**
   * The alternate fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotAlternateFuel: Subject<number | null> = Subject.create(null);

  /**
   * The final holding fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotFinalHoldingFuel: Subject<number | null> = Subject.create(null);

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

  /**
   * The wind entries for the climb segment entered by the pilot
   */
  readonly climbWindEntries: ArraySubject<WindEntry> = ArraySubject.create([]);

  /**
   * The wind entries for the descent segment entered by the pilot
   */
  readonly descentWindEntries: ArraySubject<WindEntry> = ArraySubject.create([]);

  /**
   * The average wind vector for the alternate flight plan, or null if not set.
   */
  readonly alternateWind: Subject<WindVector | null> = Subject.create(null);

  serialize(): SerializedFlightPlanPerformanceData {
    return {
      cruiseFlightLevel: this.cruiseFlightLevel.get(),
      cruiseTemperature: this.cruiseTemperature.get(),
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

      climbWindEntries: this.climbWindEntries.getArray(),
      descentWindEntries: this.descentWindEntries.getArray(),
      alternateWind: this.alternateWind.get(),
    };
  }
}

export interface SerializedFlightPlanPerformanceData {
  cruiseFlightLevel: number | null;
  cruiseTemperature: number | null;
  defaultGroundTemperature: number | null;
  pilotGroundTemperature: number | null;
  costIndex: number | null;
  defaultTropopause: number;
  pilotTropopause: number;

  v1: number | null;

  vr: number | null;

  v2: number | null;

  pilotThrustReductionAltitude: number | null;
  defaultThrustReductionAltitude: number | null;

  pilotAccelerationAltitude: number | null;
  defaultAccelerationAltitude: number | null;

  pilotEngineOutAccelerationAltitude: number | null;
  defaultEngineOutAccelerationAltitude: number | null;

  pilotMissedThrustReductionAltitude: number | null;
  defaultMissedThrustReductionAltitude: number | null;

  pilotMissedAccelerationAltitude: number | null;
  defaultMissedAccelerationAltitude: number | null;

  pilotMissedEngineOutAccelerationAltitude: number | null;
  defaultMissedEngineOutAccelerationAltitude: number | null;

  databaseTransitionAltitude: number | null;
  pilotTransitionAltitude: number | null;

  databaseTransitionLevel: number | null;
  pilotTransitionLevel: number | null;

  climbSpeedLimitSpeed: number | null;
  climbSpeedLimitAltitude: number | null;
  isClimbSpeedLimitPilotEntered: boolean;

  descentSpeedLimitSpeed: number | null;
  descentSpeedLimitAltitude: number | null;
  isDescentSpeedLimitPilotEntered: boolean;

  alternateClimbSpeedLimitSpeed: number | null;
  alternateClimbSpeedLimitAltitude: number | null;
  isAlternateClimbSpeedLimitPilotEntered: boolean;

  alternateDescentSpeedLimitSpeed: number | null;
  alternateDescentSpeedLimitAltitude: number | null;
  isAlternateDescentSpeedLimitPilotEntered: boolean;

  zeroFuelWeight: number | null;
  zeroFuelWeightCenterOfGravity: number | null;
  blockFuel: number | null;
  pilotTaxiFuel: number | null;
  defaultTaxiFuel: number;
  pilotRouteReserveFuel: number | null;
  pilotRouteReserveFuelPercentage: number | null;
  defaultRouteReserveFuelPercentage: number;
  pilotAlternateFuel: number | null;
  pilotFinalHoldingFuel: number | null;
  pilotFinalHoldingTime: number | null;
  defaultFinalHoldingTime: number;
  pilotMinimumDestinationFuelOnBoard: number | null;
  pilotTripWind: number | null;

  takeoffShift: number | null;
  takeoffFlaps: 0 | 1 | 2 | 3 | null;
  trimmableHorizontalStabilizer: number | null;
  flexTemperature: number | null;
  preselectedClimbSpeed: number | null;
  preselectedCruiseSpeed: number | null;
  pilotManagedDescentSpeed: number | null;
  pilotManagedDescentMach: number | null;
  approachQnh: number | null;
  approachTemperature: number | null;
  approachWindDirection: number | null;
  approachWindMagnitude: number | null;
  pilotVapp: number | null;
  approachBaroMinimum: number | null;
  approachRadioMinimum: 'NO DH' | number | null;
  approachFlapsThreeSelected: boolean;

  climbWindEntries: WindEntry[];
  descentWindEntries: WindEntry[];
  alternateWind: WindVector | null;
}

// FIXME move to AMI database
export class DefaultPerformanceData {
  static readonly ClimbSpeedLimitSpeed = 250;

  static readonly ClimbSpeedLimitAltitude = 10_000;

  static readonly DescentSpeedLimitSpeed = 250;

  static readonly DescentSpeedLimitAltitude = 10_000;
}
