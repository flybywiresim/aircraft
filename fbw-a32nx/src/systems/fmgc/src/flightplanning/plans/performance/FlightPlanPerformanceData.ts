// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';

export interface FlightPlanPerformanceData {
  /**
   * V1 speed; Unit: Knots; Null if not set.
   */
  v1: number | null;

  /**
   * Vr speed; Unit: Knots; Null if not set.
   */
  vr: number | null;

  /**
   * V2 speed; Unit: Knots; Null if not set.
   */
  v2: number | null;

  /**
   * Transition altitude from nav database; Unit: Feet; Null if not set.
   */
  databaseTransitionAltitude: number | null;

  /**
   * Transition level from database; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  databaseTransitionLevel: number | null;

  /**
   * Pilot entered transition altitude; Unit: Feet; Null if not set.
   */
  pilotTransitionAltitude: number | null;

  /**
   * Pilot entered transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  pilotTransitionLevel: number | null;

  /**
   * Returns pilot entered altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get transitionAltitude(): number | null;

  /**
   * Whether returned transition altitude is from nav database;
   */
  get transitionAltitudeIsFromDatabase(): boolean;

  /**
   * Transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  get transitionLevel(): number | null;

  /**
   * Whether returned transition level is from nav database;
   */
  get transitionLevelIsFromDatabase(): boolean;

  /**
   * Cost index; Unit: No unit; Null if not set.
   */
  costIndex: number | null;

  /**
   * Cruise flight level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  cruiseFlightLevel: number | null;

  /**
   * Cruise flight level; Unit: degrees C Null if not set.
   */
  cruiseTemperature: number | null;

  /**
   * Default ground temperature; Unit: degrees C; Null if not set.
   */
  defaultGroundTemperature: number | null;

  /**
   * Pilot ground temperature; Unit: degrees C; Null if not set.
   */
  pilotGroundTemperature: number | null;

  /**
   * Ground temperature. Default if no pilot entry, pilot entered otherwise; Unit: degrees C; Null if not set.
   */
  get groundTemperature(): number | null;

  /**
   * Whether ground temperature is pilot entered.
   */
  get groundTemperatureIsPilotEntered(): boolean;

  /**
   * Pilot entered tropopause; Unit: Feet; Null if not set.
   */
  pilotTropopause: number | null;

  /**
   * Default tropopause; Unit: Feet; Null if not set.
   */
  defaultTropopause: number | null;

  /**
   * Tropopause. Default if no pilot entry, pilot entered otherwise; Unit: Feet; Null if not set.
   */
  get tropopause(): number | null;

  /**
   * Whether tropopause is pilot entered.
   */
  get tropopauseIsPilotEntered(): boolean;

  /**
   * Pilot entered thrust reduction altitude; Unit: Feet; Null if not set.
   */
  pilotThrustReductionAltitude: number | null;

  /**
   * Thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultThrustReductionAltitude: number | null;

  /**
   * Pilot entered thrust reduction altitude if set, from nav database otherwise; Unit: Feet; Null if not set.
   */
  get thrustReductionAltitude(): number | null;

  /**
   * Whether thrust reduction altitude is pilot entered;
   */
  get thrustReductionAltitudeIsPilotEntered(): boolean;

  /**
   * Pilot entered acceleration altitude; Unit: Feet; Null if not set.
   */
  pilotAccelerationAltitude: number | null;

  /**
   * Acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultAccelerationAltitude: number | null;

  /**
   * Returns pilot entered acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get accelerationAltitude(): number | null;

  /**
   * Whether acceleration altitude is pilot entered; Null if not set.
   */
  get accelerationAltitudeIsPilotEntered(): boolean;

  /**
   * Pilot entered engine-out acceleration altitude; Unit: Feet; Null if not set.
   */
  pilotEngineOutAccelerationAltitude: number | null;

  /**
   * Engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultEngineOutAccelerationAltitude: number | null;

  /**
   * Returns pilot entered engine-out acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get engineOutAccelerationAltitude(): number | null;

  /**
   * Whether engine-out acceleration altitude is pilot entered; Null if not set.
   */
  get engineOutAccelerationAltitudeIsPilotEntered(): boolean;

  /**
   * Pilot entered missed apch thrust reduction altitude; Unit: Feet; Null if not set.
   */
  pilotMissedThrustReductionAltitude: number | null;

  /**
   * Missed apch thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultMissedThrustReductionAltitude: number | null;

  /**
   * Returns pilot entered missed apch thrust reduction altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedThrustReductionAltitude(): number | null;

  /**
   * Whether missed apch thrust reduction altitude is pilot entered
   */
  get missedThrustReductionAltitudeIsPilotEntered(): boolean;

  /**
   * Pilot entered missed apch acceleration altitude; Unit: Feet; Null if not set.
   */
  pilotMissedAccelerationAltitude: number | null;

  /**
   * Missed apch acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultMissedAccelerationAltitude: number | null;

  /**
   * Returns pilot entered missed apch acceleration altitude of set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedAccelerationAltitude(): number | null;

  /**
   * Whether missed apch acceleration altitude is pilot entered
   */
  get missedAccelerationAltitudeIsPilotEntered(): boolean;

  /**
   * Pilot entered missed apch engine-out acceleration altitude; Unit: Feet; Null if not set.
   */
  pilotMissedEngineOutAccelerationAltitude: number | null;

  /**
   * Missed apch engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultMissedEngineOutAccelerationAltitude: number | null;

  /**
   * Returns pilot entered missed apch engine-out acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedEngineOutAccelerationAltitude(): number | null;

  /**
   * Whether missed apch engine-out acceleration altitude is pilot entered
   */
  get missedEngineOutAccelerationAltitudeIsPilotEntered(): boolean;

  /**
   * The maximum speed imposed by the climb speed limit of the main flight plan or null if not set.
   */
  climbSpeedLimitSpeed: number | null;

  /**
   * The altitude below which the climb speed limit of the main flight plan applies or null if not set.
   */
  climbSpeedLimitAltitude: number | null;

  /**
   * Whether the climb speed limit is pilot entered.
   */
  isClimbSpeedLimitPilotEntered: boolean;

  /**
   * The maximum speed imposed by the descent speed limit of the main flight plan or null if not set.
   */
  descentSpeedLimitSpeed: number | null;

  /**
   * The altitude below which the descent speed limit of the main flight plan applies or null if not set.
   */
  descentSpeedLimitAltitude: number | null;

  /**
   * Whether the descent speed limit of the main flight plan is pilot entered.
   */
  isDescentSpeedLimitPilotEntered: boolean;

  /**
   * The maximum speed imposed by the climb speed limit of the alternate flight plan or null if not set.
   */
  alternateClimbSpeedLimitSpeed: number | null;

  /**
   * The altitude below which the climb speed limit of the alternate flight plan applies or null if not set.
   */
  alternateClimbSpeedLimitAltitude: number | null;

  /**
   * Whether the climb speed limit of the alternate flight plan is pilot entered.
   */
  isAlternateClimbSpeedLimitPilotEntered: boolean;

  /**
   * The maximum speed imposed by the descent speed limit of the alternate flight plan or null if not set.
   */
  alternateDescentSpeedLimitSpeed: number | null;

  /**
   * The altitude below which the descent speed limit of the alternate flight plan applies or null if not set.
   */
  alternateDescentSpeedLimitAltitude: number | null;

  /**
   * Whether the descent speed limit of the alternate flight plan is pilot entered.
   */
  isAlternateDescentSpeedLimitPilotEntered: boolean;

  /**
   * The zero fuel weight entered by the pilot in tonnes, or null if not set.
   */
  zeroFuelWeight: number | null;

  /**
   * The zero fuel weight center of gravity entered by the pilot as a percentage, or null if not set
   */
  zeroFuelWeightCenterOfGravity: number | null;

  /**
   * The block fuel entered by the pilot in tonnes, or null if not set.
   */
  blockFuel: number | null;

  /**
   * The taxi fuel entered by the pilot in tonnes, or null if not set.
   */
  pilotTaxiFuel: number | null;

  /**
   * The taxi fuel from the AMI database in tonnes
   */
  defaultTaxiFuel: number;

  /**
   * Returns the pilot entered taxi fuel if set, the AMI taxi fuel value otherwise; Unit: tonnes; Null if not set.
   */
  get taxiFuel(): number | null;

  /**
   * Whether taxi fuel is pilot entered.
   */
  get taxiFuelIsPilotEntered(): boolean;

  /**
   * The route reserve fuel entered by the pilot in tonnes, or null if not set.
   */
  pilotRouteReserveFuel: number | null;

  /**
   * The route reserve fuel percentage entered by the pilot as a percentage, or null if not set.
   */
  pilotRouteReserveFuelPercentage: number | null;

  /**
   * The route reserve fuel percentage from the AMI database
   */
  defaultRouteReserveFuelPercentage: number;

  /**
   * Returns the pilot entered route reserve fuel percentage if set, the AMI route reserve fuel percentage value otherwise
   */
  get routeReserveFuelPercentage(): number;

  /**
   * Whether the route reserve fuel percentage is pilot entered.
   */
  get isRouteReserveFuelPrecentagePilotEntered(): boolean;

  /**
   * The alternate fuel entered by the pilot in tonnes, or null if not set.
   */
  pilotAlternateFuel: number | null;

  /**
   * The final holding fuel entered by the pilot in tonnes, or null if not set.
   */
  pilotFinalHoldingFuel: number | null;

  /**
   * The final holding time entered by the pilot in minutes, or null if not set.
   */
  pilotFinalHoldingTime: number | null;

  /**
   * The final holding time from the AMI database in minutes
   */
  defaultFinalHoldingTime: number;

  /**
   * Returns the pilot entered final holding time in minutes if set, the AMI final holding time value otherwise
   */
  get finalHoldingTime(): number;

  /**
   * Whether final holding time is pilot entered.
   */
  get isFinalHoldingTimePilotEntered(): boolean;

  /**
   * The minimum fuel on board at the destination entered by the pilot in tonnes, or null if not set.
   */
  pilotMinimumDestinationFuelOnBoard: number | null;

  /**
   * The trip wind value entered by the pilot in kts, or null if not set.
   * Positive values indicate a tailwind, negative values indicate a headwind.
   */
  pilotTripWind: number | null;

  clone(): this;
}

export type FlightPlanPerformanceDataProperties = Omit<FlightPlanPerformanceData, 'clone'>;

// TODO this should remain in fbw-a32nx/ once FMS is moved to fbw-common

export class A320FlightPlanPerformanceData implements FlightPlanPerformanceData {
  public clone(): this {
    const cloned = new A320FlightPlanPerformanceData();

    cloned.v1 = this.v1;
    cloned.vr = this.vr;
    cloned.v2 = this.v2;

    cloned.pilotThrustReductionAltitude = this.pilotThrustReductionAltitude;
    cloned.defaultThrustReductionAltitude = this.defaultThrustReductionAltitude;

    cloned.pilotAccelerationAltitude = this.pilotAccelerationAltitude;
    cloned.defaultAccelerationAltitude = this.defaultAccelerationAltitude;

    cloned.pilotEngineOutAccelerationAltitude = this.pilotEngineOutAccelerationAltitude;
    cloned.defaultEngineOutAccelerationAltitude = this.defaultEngineOutAccelerationAltitude;

    cloned.pilotMissedThrustReductionAltitude = this.pilotMissedThrustReductionAltitude;
    cloned.defaultMissedThrustReductionAltitude = this.defaultMissedThrustReductionAltitude;

    cloned.pilotMissedAccelerationAltitude = this.pilotMissedAccelerationAltitude;
    cloned.defaultMissedAccelerationAltitude = this.defaultMissedAccelerationAltitude;

    cloned.pilotMissedEngineOutAccelerationAltitude = this.pilotMissedEngineOutAccelerationAltitude;
    cloned.defaultMissedEngineOutAccelerationAltitude = this.defaultMissedEngineOutAccelerationAltitude;

    cloned.databaseTransitionAltitude = this.databaseTransitionAltitude;
    cloned.pilotTransitionAltitude = this.pilotTransitionAltitude;

    cloned.databaseTransitionLevel = this.databaseTransitionLevel;
    cloned.pilotTransitionLevel = this.pilotTransitionLevel;

    cloned.cruiseFlightLevel = this.cruiseFlightLevel;
    cloned.cruiseTemperature = this.cruiseTemperature;
    cloned.pilotGroundTemperature = this.pilotGroundTemperature;
    cloned.defaultGroundTemperature = this.defaultGroundTemperature;
    cloned.costIndex = this.costIndex;
    cloned.pilotTropopause = this.pilotTropopause;
    cloned.defaultTropopause = this.defaultTropopause;

    cloned.climbSpeedLimitSpeed = this.climbSpeedLimitSpeed;
    cloned.climbSpeedLimitAltitude = this.climbSpeedLimitAltitude;
    cloned.isClimbSpeedLimitPilotEntered = this.isClimbSpeedLimitPilotEntered;

    cloned.descentSpeedLimitSpeed = this.descentSpeedLimitSpeed;
    cloned.descentSpeedLimitAltitude = this.descentSpeedLimitAltitude;
    cloned.isDescentSpeedLimitPilotEntered = this.isDescentSpeedLimitPilotEntered;

    cloned.alternateClimbSpeedLimitSpeed = this.alternateClimbSpeedLimitSpeed;
    cloned.alternateClimbSpeedLimitAltitude = this.alternateClimbSpeedLimitAltitude;
    cloned.isAlternateClimbSpeedLimitPilotEntered = this.isAlternateClimbSpeedLimitPilotEntered;

    cloned.alternateDescentSpeedLimitSpeed = this.alternateDescentSpeedLimitSpeed;
    cloned.alternateDescentSpeedLimitAltitude = this.alternateDescentSpeedLimitAltitude;
    cloned.isAlternateDescentSpeedLimitPilotEntered = this.isAlternateDescentSpeedLimitPilotEntered;

    cloned.zeroFuelWeight = this.zeroFuelWeight;
    cloned.zeroFuelWeightCenterOfGravity = this.zeroFuelWeightCenterOfGravity;
    cloned.blockFuel = this.blockFuel;
    cloned.pilotTaxiFuel = this.pilotTaxiFuel;
    cloned.defaultTaxiFuel = this.defaultTaxiFuel;
    cloned.pilotRouteReserveFuel = this.pilotRouteReserveFuel;
    cloned.pilotRouteReserveFuelPercentage = this.pilotRouteReserveFuelPercentage;
    cloned.defaultRouteReserveFuelPercentage = this.defaultRouteReserveFuelPercentage;
    cloned.pilotAlternateFuel = this.pilotAlternateFuel;
    cloned.pilotFinalHoldingFuel = this.pilotFinalHoldingFuel;
    cloned.pilotFinalHoldingTime = this.pilotFinalHoldingTime;
    cloned.defaultFinalHoldingTime = this.defaultFinalHoldingTime;
    cloned.pilotMinimumDestinationFuelOnBoard = this.pilotMinimumDestinationFuelOnBoard;
    cloned.pilotTripWind = this.pilotTripWind;

    return cloned as this;
  }

  cruiseFlightLevel: number | null = null;

  cruiseTemperature: number | null = null;

  defaultGroundTemperature: number | null = null;

  pilotGroundTemperature: number | null = null;

  get groundTemperature() {
    return this.pilotGroundTemperature ?? this.defaultGroundTemperature;
  }

  get groundTemperatureIsPilotEntered() {
    return this.pilotGroundTemperature !== undefined;
  }

  /**
   * Cost index; Unit: No unit; Null if not set.
   */
  costIndex: number | null = null;

  /**
   * Tropopause altitude entered by the pilot; Unit: Feet; Null if not set.
   */
  pilotTropopause: number | null = null;

  /**
   * Default tropopause altitude; Unit: Feet; Null if not set.
   */
  defaultTropopause: number | null = 36090;

  get tropopause() {
    const rawAlt = this.pilotTropopause ?? this.defaultTropopause;
    return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
  }

  get tropopauseIsPilotEntered() {
    return this.pilotTropopause !== null;
  }

  /**
   * V1 speed; Unit: Knots; Null if not set.
   */
  v1: number | null = null;

  /**
   * Vr speed; Unit: Knots; Null if not set.
   */
  vr: number | null = null;

  /**
   * V2 speed; Unit: Knots; Null if not set.
   */
  v2: number | null = null;

  // THR RED

  /**
   * Pilot entered thrust reduction altitude; Unit: Feet; Null if not set.
   */
  pilotThrustReductionAltitude: number | null = null;

  /**
   * Thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultThrustReductionAltitude: number | null = null;

  /**
   * Pilot entered thrust reduction altitude if set, from nav database otherwise; Unit: Feet; Null if not set.
   */
  get thrustReductionAltitude() {
    const rawAlt = this.pilotThrustReductionAltitude ?? this.defaultThrustReductionAltitude;
    return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
  }

  /**
   * Whether thrust reduction altitude is pilot entered;
   */
  get thrustReductionAltitudeIsPilotEntered() {
    return this.pilotThrustReductionAltitude !== null;
  }

  // ACC

  /**
   * Pilot entered acceleration altitude; Unit: Feet; Null if not set.
   */
  pilotAccelerationAltitude: number | null = null;

  /**
   * Acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultAccelerationAltitude: number | null = null;

  /**
   * Returns pilot entered acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get accelerationAltitude() {
    const rawAlt = this.pilotAccelerationAltitude ?? this.defaultAccelerationAltitude;
    return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
  }

  /**
   * Whether acceleration altitude is pilot entered; Null if not set.
   */
  get accelerationAltitudeIsPilotEntered() {
    return this.pilotAccelerationAltitude !== null;
  }

  // EO ACC

  /**
   * Pilot entered engine-out acceleration altitude; Unit: Feet; Null if not set.
   */
  pilotEngineOutAccelerationAltitude: number | null = null;

  /**
   * Engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultEngineOutAccelerationAltitude: number | null = null;

  /**
   * Returns pilot entered engine-out acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get engineOutAccelerationAltitude() {
    const rawAlt = this.pilotEngineOutAccelerationAltitude ?? this.defaultEngineOutAccelerationAltitude;
    return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
  }

  /**
   * Whether engine-out acceleration altitude is pilot entered; Null if not set.
   */
  get engineOutAccelerationAltitudeIsPilotEntered() {
    return this.pilotEngineOutAccelerationAltitude !== null;
  }

  // MISSED THR RED

  /**
   * Pilot entered missed apch thrust reduction altitude; Unit: Feet; Null if not set.
   */
  pilotMissedThrustReductionAltitude: number | null = null;

  /**
   * Missed apch thrust reduction altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultMissedThrustReductionAltitude: number | null = null;

  /**
   * Returns pilot entered missed apch thrust reduction altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedThrustReductionAltitude() {
    const rawAlt = this.pilotMissedThrustReductionAltitude ?? this.defaultMissedThrustReductionAltitude;
    return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
  }

  /**
   * Whether missed apch thrust reduction altitude is pilot entered
   */
  get missedThrustReductionAltitudeIsPilotEntered() {
    return this.pilotMissedThrustReductionAltitude !== null;
  }

  // MISSED ACC

  /**
   * Pilot entered missed apch acceleration altitude; Unit: Feet; Null if not set.
   */
  pilotMissedAccelerationAltitude: number | null = null;

  /**
   * Missed apch acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultMissedAccelerationAltitude: number | null = null;

  /**
   * Returns pilot entered missed apch acceleration altitude of set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedAccelerationAltitude() {
    const rawAlt = this.pilotMissedAccelerationAltitude ?? this.defaultMissedAccelerationAltitude;
    return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
  }

  /**
   * Whether missed apch acceleration altitude is pilot entered
   */
  get missedAccelerationAltitudeIsPilotEntered() {
    return this.pilotMissedAccelerationAltitude !== null;
  }

  // MISSED EO ACC

  /**
   * Pilot entered missed apch engine-out acceleration altitude; Unit: Feet; Null if not set.
   */
  pilotMissedEngineOutAccelerationAltitude: number | null = null;

  /**
   * Missed apch engine-out acceleration altitude from nav database; Unit: Feet; Null if not set.
   */
  defaultMissedEngineOutAccelerationAltitude: number | null = null;

  /**
   * Returns pilot entered missed apch engine-out acceleration altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get missedEngineOutAccelerationAltitude() {
    const rawAlt = this.pilotMissedEngineOutAccelerationAltitude ?? this.defaultMissedEngineOutAccelerationAltitude;
    return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
  }

  /**
   * Whether missed apch engine-out acceleration altitude is pilot entered
   */
  get missedEngineOutAccelerationAltitudeIsPilotEntered() {
    return this.pilotMissedEngineOutAccelerationAltitude !== null;
  }

  /**
   * Transition altitude from nav database; Unit: Feet; Null if not set.
   */
  databaseTransitionAltitude: number | null = null;

  /**
   * Transition level from database; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  pilotTransitionAltitude: number | null = null;

  /**
   * Returns pilot entered altitude if set, nav database value otherwise; Unit: Feet; Null if not set.
   */
  get transitionAltitude() {
    const rawAlt = this.pilotTransitionAltitude ?? this.databaseTransitionAltitude;
    return rawAlt !== null ? MathUtils.round(rawAlt, 10) : null;
  }

  /**
   * Whether returned transition altitude is from nav database;
   */
  get transitionAltitudeIsFromDatabase() {
    return this.pilotTransitionAltitude === null;
  }

  /**
   * Transition level from database; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  databaseTransitionLevel: number | null = null;

  /**
   * Pilot entered transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  pilotTransitionLevel: number | null = null;

  /**
   * Transition level; Unit: flight level (i.e. hundreds of feets); Null if not set.
   */
  get transitionLevel() {
    const rawLevel = this.pilotTransitionLevel ?? this.databaseTransitionLevel;
    return rawLevel !== null ? MathUtils.round(rawLevel, 1) : null;
  }

  /**
   * Whether returned transition level is from nav database;
   */
  get transitionLevelIsFromDatabase() {
    return this.pilotTransitionLevel === null;
  }

  /**
   * The maximum speed imposed by the climb speed limit of the main flight plan or null if not set.
   */
  climbSpeedLimitSpeed: number | null = DefaultPerformanceData.ClimbSpeedLimitSpeed;

  /**
   * The altitude below which the climb speed limit of the main flight plan applies or null if not set.
   */
  climbSpeedLimitAltitude: number | null = DefaultPerformanceData.ClimbSpeedLimitAltitude;

  /**
   * Whether the climb speed limit is pilot entered.
   */
  isClimbSpeedLimitPilotEntered: boolean = false;

  /**
   * The maximum speed imposed by the descent speed limit of the main flight plan or null if not set.
   */
  descentSpeedLimitSpeed: number | null = DefaultPerformanceData.DescentSpeedLimitSpeed;

  /**
   * The altitude below which the descent speed limit of the main flight plan applies or null if not set.
   */
  descentSpeedLimitAltitude: number | null = DefaultPerformanceData.DescentSpeedLimitAltitude;

  /**
   * Whether the descent speed limit of the main flight plan is pilot entered.
   */
  isDescentSpeedLimitPilotEntered: boolean = false;

  /**
   * The maximum speed imposed by the climb speed limit of the alternate flight plan or null if not set.
   */
  alternateClimbSpeedLimitSpeed: number | null = DefaultPerformanceData.ClimbSpeedLimitSpeed;

  /**
   * The altitude below which the climb speed limit of the alternate flight plan applies or null if not set.
   */
  alternateClimbSpeedLimitAltitude: number | null = DefaultPerformanceData.ClimbSpeedLimitAltitude;

  /**
   * Whether the climb speed limit of the alternate flight plan is pilot entered.
   */
  isAlternateClimbSpeedLimitPilotEntered: boolean = false;

  /**
   * The maximum speed imposed by the descent speed limit of the alternate flight plan or null if not set.
   */
  alternateDescentSpeedLimitSpeed: number | null = DefaultPerformanceData.DescentSpeedLimitSpeed;

  /**
   * The altitude below which the descent speed limit of the alternate flight plan applies or null if not set.
   */
  alternateDescentSpeedLimitAltitude: number | null = DefaultPerformanceData.DescentSpeedLimitAltitude;

  /**
   * Whether the descent speed limit of the alternate flight plan is pilot entered.
   */
  isAlternateDescentSpeedLimitPilotEntered: boolean = false;

  /**
   * The zero fuel weight entered by the pilot in tonnes, or null if not set.
   */
  zeroFuelWeight: number | null = null;

  /**
   * The zero fuel weight center of gravity entered by the pilot as a percentage, or null if not set
   */
  zeroFuelWeightCenterOfGravity: number | null = null;

  /**
   * The block fuel entered by the pilot in tonnes, or null if not set.
   */
  blockFuel: number | null = null;

  /**
   * The taxi fuel entered by the pilot in tonnes, or null if not set.
   */
  pilotTaxiFuel: number | null = null;

  /**
   * The taxi fuel from the AMI database in tonnes
   * FIXME should come from the AMI database
   */
  defaultTaxiFuel: number = 0.2;

  get taxiFuel() {
    return this.pilotTaxiFuel ?? this.defaultTaxiFuel;
  }

  get taxiFuelIsPilotEntered() {
    return this.pilotTaxiFuel !== null;
  }

  /**
   * The route reserve fuel entered by the pilot in tonnes, or null if not set.
   */
  pilotRouteReserveFuel: number | null = null;

  /**
   * The route reserve percentage entered by the pilot as a percentage, or null if not set.
   */
  pilotRouteReserveFuelPercentage: number | null = null;

  /**
   * The route reserve percentage from the AMI database
   * FIXME should come from the AMI database
   */
  defaultRouteReserveFuelPercentage: number = 5;

  /**
   * Returns the pilot entered route reserve fuel percentage if set, the AMI route reserve fuel percentage value otherwise
   */
  get routeReserveFuelPercentage() {
    return this.pilotRouteReserveFuelPercentage ?? this.defaultRouteReserveFuelPercentage;
  }

  /**
   * Whether the route reserve fuel percentage is pilot entered.
   */
  get isRouteReserveFuelPrecentagePilotEntered() {
    return this.pilotRouteReserveFuelPercentage !== null;
  }

  /**
   * The alternate fuel entered by the pilot in tonnes, or null if not set.
   */
  pilotAlternateFuel: number | null = null;

  /**
   * The final holding fuel entered by the pilot in tonnes, or null if not set.
   */
  pilotFinalHoldingFuel: number | null = null;

  /**
   * The final holding time entered by the pilot in minutes, or null if not set.
   */
  pilotFinalHoldingTime: number | null = null;

  /**
   * The final holding time from the AMI database in minutes
   */
  defaultFinalHoldingTime: number = 30;

  /**
   * Returns the pilot entered final holding time in minutes if set, the AMI final holding time value otherwise
   */
  get finalHoldingTime() {
    return this.pilotFinalHoldingTime ?? this.defaultFinalHoldingTime;
  }

  /**
   * Whether final holding time is pilot entered.
   */
  get isFinalHoldingTimePilotEntered() {
    return this.pilotFinalHoldingTime !== null;
  }

  /**
   * The minimum fuel on board at the destination entered by the pilot in tonnes, or null if not set.
   */
  pilotMinimumDestinationFuelOnBoard: number | null = null;

  /**
   * The trip wind value entered by the pilot in kts, or null if not set.
   * +ve for tailwind, -ve for headwind
   */
  pilotTripWind: number | null = null;

  serialize(): SerializedFlightPlanPerformanceData {
    return {
      cruiseFlightLevel: this.cruiseFlightLevel,
      cruiseTemperature: this.cruiseTemperature,
      defaultGroundTemperature: this.defaultGroundTemperature,
      pilotGroundTemperature: this.pilotGroundTemperature,
      costIndex: this.costIndex,
      pilotTropopause: this.pilotTropopause,
      defaultTropopause: this.defaultTropopause,
      v1: this.v1,
      vr: this.vr,
      v2: this.v2,
      pilotThrustReductionAltitude: this.pilotThrustReductionAltitude,
      defaultThrustReductionAltitude: this.defaultThrustReductionAltitude,
      pilotAccelerationAltitude: this.pilotAccelerationAltitude,
      defaultAccelerationAltitude: this.defaultAccelerationAltitude,
      pilotEngineOutAccelerationAltitude: this.pilotEngineOutAccelerationAltitude,
      defaultEngineOutAccelerationAltitude: this.defaultEngineOutAccelerationAltitude,
      pilotMissedThrustReductionAltitude: this.pilotMissedThrustReductionAltitude,
      defaultMissedThrustReductionAltitude: this.defaultMissedThrustReductionAltitude,
      pilotMissedAccelerationAltitude: this.pilotMissedAccelerationAltitude,
      defaultMissedAccelerationAltitude: this.defaultMissedAccelerationAltitude,
      pilotMissedEngineOutAccelerationAltitude: this.pilotMissedEngineOutAccelerationAltitude,
      defaultMissedEngineOutAccelerationAltitude: this.defaultMissedEngineOutAccelerationAltitude,
      databaseTransitionAltitude: this.databaseTransitionAltitude,
      pilotTransitionAltitude: this.pilotTransitionAltitude,
      databaseTransitionLevel: this.databaseTransitionLevel,
      pilotTransitionLevel: this.pilotTransitionLevel,
      climbSpeedLimitSpeed: this.climbSpeedLimitSpeed,
      climbSpeedLimitAltitude: this.climbSpeedLimitAltitude,
      isClimbSpeedLimitPilotEntered: this.isClimbSpeedLimitPilotEntered,
      descentSpeedLimitSpeed: this.descentSpeedLimitSpeed,
      descentSpeedLimitAltitude: this.descentSpeedLimitAltitude,
      isDescentSpeedLimitPilotEntered: this.isDescentSpeedLimitPilotEntered,
      alternateClimbSpeedLimitSpeed: this.alternateClimbSpeedLimitSpeed,
      alternateClimbSpeedLimitAltitude: this.alternateClimbSpeedLimitAltitude,
      isAlternateClimbSpeedLimitPilotEntered: this.isAlternateClimbSpeedLimitPilotEntered,
      alternateDescentSpeedLimitSpeed: this.alternateDescentSpeedLimitSpeed,
      alternateDescentSpeedLimitAltitude: this.alternateDescentSpeedLimitAltitude,
      isAlternateDescentSpeedLimitPilotEntered: this.isAlternateDescentSpeedLimitPilotEntered,
      zeroFuelWeight: this.zeroFuelWeight,
      zeroFuelWeightCenterOfGravity: this.zeroFuelWeightCenterOfGravity,
      blockFuel: this.blockFuel,
      pilotTaxiFuel: this.pilotTaxiFuel,
      defaultTaxiFuel: this.defaultTaxiFuel,
      pilotRouteReserveFuel: this.pilotRouteReserveFuel,
      pilotRouteReserveFuelPercentage: this.pilotRouteReserveFuelPercentage,
      defaultRouteReserveFuelPercentage: this.defaultRouteReserveFuelPercentage,
      pilotAlternateFuel: this.pilotAlternateFuel,
      pilotFinalHoldingFuel: this.pilotFinalHoldingFuel,
      pilotFinalHoldingTime: this.pilotFinalHoldingTime,
      defaultFinalHoldingTime: this.defaultFinalHoldingTime,
      pilotMinimumDestinationFuelOnBoard: this.pilotMinimumDestinationFuelOnBoard,
      pilotTripWind: this.pilotTripWind,
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
}

// FIXME move to AMI database
export class DefaultPerformanceData {
  static readonly ClimbSpeedLimitSpeed = 250;

  static readonly ClimbSpeedLimitAltitude = 10_000;

  static readonly DescentSpeedLimitSpeed = 250;

  static readonly DescentSpeedLimitAltitude = 10_000;
}
