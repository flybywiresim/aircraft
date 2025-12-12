// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClimbDerated,
  CostIndexMode,
  FlightPlanPerformanceData,
  SerializedFlightPlanPerformanceData,
  TakeoffAntiIce,
  TakeoffDerated,
  TakeoffPacks,
  TakeoffPowerSetting,
} from './FlightPlanPerformanceData';
import { A320FlightPlanPerformanceData } from './A320FlightPlanPerformanceData';
import { MappedSubject, Subject } from '@microsoft/msfs-sdk';

// TODO this should go to fbw-a380x/ once FMS is moved to fbw-common
/** Uses A320FlightPlanPerformanceData and a basis and only extends attributes as necessary. */
export class A380FlightPlanPerformanceData extends A320FlightPlanPerformanceData implements FlightPlanPerformanceData {
  public clone(): this {
    const cloned = new A380FlightPlanPerformanceData();

    this.assignFieldsFromOriginal(cloned);

    return cloned as this;
  }

  protected assignFieldsFromOriginal(cloned: FlightPlanPerformanceData): FlightPlanPerformanceData {
    super.assignFieldsFromOriginal(cloned);
    cloned.cruiseTemperatureIsaTemp?.set(this.cruiseTemperatureIsaTemp.get());
    cloned.paxNumber?.set(this.paxNumber.get());
    cloned.jettisonGrossWeight?.set(this.jettisonGrossWeight.get());
    cloned.alternateExists?.set(this.alternateExists.get());
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

  readonly cruiseTemperatureIsaTemp = Subject.create<number | null>(null);

  readonly cruiseTemperature = MappedSubject.create(
    ([isa, pe]) => (pe !== null ? pe : isa),
    this.cruiseTemperatureIsaTemp,
    this.cruiseTemperaturePilotEntry,
  );

  readonly paxNumber = Subject.create<number | null>(null);

  readonly jettisonGrossWeight = Subject.create<number | null>(null);

  readonly alternateExists = Subject.create(false);

  readonly defaultAlternateFuel = this.alternateExists.map((v) => (v ? 6.5 : null)); // FIXME Hardcoded value. Derive from FMS predictions.

  readonly alternateFuel = MappedSubject.create(
    ([calc, pe]) => (pe !== null ? pe : calc),
    this.defaultAlternateFuel,
    this.pilotAlternateFuel,
  );

  public readonly minimumFuelAtDestination = MappedSubject.create(
    ([pe, ff, af]) => (pe === null && ff && af ? ff + af : pe),
    this.pilotMinimumDestinationFuelOnBoard,
    this.pilotFinalHoldingFuel,
    this.alternateFuel,
  );

  readonly takeoffPowerSetting = Subject.create<TakeoffPowerSetting>(TakeoffPowerSetting.TOGA);

  readonly takeoffDeratedSetting = Subject.create<TakeoffDerated>(TakeoffDerated.D01);

  readonly takeoffThsFor = Subject.create<number | null>(null);
  readonly takeoffPacks = Subject.create<TakeoffPacks | null>(TakeoffPacks.ON);

  readonly takeoffAntiIce = Subject.create<TakeoffAntiIce | null>(TakeoffAntiIce.OFF);

  readonly noiseEnabled = Subject.create<boolean>(false);

  readonly noiseN1 = Subject.create<number | null>(null);

  readonly noiseSpeed = Subject.create<Knots | null>(null);

  readonly noiseEndAltitude = Subject.create<number | null>(null);

  readonly costIndexMode = Subject.create<CostIndexMode>(CostIndexMode.ECON);

  readonly climbDerated = Subject.create<ClimbDerated>(ClimbDerated.NONE);

  readonly descentCabinRate = Subject.create<number>(-350);

  pipeTo(other: A380FlightPlanPerformanceData, isBeforeEngineStart: boolean): void {
    super.pipeTo(other, isBeforeEngineStart);

    other.pipe('cruiseTemperatureIsaTemp', this.cruiseTemperatureIsaTemp, other.cruiseTemperatureIsaTemp);
    other.pipe('paxNumber', this.paxNumber, other.paxNumber);
  }

  serialize(): SerializedFlightPlanPerformanceData {
    const superData = super.serialize();
    return {
      ...superData,
      cruiseTemperatureIsaTemp: this.cruiseTemperatureIsaTemp.get(),
      paxNumber: this.paxNumber.get(),
      jettisonGrossWeight: this.jettisonGrossWeight.get(),
      alternateExists: this.alternateExists.get(),
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
    };
  }
}
