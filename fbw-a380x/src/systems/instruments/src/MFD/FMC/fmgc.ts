// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { Fmgc, GuidanceController } from '@fmgc/guidance/GuidanceController';

import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmcWindVector, FmcWinds } from '@fmgc/guidance/vnav/wind/types';
import { MappedSubject, Subject, Subscribable, SubscribableUtils } from '@microsoft/msfs-sdk';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { Arinc429Word, Runway, Units } from '@flybywiresim/fbw-sdk';
import { Feet } from 'msfs-geo';
import { AirlineModifiableInformation } from '@shared/AirlineModifiableInformation';
import { minGw } from '@shared/PerformanceConstants';

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

export enum ClimbDerated {
  NONE = 0,
  D01 = 1,
  D02 = 2,
  D03 = 3,
  D04 = 4,
  D05 = 5,
}

/**
 * Temporary place for data which is found nowhere else. Not associated to flight plans right now, which should be the case for some of these values
 */
export class FmgcData {
  static fmcFormatValue(sub: Subscribable<number | null>, numberDashes = 3) {
    return sub.map((it) => (it !== null ? it.toFixed(0) : '-'.repeat(numberDashes)));
  }

  public readonly cpnyFplnAvailable = Subject.create(false);

  public readonly cpnyFplnUplinkInProgress = Subject.create(false);

  public readonly atcCallsign = Subject.create<string | null>(null);

  /** in degrees celsius. null if not set. */
  public readonly cruiseTemperaturePilotEntry = Subject.create<number | null>(null);

  /** in degrees celsius. null if not set. */
  public readonly cruiseTemperatureIsaTemp = Subject.create<number | null>(null);

  /** in degrees celsius. null if not set. */
  public readonly cruiseTemperature = MappedSubject.create(
    ([isa, pe]) => (pe !== null ? pe : isa),
    this.cruiseTemperatureIsaTemp,
    this.cruiseTemperaturePilotEntry,
  );

  public readonly cruiseTemperatureIsPilotEntered = this.cruiseTemperaturePilotEntry.map((it) => it !== null);

  /** in knots. null if not set. */
  public readonly tripWind = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly zeroFuelWeight = Subject.create<number | null>(null);

  /** in percent. null if not set. */
  public readonly zeroFuelWeightCenterOfGravity = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly blockFuel = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly taxiFuelPilotEntry = Subject.create<number | null>(null);

  public readonly taxiFuelIsPilotEntered = this.taxiFuelPilotEntry.map((v) => v !== null);

  public readonly defaultTaxiFuel = Subject.create<number | null>(AirlineModifiableInformation.EK.taxiFuel);

  public readonly taxiFuel = MappedSubject.create(
    ([pilotEntryTaxiFuel, defaultTaxiFuel]) => (pilotEntryTaxiFuel !== null ? pilotEntryTaxiFuel : defaultTaxiFuel),
    this.taxiFuelPilotEntry,
    this.defaultTaxiFuel,
  );

  /** in kg. null if not set. */
  public readonly routeReserveFuelWeightPilotEntry = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly routeReserveFuelWeightCalculated = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly routeReserveFuelWeight = MappedSubject.create(
    ([calc, pe]) => (pe !== null ? pe : calc),
    this.routeReserveFuelWeightCalculated,
    this.routeReserveFuelWeightPilotEntry,
  );

  /** in percent. null if not set. */
  public readonly routeReserveFuelPercentagePilotEntry = Subject.create<number | null>(null);

  public readonly routeReserveFuelIsPilotEntered = this.routeReserveFuelWeightPilotEntry.map((it) => it !== null);

  public readonly routeReserveFuelPercentage = MappedSubject.create(
    ([percentagePilotEntry, reservePilotEntry]) =>
      reservePilotEntry !== null
        ? null
        : percentagePilotEntry === null
          ? AirlineModifiableInformation.EK.rteRsv
          : percentagePilotEntry,
    this.routeReserveFuelPercentagePilotEntry,
    this.routeReserveFuelWeightPilotEntry,
  );

  public readonly routeReserveFuelPercentageIsPilotEntered = this.routeReserveFuelPercentagePilotEntry.map(
    (v) => v !== null,
  );

  public readonly paxNumber = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly jettisonGrossWeight = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly alternateFuelPilotEntry = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly alternateFuelCalculated = Subject.create<number | null>(null);

  public readonly alternateFuel = MappedSubject.create(
    ([calc, pe]) => (pe !== null ? pe : calc),
    this.alternateFuelCalculated,
    this.alternateFuelPilotEntry,
  ); // in kg

  public readonly alternateFuelIsPilotEntered = this.alternateFuelPilotEntry.map((it) => it !== null);

  /** in kg. null if not set. */
  public readonly finalFuelWeightPilotEntry = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly finalFuelWeightCalculated = Subject.create<number | null>(null);

  public readonly finalFuelWeight = MappedSubject.create(
    ([calc, pe]) => (pe !== null ? pe : calc),
    this.finalFuelWeightCalculated,
    this.finalFuelWeightPilotEntry,
  );

  /** in minutes. null if not set. */
  public readonly finalFuelTimePilotEntry = Subject.create<number | null>(null);

  /** in minutes. */
  public readonly finalFuelTime = this.finalFuelTimePilotEntry.map((it) => (it === null ? 30 : it));

  public readonly finalFuelIsPilotEntered = MappedSubject.create(
    ([fuel, time]) => fuel !== null || time !== null,
    this.finalFuelWeightPilotEntry,
    this.finalFuelTimePilotEntry,
  );

  /** in kg. null if not set. */
  public readonly minimumFuelAtDestinationPilotEntry = Subject.create<number | null>(null);

  /** in kg. null if not set. */
  public readonly minimumFuelAtDestination = MappedSubject.create(
    ([pe, ff, af]) => (pe === null && ff && af ? ff + af : pe),
    this.minimumFuelAtDestinationPilotEntry,
    this.finalFuelWeight,
    this.alternateFuel,
  );

  public readonly minimumFuelAtDestinationIsPilotEntered = this.minimumFuelAtDestinationPilotEntry.map(
    (it) => it !== null,
  );

  /** in feet. null if not set. */
  public readonly tropopausePilotEntry = Subject.create<number | null>(null);

  /** in feet. null if not set. */
  public readonly tropopause = this.tropopausePilotEntry.map((tp) => tp ?? 36_090);

  public readonly tropopauseIsPilotEntered = this.tropopausePilotEntry.map((it) => it !== null);

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

  public readonly takeoffFlapsSetting = Subject.create<FlapConf>(FlapConf.CONF_1);

  public readonly flapRetractionSpeed = Subject.create<Knots | null>(null);

  public readonly slatRetractionSpeed = Subject.create<Knots | null>(null);

  public readonly greenDotSpeed = Subject.create<Knots | null>(null);

  public readonly approachSpeed = Subject.create<Knots | null>(null);

  public readonly approachWind = Subject.create<FmcWindVector | null>(null);

  public readonly approachQnh = Subject.create<number | null>(null);

  public readonly approachTemperature = Subject.create<number | null>(null);

  public readonly approachGreenDotSpeed = Subject.create<Knots | null>(null);

  public readonly approachSlatRetractionSpeed = Subject.create<Knots | null>(null);

  public readonly approachFlapRetractionSpeed = Subject.create<Knots | null>(null);

  /** in meters. null if not set. */
  public readonly takeoffShift = Subject.create<number | null>(null);

  public readonly takeoffPowerSetting = Subject.create<TakeoffPowerSetting>(TakeoffPowerSetting.TOGA);

  public readonly takeoffFlexTemp = Subject.create<number | null>(null);

  public readonly takeoffDeratedSetting = Subject.create<TakeoffDerated | null>(null);

  public readonly takeoffThsFor = Subject.create<number | null>(null);

  public readonly takeoffPacks = Subject.create<TakeoffPacks | null>(TakeoffPacks.ON);

  public readonly takeoffAntiIce = Subject.create<TakeoffAntiIce | null>(TakeoffAntiIce.OFF);

  public readonly noiseEnabled = Subject.create<boolean>(false);

  public readonly noiseN1 = Subject.create<number | null>(null);

  public readonly noiseSpeed = Subject.create<Knots | null>(null);

  /** in feet. null if not set. */
  public readonly noiseEndAltitude = Subject.create<number | null>(null);

  public readonly climbDerated = Subject.create<ClimbDerated | null>(ClimbDerated.NONE);

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

  public readonly climbPreSelSpeed = Subject.create<Knots | null>(null);

  public readonly climbSpeedLimit = Subject.create<SpeedLimit>({ speed: 250, underAltitude: 10_000 });

  public readonly cruisePreSelMach = Subject.create<number | null>(null);

  public readonly cruisePreSelSpeed = Subject.create<Knots | null>(null);

  public readonly descentPreSelSpeed = Subject.create<Knots | null>(null);

  public readonly descentSpeedLimit = Subject.create<SpeedLimit>({ speed: 250, underAltitude: 10_000 });

  /** in feet/min. null if not set. */
  public readonly descentCabinRate = Subject.create<number>(-350);

  /** in feet. null if not set. */
  public readonly approachBaroMinimum = Subject.create<number | null>(null);

  /** in feet. null if not set. */
  public readonly approachRadioMinimum = Subject.create<number | null>(null);

  public readonly approachVref = Subject.create<Knots | null>(null);

  public readonly approachFlapConfig = Subject.create<FlapConf>(FlapConf.CONF_FULL);

  public readonly approachVls = Subject.create<Knots | null>(null);

  /**
   * Estimated take-off time, in seconds. Displays as HH:mm:ss. Null if not set
   */
  public readonly estimatedTakeoffTime = Subject.create<number | null>(null);

  private static readonly DEFAULT_SETTINGS = new FmgcData();

  public reset(): void {
    for (const key in FmgcData.DEFAULT_SETTINGS) {
      const prop = key as keyof FmgcData;
      if (SubscribableUtils.isMutableSubscribable(this[prop])) {
        this[prop].set((FmgcData.DEFAULT_SETTINGS[prop] as Subscribable<any>).get());
      }
    }
  }
}

/**
 * Implementation of Fmgc interface. Not associated to flight plans right now, which should be the case for some of these values
 */
export class FmgcDataService implements Fmgc {
  public data = new FmgcData();

  public guidanceController: GuidanceController | undefined = undefined;

  constructor(private flightPlanService: FlightPlanService) {}

  /** in tons */
  getZeroFuelWeight(): number {
    const zfw = this.data.zeroFuelWeight.get() ?? minGw;
    return zfw / 1_000;
  }

  /** in tons */
  public getGrossWeight(): number | null {
    // Value received from FQMS, or falls back to entered ZFW + entered FOB
    const zfw = this.data.zeroFuelWeight.get();
    const fob = this.getFOB() * 1_000; // getFOB returns tons

    if (zfw == null || fob === undefined) {
      return null;
    }

    return (zfw + fob) / 1_000;
  }

  /** in kilograms */
  public getGrossWeightKg(): number | null {
    const gw = this.getGrossWeight();
    return gw ? gw * 1_000 : null;
  }

  /**
   *
   * @returns fuel on board in tonnes (i.e. 1000 x kg)
   */
  getFOB(): number {
    let fob = this.data.blockFuel.get() ?? 0;
    if (this.isAnEngineOn()) {
      fob =
        SimVar.GetSimVarValue('FUEL TOTAL QUANTITY', 'gallons') *
        SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'kilograms');
    }

    return fob / 1_000; // Needs to be returned in tonnes
  }

  /** in knots */
  getV2Speed(): number {
    return this.flightPlanService.has(FlightPlanIndex.Active) && this.flightPlanService.active.performanceData.v2
      ? this.flightPlanService.active.performanceData.v2
      : 150;
  }

  /** in feet */
  getTropoPause(): number {
    return this.data.tropopause.get();
  }

  /** in knots */
  getManagedClimbSpeed(): number {
    if (this.flightPlanService.has(FlightPlanIndex.Active)) {
      const dCI = ((this.flightPlanService.active.performanceData.costIndex ?? 100) / 999) ** 2;
      return 290 * (1 - dCI) + 330 * dCI;
    }
    return 250;
  }

  /** in mach */
  getManagedClimbSpeedMach(): number {
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
      ? (this.flightPlanService?.active.performanceData.accelerationAltitude as Feet)
      : 1_500;
  }

  /** in feet */
  getThrustReductionAltitude(): number {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? (this.flightPlanService?.active.performanceData.thrustReductionAltitude as Feet)
      : 1_500;
  }

  /** in feet. undefined if not set. */
  getOriginTransitionAltitude(): number | undefined {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? (this.flightPlanService?.active.performanceData.transitionAltitude as Feet)
      : undefined;
  }

  /** in feet. undefined if not set. */
  getDestinationTransitionLevel(): number | undefined {
    return this.flightPlanService.has(FlightPlanIndex.Active)
      ? (this.flightPlanService?.active.performanceData.transitionLevel as Feet)
      : undefined;
  }

  /**
   *
   * @returns flight level in steps of 100ft (e.g. 320 instead of 32000 for FL320)
   */
  getCruiseAltitude(): number {
    return this.flightPlanService.has(FlightPlanIndex.Active) &&
      this.flightPlanService?.active.performanceData.cruiseFlightLevel
      ? this.flightPlanService?.active.performanceData.cruiseFlightLevel
      : 320;
  }

  getFlightPhase(): FmgcFlightPhase {
    return SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum');
  }

  /** in knots */
  getManagedCruiseSpeed(): number {
    const preSel = this.data.cruisePreSelSpeed.get();
    if (Number.isFinite(preSel) && preSel !== null) {
      return preSel;
    }

    // FIXME need to rework the cost index based speed calculations
    /* if (this.flightPlanService.has(FlightPlanIndex.Active)) {
      const dCI = ((this.flightPlanService.active.performanceData.costIndex ?? 100) / 999) ** 2;
      return 290 * (1 - dCI) + 330 * dCI;
    }*/
    return 310;
  }

  /** in mach */
  getManagedCruiseSpeedMach(): number {
    /* const pressure = AeroMath.isaPressure(UnitType.METER.convertFrom(this.getCruiseAltitude() * 100, UnitType.FOOT));
        const mach = AeroMath.casToMach(UnitType.MPS.convertFrom(this.getManagedCruiseSpeed(), UnitType.KNOT), pressure);
        return mach; */
    // Return static mach number for now, ECON speed calculation is not mature enough
    return this.data.cruisePreSelMach.get() ?? 0.85;
  }

  getClimbSpeedLimit(): SpeedLimit {
    return { speed: 250, underAltitude: 10_000 };
  }

  getDescentSpeedLimit(): SpeedLimit {
    return { speed: 250, underAltitude: 10_000 };
  }

  /** in knots */
  getPreSelectedClbSpeed(): number {
    // FIXME fmgc interface should also accept null
    return this.data.climbPreSelSpeed.get() ?? 0;
  }

  /** in knots */
  getPreSelectedCruiseSpeed(): number {
    // FIXME fmgc interface should also accept null
    return this.data.cruisePreSelSpeed.get() ?? 0;
  }

  /** in knots */
  getPreSelectedDescentSpeed(): number {
    // FIXME fmgc interface should also accept null
    return this.data.descentPreSelSpeed.get() ?? 0;
  }

  getTakeoffFlapsSetting(): FlapConf | undefined {
    return this.data.takeoffFlapsSetting.get();
  }

  /** in knots */
  getManagedDescentSpeed(): number {
    if (Number.isFinite(this.data.descentPreSelSpeed.get())) {
      return this.data.descentPreSelSpeed.get() ?? 0;
    }
    // TODO adapt for A380
    if (this.flightPlanService.has(FlightPlanIndex.Active)) {
      const dCI = (this.flightPlanService.active.performanceData.costIndex ?? 100) / 999;
      return 288 * (1 - dCI) + 300 * dCI;
    }
    return 300;
  }

  /** in mach */
  getManagedDescentSpeedMach(): number {
    /* // Assume FL270 as crossover point
        const pressure = AeroMath.isaPressure(UnitType.METER.convertFrom(27_000, UnitType.FOOT));
        const mach = AeroMath.casToMach(UnitType.MPS.convertFrom(this.getManagedClimbSpeed(), UnitType.KNOT), pressure);
        return mach; */
    // Return static mach number for now, ECON speed calculation is not mature enough
    return 0.84;
  }

  /** in knots */
  getApproachSpeed(): number {
    return this.data.approachSpeed.get() ?? 0;
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
    return this.data.tripWind.get() ?? 0;
  }

  getWinds(): FmcWinds {
    return {
      climb: [{ direction: 0, speed: 0 }],
      cruise: [{ direction: 0, speed: 0 }],
      des: [{ direction: 0, speed: 0 }],
      alternate: null,
    };
  }

  getApproachWind(): FmcWindVector {
    return this.data.approachWind.get() ?? { direction: 0, speed: 0 };
  }

  /** in hPa */
  getApproachQnh(): number {
    return this.data.approachQnh.get() ?? 1013.15;
  }

  /** in degrees celsius */
  getApproachTemperature(): number {
    return this.data.approachTemperature.get() ?? 0;
  }

  /** in tons */
  getDestEFOB(): number {
    // Metric tons
    const efob = this.guidanceController?.vnavDriver?.getDestinationPrediction()?.estimatedFuelOnBoard; // in Pounds
    if (efob !== undefined) {
      return Units.poundToKilogram(efob) / 1000.0;
    }
    return 0;
  }

  /** in tons */
  getAltEFOB(): number {
    // TODO estimate alternate fuel
    if (this.getDestEFOB() === 0) {
      return 0;
    }
    return this.getDestEFOB() - 1.0 > 0 ? this.getDestEFOB() - 1.0 : 0;
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

  getNavDataDateRange(): string {
    return SimVar.GetGameVarValue('FLIGHT NAVDATA DATE RANGE', 'string');
  }

  /**
   * Generic function which returns true if engine(index) is ON (N2 > 20)
   * @returns {boolean}
   */
  public isEngineOn(index: number): boolean {
    return SimVar.GetSimVarValue(`L:A32NX_ENGINE_N2:${index}`, 'percent') > 20;
  }

  /**
   * Returns true if any one engine is running (N2 > 20)
   */
  public isAnEngineOn(): boolean {
    return this.isEngineOn(1) || this.isEngineOn(2) || this.isEngineOn(3) || this.isEngineOn(4);
  }

  /**
   * Returns true only if all engines are running (N2 > 20 for inner engines)
   */
  isAllEngineOn(): boolean {
    return this.isEngineOn(2) && this.isEngineOn(3);
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
