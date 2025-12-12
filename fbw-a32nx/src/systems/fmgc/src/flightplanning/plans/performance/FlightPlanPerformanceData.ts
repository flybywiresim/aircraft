// @ts-strict-ignore
// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MutableSubscribable, Subscribable } from '@microsoft/msfs-sdk';

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
   * Cruise temperature pilot entry; Unit: degrees C Null if not set.
   */
  readonly cruiseTemperaturePilotEntry: MutableSubscribable<number | null>;

  /**
   * Cruise temperature ISA temperature; Unit: degrees C Null if not set.
   * A380 specific
   */
  readonly cruiseTemperatureIsaTemp?: MutableSubscribable<number | null>;

  /**
   * Cruise temperature to display; Unit: degrees C Null if not set.
   */
  get cruiseTemperature(): Subscribable<number | null>;

  /**
   * Whether cruise temperature is pilot entered.
   */
  get cruiseTemperatureIsPilotEntered(): Subscribable<boolean>;

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
   * Whether the route reserve fuel weight is pilot entered.
   */
  get isRouteReserveFuelPilotEntered(): Subscribable<boolean>;

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
  get isRouteReserveFuelPercentagePilotEntered(): Subscribable<boolean>;

  /**
   * The alternate fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotAlternateFuel: MutableSubscribable<number | null>;

  /**
   * Whether an alternate exists.
   * A380 specific
   */
  readonly alternateExists?: MutableSubscribable<boolean>;

  /**
   * The alternate fuel calculated automatically, or null if not set.
   * A380 specific
   */
  readonly defaultAlternateFuel?: Subscribable<number | null>;

  /**
   * Returns the pilot alternate fuel if set, the calculated value otherwise
   * A380 specific
   */
  get alternateFuel(): Subscribable<number | null>;

  /**
   * Whether alternate fuel is pilot entered.
   * A380 specific
   */
  get isAlternateFuelPilotEntered(): Subscribable<boolean>;

  /**
   * The final holding fuel entered by the pilot in tonnes, or null if not set.
   */
  readonly pilotFinalHoldingFuel: MutableSubscribable<number | null>;

  /**
   * Whether final holding fuel weight is pilot entered.
   */
  get isFinalHoldingFuelPilotEntered(): Subscribable<boolean>;

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
   *  The minimum fuel on board at the destination. Pilot entered if set, final fuel + alternate fuel otherwise. Null if none of these are defined; Unit: tonnes.
   */
  get minimumDestinationFuelOnBoard(): Subscribable<number | null>;

  /**
   * Whether minimum fuel on board at the destination is pilot entered.
   */
  get isMinimumDestinationFuelOnBoardPilotEntered(): Subscribable<boolean>;

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

  // ----------------------------------------------
  // A380 specific
  // ----------------------------------------------

  /**
   * The number of passengers on this flight, or null if not set.
   */
  readonly paxNumber?: MutableSubscribable<number | null>;

  /**
   * Jettison target GW in kg, or null if not set.
   */
  readonly jettisonGrossWeight?: MutableSubscribable<number | null>;

  /**
   * The selected power settting for takeoff (TOGA, FLEX, DERATED), or null if not set.
   * A380 specific
   */
  readonly takeoffPowerSetting?: MutableSubscribable<TakeoffPowerSetting>;

  /**
   * The selected derated power settting for takeoff, or null if not set.
   * A380 specific
   */
  readonly takeoffDeratedSetting?: MutableSubscribable<TakeoffDerated>;

  /**
   * The GW CG for takeoff, or null if not set.
   * A380 specific
   */
  readonly takeoffThsFor?: MutableSubscribable<number | null>;

  /**
   * The packs setting for takeoff, or null if not set.
   * A380 specific
   */
  readonly takeoffPacks?: MutableSubscribable<TakeoffPacks | null>;

  /**
   * The anti ice setting for takeoff, or null if not set.
   * A380 specific
   */
  readonly takeoffAntiIce?: MutableSubscribable<TakeoffAntiIce | null>;

  /**
   * The NADP activation status, or null if not set.
   * A380 specific
   */
  readonly noiseEnabled?: MutableSubscribable<boolean>;

  /**
   * The NADP N1 setting, or null if not set.
   * A380 specific
   */
  readonly noiseN1?: MutableSubscribable<number | null>;

  /**
   * The NADP speed setting in knots, or null if not set.
   * A380 specific
   */
  readonly noiseSpeed?: MutableSubscribable<number | null>;

  /**
   * The NADP end altitude in feet, or null if not set.
   * A380 specific
   */
  readonly noiseEndAltitude?: MutableSubscribable<number | null>;

  /**
   * The cost index mode (ECON or LRC), or null if not set.
   * A380 specific
   */
  readonly costIndexMode?: MutableSubscribable<CostIndexMode | null>;

  /**
   * The derated climb setting, or null if not set.
   * A380 specific
   */
  readonly climbDerated?: MutableSubscribable<ClimbDerated | null>;

  /**
   * The descent cabin rate setting in ft/min, or null if not set.
   * A380 specific
   */
  readonly descentCabinRate?: MutableSubscribable<number | null>;

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

export interface SerializedFlightPlanPerformanceData {
  cruiseFlightLevel: number | null;
  cruiseTemperaturePilotEntry: number | null;
  cruiseTemperatureIsaTemp?: number | null; // A380 specific
  defaultGroundTemperature: number | null;
  pilotGroundTemperature: number | null;
  costIndex: number | null;
  defaultTropopause: number;
  pilotTropopause: number | null;

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
  alternateExists?: boolean; // A380 specific
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

  // A380 specific
  paxNumber?: number | null;
  jettisonGrossWeight?: number | null;
  takeoffPowerSetting?: TakeoffPowerSetting | null;
  takeoffDeratedSetting?: TakeoffDerated | null;
  takeoffThsFor?: number | null;
  takeoffPacks?: TakeoffPacks | null;
  takeoffAntiIce?: TakeoffAntiIce | null;
  noiseEnabled?: boolean;
  noiseN1?: number | null;
  noiseSpeed?: number | null;
  noiseEndAltitude?: number | null;
  costIndexMode?: CostIndexMode | null;
  climbDerated?: ClimbDerated | null;
  descentCabinRate?: number | null;
}

// FIXME move to AMI database
export class DefaultPerformanceData {
  static readonly ClimbSpeedLimitSpeed = 250;

  static readonly ClimbSpeedLimitAltitude = 10_000;

  static readonly DescentSpeedLimitSpeed = 250;

  static readonly DescentSpeedLimitAltitude = 10_000;
}

// A380 specific types
export enum TakeoffPowerSetting {
  TOGA = 0,
  FLEX = 1,
  DERATED = 2,
}

export enum TakeoffDerated {
  D01 = 0,
  D02 = 1,
  D03 = 2,
  D04 = 3,
  D05 = 4,
}

export enum TakeoffPacks {
  OFF_APU = 0,
  ON = 1,
}

export enum TakeoffAntiIce {
  OFF = 0,
  ENG_ONLY = 1,
  ENG_WINGS = 2,
}

export enum CostIndexMode {
  LRC = 0,
  ECON = 1,
}

export enum ClimbDerated {
  NONE = 0,
  D01 = 1,
  D02 = 2,
  D03 = 3,
  D04 = 4,
  D05 = 5,
}
