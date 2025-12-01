// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, IndexedEventType, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';
import {
  AdirsSimVarDefinitions,
  AdirsSimVars,
  SwitchingPanelSimVarsDefinitions,
  SwitchingPanelVSimVars,
} from '../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../MsfsAvionicsCommon/UpdatableSimVarPublisher';

// FIXME ideally migrate to singular publishers (split by source)
export type BaseSDSimvars = AdirsSimVars &
  SwitchingPanelVSimVars & {
    sdPageToShow: number;
    sdStsPageToShow: number;
    zuluTime: number;
    /** in gallons */
    grossWeightCg: number;
    fuelTotalQuantity: number;
    /** in pounds */
    fuelWeightPerGallon: number;
    cockpitCabinTemp: number;
    fwdCargoTemp: number;
    aftCargoTemp: number;
    condMainDeckTemp: number;
    condUpperDeckTemp: number;
    cabinAltitudeIsAuto: boolean;
    cabinVerticalSpeedIsAuto: boolean;
    pressDeltaPressure: boolean;
    manCabinAltitude: number;
    manCabinDeltaPressure: number;
    manCabinVerticalSpeed: number;
    pressCabinAltitude: number;
    pressCabinDeltaPressure: number;
    pressCabinVerticalSpeed: number;
    cpcsBxDiscreteWord: number;
    engineFuelUsed: number;
    engineFuelFlow: number;
  };

type IndexedTopics =
  | 'condMainDeckTemp'
  | 'condUpperDeckTemp'
  | 'cpcsBxDiscreteWord'
  | 'pressCabinAltitude'
  | 'pressCabinDeltaPressure'
  | 'pressCabinVerticalSpeed'
  | 'engineFuelUsed'
  | 'engineFuelFlow';
type SDIndexedEvents = {
  [P in keyof Pick<BaseSDSimvars, IndexedTopics> as IndexedEventType<P>]: BaseSDSimvars[P];
};

export interface SDSimvars extends BaseSDSimvars, SDIndexedEvents {}

/** A publisher to poll and publish nav/com simvars. */
export class SDSimvarPublisher extends UpdatableSimVarPublisher<SDSimvars> {
  private static simvars = new Map<keyof SDSimvars, SimVarPublisherEntry<any>>([
    ...AdirsSimVarDefinitions,
    ...SwitchingPanelSimVarsDefinitions,
    ['sdPageToShow', { name: 'L:A32NX_ECAM_SD_PAGE_TO_SHOW', type: SimVarValueType.Enum }],
    ['sdStsPageToShow', { name: 'L:A32NX_ECAM_SD_STS_PAGE_TO_SHOW', type: SimVarValueType.Enum }],
    ['zuluTime', { name: 'E:ZULU TIME', type: SimVarValueType.Seconds }],
    ['grossWeightCg', { name: 'L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC', type: SimVarValueType.Number }],
    ['fuelTotalQuantity', { name: 'L:A32NX_TOTAL_FUEL_VOLUME', type: SimVarValueType.GAL }],
    ['fuelWeightPerGallon', { name: 'FUEL WEIGHT PER GALLON', type: SimVarValueType.Number }],
    ['cockpitCabinTemp', { name: 'L:A32NX_COND_CKPT_TEMP', type: SimVarValueType.Number }],
    ['fwdCargoTemp', { name: 'L:A32NX_COND_CARGO_FWD_TEMP', type: SimVarValueType.Number }],
    ['aftCargoTemp', { name: 'L:A32NX_COND_CARGO_BULK_TEMP', type: SimVarValueType.Number }],
    ['condMainDeckTemp', { name: 'L:A32NX_COND_MAIN_DECK_#index#_TEMP', type: SimVarValueType.Number, indexed: true }],
    [
      'condUpperDeckTemp',
      { name: 'L:A32NX_COND_UPPER_DECK_#index#_TEMP', type: SimVarValueType.Number, indexed: true },
    ],
    ['cabinAltitudeIsAuto', { name: 'L:A32NX_OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO', type: SimVarValueType.Bool }],
    ['cabinVerticalSpeedIsAuto', { name: 'L:A32NX_OVHD_PRESS_MAN_VS_CTL_PB_IS_AUTO', type: SimVarValueType.Bool }],
    ['manCabinAltitude', { name: 'L:A32NX_PRESS_MAN_CABIN_ALTITUDE', type: SimVarValueType.Number }],
    ['manCabinDeltaPressure', { name: 'L:A32NX_PRESS_MAN_CABIN_DELTA_PRESSURE', type: SimVarValueType.Number }],
    ['manCabinVerticalSpeed', { name: 'L:A32NX_PRESS_MAN_CABIN_VS', type: SimVarValueType.Number }],
    [
      'pressCabinAltitude',
      { name: 'L:A32NX_PRESS_CABIN_ALTITUDE_B#index#', type: SimVarValueType.Number, indexed: true },
    ],
    [
      'pressCabinDeltaPressure',
      { name: 'L:A32NX_PRESS_CABIN_DELTA_PRESSURE_B#index#', type: SimVarValueType.Number, indexed: true },
    ],
    [
      'pressCabinVerticalSpeed',
      { name: 'L:A32NX_PRESS_CABIN_VS_B#index#', type: SimVarValueType.Number, indexed: true },
    ],
    [
      'cpcsBxDiscreteWord',
      { name: 'L:A32NX_COND_CPIOM_B#index#_CPCS_DISCRETE_WORD', type: SimVarValueType.Number, indexed: true },
    ],
    ['engineFuelUsed', { name: 'L:A32NX_FUEL_USED:#index#', type: SimVarValueType.Number, indexed: true }],
    ['engineFuelFlow', { name: 'L:A32NX_ENGINE_FF:#index#', type: SimVarValueType.Number, indexed: true }],
  ]);

  public constructor(bus: EventBus) {
    super(SDSimvarPublisher.simvars, bus);
  }
}
