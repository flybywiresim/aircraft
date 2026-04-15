// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { Fmgc, GuidanceController } from '@fmgc/guidance/GuidanceController';

import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { FmgcFlightPhase } from '@shared/flightphase';
import {
  EventBus,
  MappedSubject,
  MutableSubscribable,
  Subject,
  Subscribable,
  SubscribableUtils,
  Subscription,
} from '@microsoft/msfs-sdk';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { Arinc429LocalVarConsumerSubject, Arinc429Word, Fix, Runway, Units } from '@flybywiresim/fbw-sdk';
import { Feet } from 'msfs-geo';
import { minGw } from '@shared/PerformanceConstants';
import { A380AircraftConfig } from '@fmgc/flightplanning/A380AircraftConfig';
import { FqmsBusEvents } from '@shared/publishers/FqmsBusPublisher';

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

export const LOWEST_FUEL_ESTIMATE_KGS = Units.poundToKilogram(A380AircraftConfig.vnavConfig.LOWEST_FUEL_ESTIMATE);

/**
 * Temporary place for data which is found nowhere else. Not associated to flight plans right now, which should be the case for some of these values
 */
export class FmgcData {
  static fmcFormatValue(sub: Subscribable<number | null>, numberDashes = 3) {
    return sub.map((it) => (it !== null ? it.toFixed(0) : '-'.repeat(numberDashes)));
  }

  public readonly cpnyFplnAvailable = Subject.create(false);

  public readonly cpnyFplnRequestedForPlan = Subject.create<FlightPlanIndex | null>(null);

  public readonly cpnyFplnUplinkInProgress = Subject.create(false);

  public readonly atcCallsign = Subject.create<string | null>(null);

  public readonly tripFuelAtPreflight = Subject.create<number | null>(null); // in tonnes

  public readonly destEfobBelowMinInActive = Subject.create(false);

  /**
   * For which departure runway the v speeds have been inserted
   */
  public readonly vSpeedsForRunway = Subject.create<string | null>(null);

  /**
   * V1 speed, to be confirmed after rwy change
   */
  readonly v1ToBeConfirmed = Subject.create<Knots | null>(null);

  /**
   * VR speed, to be confirmed after rwy change
   */
  readonly vrToBeConfirmed = Subject.create<Knots | null>(null);

  /**
   * V2 speed, to be confirmed after rwy change
   */
  readonly v2ToBeConfirmed = Subject.create<Knots | null>(null);

  public readonly flapRetractionSpeed = Subject.create<Knots | null>(null);

  public readonly slatRetractionSpeed = Subject.create<Knots | null>(null);

  public readonly greenDotSpeed = Subject.create<Knots | null>(null);

  public readonly approachGreenDotSpeed = Subject.create<Knots | null>(null);

  public readonly approachSlatRetractionSpeed = Subject.create<Knots | null>(null);

  public readonly approachFlapRetractionSpeed = Subject.create<Knots | null>(null);

  public readonly approachVapp = Subject.create<Knots | null>(null);

  /** in feet. null if not set. */
  public readonly climbPredictionsReferencePilotEntry = Subject.create<number | null>(null);

  /** in feet. null if not set. */
  public readonly climbPredictionsReferenceAutomatic = Subject.create<number | null>(null);

  public readonly climbPredictionsReference = MappedSubject.create(
    ([calc, pe]) => (pe !== null ? pe : calc),
    this.climbPredictionsReferenceAutomatic,
    this.climbPredictionsReferencePilotEntry,
  );

  public readonly climbPredictionsReferenceIsPilotEntered = this.climbPredictionsReferencePilotEntry.map(
    (it) => it !== null,
  );

  public readonly approachVref = Subject.create<Knots | null>(null);

  public readonly approachVls = Subject.create<Knots | null>(null);

  public readonly positionMonitorFix = Subject.create<Fix | null>(null);

  /**
   * Estimated take-off time, in seconds. Displays as HH:mm:ss. Null if not set
   */
  public readonly estimatedTakeoffTime = Subject.create<number | null>(null);

  /** Indicates OEI situation */
  public readonly engineOut = Subject.create(false);

  /** Fuel Penalty Factor in percentage between none and 999. Reset at done phase
   */
  public readonly fuelPenaltyPercentage = Subject.create<number>(null);

  public readonly fuelPenaltyActive = this.fuelPenaltyPercentage.map((v) => v !== null && v > 0);

  private static readonly DEFAULT_SETTINGS = new FmgcData();

  /**
   *
   * @param dueToDonePhase indicates wheter to reset all fmgs data or only data which is wiped at DONE phase
   */
  public reset(dueToDonePhase?: boolean): void {
    for (const key in FmgcData.DEFAULT_SETTINGS) {
      const prop = key as keyof FmgcData;
      if (SubscribableUtils.isMutableSubscribable(this[prop])) {
        (this[prop] as MutableSubscribable<any>).set((FmgcData.DEFAULT_SETTINGS[prop] as Subscribable<any>).get());
      }
    }
    if (dueToDonePhase) {
      this.fuelPenaltyPercentage.set(null);
    }
  }
}

/**
 * Implementation of Fmgc interface.
 */
export class FmgcDataService implements Fmgc {
  public data = new FmgcData();
  private subs: Subscription[] = [];

  public guidanceController: GuidanceController | undefined = undefined;

  private readonly sub = this.bus.getSubscriber<FqmsBusEvents>();

  private readonly fqmsFob = Arinc429LocalVarConsumerSubject.create(this.sub.on('fqms_total_fuel_on_board'));
  private readonly fqmsGw = Arinc429LocalVarConsumerSubject.create(this.sub.on('fqms_gross_weight'));
  private readonly fqmsGwCg = Arinc429LocalVarConsumerSubject.create(this.sub.on('fqms_center_of_gravity_mac'));

  constructor(
    private readonly bus: EventBus,
    private flightPlanService: FlightPlanService,
  ) {
    this.subs.push(this.fqmsFob, this.fqmsGw, this.fqmsGwCg);
  }

  public destroy() {
    this.subs.forEach((s) => s.destroy());
  }

  /** in tons */
  getZeroFuelWeight(forPlan = FlightPlanIndex.Active): number {
    const zfw = this.flightPlanService.get(forPlan).performanceData.zeroFuelWeight.get() ?? minGw / 1_000;
    return zfw;
  }

  /** in tons */
  public getGrossWeight(forPlan = FlightPlanIndex.Active): number | null {
    // Value received from FQMS, or falls back to entered ZFW + entered FOB.
    // TODO how does this work for secondary plans?
    const fqmsGw = this.fqmsGw.get();
    if (fqmsGw.isNormalOperation()) {
      return fqmsGw.value / 1_000;
    }
    const zfw = this.flightPlanService.get(forPlan).performanceData.zeroFuelWeight.get();
    const fob = this.getFOB(forPlan);

    if (zfw == null || fob === null) {
      return null;
    }

    return zfw + fob;
  }

  /** in kilograms */
  public getGrossWeightKg(forPlan = FlightPlanIndex.Active): number | null {
    const gw = this.getGrossWeight(forPlan);
    return gw ? gw * 1_000 : null;
  }

  /**
   * The center of gravity is calculated by the FQMS.
   * If it is not available then the value computed by the WBBC is returned.
   * If neither the FQMS nor the WBBC provide any value then `null` is returned.
   *
   * @returns the gross weight center of gravity in %
   */
  public getGrossWeightCg(): number | null {
    // Value received from FQMS, or falls back to value from WBBC (TODO)
    return this.fqmsGwCg.get().valueOr(null);
  }

  /**
   *
   * @returns fuel on board in tonnes (i.e. 1000 x kg)
   */
  getFOB(forPlan = FlightPlanIndex.Active): number | null {
    const usefqms = this.isAnEngineOn();
    let fob: number | null = null;
    if (usefqms) {
      const fqmsFob = this.fqmsFob.get().valueOr(null);
      fob = fqmsFob !== null ? fqmsFob / 1000 : null;
    } else {
      fob = this.flightPlanService.get(forPlan).performanceData.blockFuel.get();
    }
    return fob;
  }

  /** in knots */
  getV2Speed(): number {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? this.flightPlanService.active.performanceData.v2.get() ?? 150
      : 150;
  }

  /** in feet */
  getTropoPause(): number {
    return this.flightPlanService.active.performanceData.tropopause.get();
  }

  /** in knots */
  getManagedClimbSpeed(forPlan = FlightPlanIndex.Active): number {
    const ci = this.flightPlanService.get(forPlan).performanceData.costIndex.get();
    if (ci !== null) {
      const dCI = (ci / 999) ** 2;
      return 290 * (1 - dCI) + 330 * dCI;
    }
    return 250;
  }

  /** in mach */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getManagedClimbSpeedMach(forPlan = FlightPlanIndex.Active): number {
    /* // Assume FL270 as crossover point
        const pressure = AeroMath.isaPressure(UnitType.METER.convertFrom(27_000, UnitType.FOOT));
        const mach = AeroMath.casToMach(UnitType.MPS.convertFrom(this.getManagedClimbSpeed(), UnitType.KNOT), pressure);
        return mach; */
    // Return static mach number for now, ECON speed calculation is not mature enough
    return 0.84;
  }

  /** in feet */
  getAccelerationAltitude(): number {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? (this.flightPlanService?.active.performanceData.accelerationAltitude.get() as Feet)
      : 1_500;
  }

  /** in feet */
  getThrustReductionAltitude(): number {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? (this.flightPlanService?.active.performanceData.thrustReductionAltitude.get() as Feet)
      : 1_500;
  }

  /** in feet. undefined if not set. */
  getOriginTransitionAltitude(): number | undefined {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? (this.flightPlanService?.active.performanceData.transitionAltitude.get() as Feet)
      : undefined;
  }

  /** in feet. undefined if not set. */
  getDestinationTransitionLevel(): number | undefined {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? (this.flightPlanService?.active.performanceData.transitionLevel.get() as Feet)
      : undefined;
  }

  getFlightPhase(): FmgcFlightPhase {
    return SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum');
  }

  /** in knots */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getManagedCruiseSpeed(forPlan = FlightPlanIndex.Active): number {
    return 310;
    // FIXME need to rework the cost index based speed calculations
    /* if (this.flightPlanService.has(FlightPlanIndex.Active)) {
      const dCI = ((this.flightPlanService.active.performanceData.costIndex.get() ?? 100) / 999) ** 2;
      return 290 * (1 - dCI) + 330 * dCI;
      */
  }

  /** in mach */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getManagedCruiseSpeedMach(forPlan = FlightPlanIndex.Active): number {
    /* const pressure = AeroMath.isaPressure(UnitType.METER.convertFrom(this.getCruiseAltitude() * 100, UnitType.FOOT));
        const mach = AeroMath.casToMach(UnitType.MPS.convertFrom(this.getManagedCruiseSpeed(), UnitType.KNOT), pressure);
        return mach; */
    // Return static mach number for now, ECON speed calculation is not mature enough
    return 0.85;
  }

  getClimbSpeedLimit(fpIndex = FlightPlanIndex.Active): SpeedLimit | null {
    if (!this.flightPlanService.has(fpIndex)) {
      return null;
    }
    const speedLimitSpeed = this.flightPlanService.get(fpIndex).performanceData.climbSpeedLimitSpeed.get();
    const speedLimitAltitude = this.flightPlanService.get(fpIndex).performanceData.climbSpeedLimitAltitude.get();
    if (speedLimitSpeed && speedLimitAltitude) {
      return {
        speed: speedLimitSpeed,
        underAltitude: speedLimitAltitude,
      };
    }
    return null;
  }

  getDescentSpeedLimit(fpIndex = FlightPlanIndex.Active): SpeedLimit | null {
    if (!this.flightPlanService.has(fpIndex)) {
      return null;
    }
    const speedLimitSpeed = this.flightPlanService.get(fpIndex).performanceData.descentSpeedLimitSpeed.get();
    const speedLimitAltitude = this.flightPlanService.get(fpIndex).performanceData.descentSpeedLimitAltitude.get();
    if (speedLimitSpeed && speedLimitAltitude) {
      return {
        speed: speedLimitSpeed,
        underAltitude: speedLimitAltitude,
      };
    }
    return null;
  }

  /** in knots */
  getPreSelectedClbSpeed(): number {
    // FIXME fmgc interface should also accept null
    return this.flightPlanService?.active.performanceData.preselectedClimbSpeed.get() ?? 0;
  }

  /** in knots */
  getPreSelectedCruiseSpeed(): number {
    // FIXME fmgc interface should also accept null
    return this.flightPlanService?.active.performanceData.preselectedCruiseSpeed.get() ?? 0;
  }

  getTakeoffFlapsSetting(): FlapConf | undefined {
    return this.flightPlanService.active.performanceData.takeoffFlaps.get();
  }

  /** in knots */
  getManagedDescentSpeed(forPlan = FlightPlanIndex.Active): number {
    const pd = this.flightPlanService.get(forPlan).performanceData;
    const preselectedDescentSpeed = pd.pilotManagedDescentSpeed.get();
    if (preselectedDescentSpeed !== null) {
      return preselectedDescentSpeed;
    }
    // TODO adapt for A380
    if (this.flightPlanService.has(forPlan)) {
      const ci = pd.costIndex.get();
      if (ci !== null) {
        const dCI = ci / 999;
        return Math.round(288 * (1 - dCI) + 300 * dCI);
      }
    }
    return 300;
  }

  /** in mach */
  getManagedDescentSpeedMach(forPlan = FlightPlanIndex.Active): number {
    /* // Assume FL270 as crossover point
        const pressure = AeroMath.isaPressure(UnitType.METER.convertFrom(27_000, UnitType.FOOT));
        const mach = AeroMath.casToMach(UnitType.MPS.convertFrom(this.getManagedClimbSpeed(), UnitType.KNOT), pressure);
        return mach; */
    // Return static mach number for now, ECON speed calculation is not mature enough
    return this.flightPlanService.get(forPlan).performanceData.pilotManagedDescentMach.get() ?? 0.84;
  }

  /** in knots */
  getApproachSpeed(): number {
    return this.data.approachVapp.get() ?? 0;
  }

  /** F speed in knots based on estimated landing weight, or 0 if it cannot be computed */
  getFlapRetractionSpeed(): number {
    return this.data.approachFlapRetractionSpeed.get() ?? 0;
  }

  /** S speed in knots based on estimated landing weight, or 0 if it cannot be computed */
  getSlatRetractionSpeed(): number {
    return this.data.approachSlatRetractionSpeed.get() ?? 0;
  }

  /** Green dot speed in knots based on estimated landing weight, or 0 if it cannot be computed */
  getCleanSpeed(): number {
    return this.data.approachGreenDotSpeed.get() ?? 0;
  }

  /** in knots */
  getTripWind(): number {
    return this.flightPlanService.active.performanceData.pilotTripWind.get() ?? 0;
  }

  /** in hPa */
  getApproachQnh(): number {
    return this.flightPlanService.active.performanceData.approachQnh.get() ?? 1013.25;
  }

  /** in degrees celsius */
  getApproachTemperature(): number {
    return this.flightPlanService.active.performanceData.approachTemperature.get() ?? 0;
  }

  /** in tons */
  getDestEFOB(useFob: boolean, forPlan = FlightPlanIndex.Active): number | null {
    // Metric tons
    if (forPlan === FlightPlanIndex.Active) {
      const efob = this.guidanceController?.vnavDriver?.getDestinationPrediction()?.estimatedFuelOnBoard; // in Pounds
      if (useFob && efob !== undefined) {
        return Units.poundToKilogram(efob) / 1000.0;
      }
    }
    return null;
  }

  /** in tons */
  getAltEFOB(forPlan = FlightPlanIndex.Active): number | null {
    // TODO estimate alternate fuel

    const destEfob = this.getDestEFOB(true, forPlan);
    const alternateFuel = this.flightPlanService.get(forPlan).performanceData.alternateFuel.get();

    if (destEfob === null || alternateFuel === null) {
      return null;
    }
    return Math.max(destEfob - alternateFuel, LOWEST_FUEL_ESTIMATE_KGS / 1000);
  }

  /** in feet. null if not set */
  getDepartureElevation(): number | null {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? this.flightPlanService?.active?.originRunway?.thresholdLocation?.alt
      : null;
  }

  /** in feet */
  getDestinationElevation(): number {
    return (
      this.flightPlanService?.active?.destinationRunway?.thresholdLocation?.alt ??
      this.flightPlanService?.active?.destinationAirport?.location?.alt ??
      0
    );
  }

  getDestinationRunway(): Runway | null {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? this.flightPlanService?.active?.destinationRunway
      : null;
  }

  /** in nautical miles. null if not set */
  getDistanceToDestination(): number | null {
    return this.guidanceController?.vnavDriver.getDestinationPrediction()?.distanceFromAircraft ?? null;
  }

  /** In percentage. Null if not set */
  getPerformanceFactorPercent(): number | null {
    return this.data.fuelPenaltyPercentage.get(); // TODO add performance factor when implemented
  }

  /**
   * Generic function which returns true if engine(index) is ON (N2 > 20)
   * @returns {boolean}
   */
  public isEngineOn(index: number): boolean {
    return SimVar.GetSimVarValue(`L:A32NX_ENGINE_N2:${index}`, 'number') > 20;
  }

  /**
   * Returns true if any one engine is running (N2 > 20)
   */
  public isAnEngineOn(): boolean {
    return this.isEngineOn(1) || this.isEngineOn(2) || this.isEngineOn(3) || this.isEngineOn(4);
  }

  /**
   * Returns true only if all engines are running (N2 > 20 for all engines)
   */
  isAllEngineOn(): boolean {
    return this.isEngineOn(1) && this.isEngineOn(2) && this.isEngineOn(3) && this.isEngineOn(4);
  }

  isOnGround() {
    return (
      SimVar.GetSimVarValue('L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED', 'Number') === 1 ||
      SimVar.GetSimVarValue('L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED', 'Number') === 1
    );
  }

  isFlying() {
    return this.getFlightPhase() >= FmgcFlightPhase.Takeoff && this.getFlightPhase() < FmgcFlightPhase.Done;
  }

  getPressureAltAtElevation(elev: number, qnh = 1013.2) {
    const p0 = qnh < 500 ? 29.92 : 1013.2;
    return elev + 145442.15 * (1 - (qnh / p0) ** 0.190263);
  }

  getPressureAlt() {
    for (let n = 1; n <= 3; n++) {
      const zp = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${n}_ALTITUDE`);
      if (zp.isNormalOperation()) {
        return zp.value;
      }
    }
    return null;
  }

  getBaroCorrection1(): number {
    // FIXME hook up to ADIRU or FCU
    return Simplane.getPressureValue('millibar') ?? 1013.25;
  }
}
