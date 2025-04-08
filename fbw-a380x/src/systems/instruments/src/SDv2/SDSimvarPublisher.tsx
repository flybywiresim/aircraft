// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import {
  AdirsSimVarDefinitions,
  AdirsSimVars,
  SwitchingPanelSimVarsDefinitions,
  SwitchingPanelVSimVars,
} from '../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type SDSimvars = AdirsSimVars &
  SwitchingPanelVSimVars & {
    zuluTime: number;
    /** A429 raw value */
    fm1ZeroFuelWeight: number;
    /** A429 raw value */
    fm1ZeroFuelWeightCg: number;
    /** A429 raw value */
    fm2ZeroFuelWeight: number;
    /** A429 raw value */
    fm2ZeroFuelWeightCg: number;
    fmGrossWeight: number;
    /** in gallons */
    grossWeightCg: number;
    fuelTotalQuantity: number;
    /** in pounds */
    fuelWeightPerGallon: number;
  };

/** A publisher to poll and publish nav/com simvars. */
export class SDSimvarPublisher extends UpdatableSimVarPublisher<SDSimvars> {
  private static simvars = new Map<keyof SDSimvars, SimVarDefinition>([
    ...AdirsSimVarDefinitions,
    ...SwitchingPanelSimVarsDefinitions,
    ['zuluTime', { name: 'E:ZULU TIME', type: SimVarValueType.Seconds }],
    ['fm1ZeroFuelWeight', { name: 'L:A32NX_FM1_ZERO_FUEL_WEIGHT', type: SimVarValueType.Number }],
    ['fm1ZeroFuelWeightCg', { name: 'L:A32NX_FM1_ZERO_FUEL_WEIGHT_CG', type: SimVarValueType.Number }],
    ['fm2ZeroFuelWeight', { name: 'L:A32NX_FM2_ZERO_FUEL_WEIGHT', type: SimVarValueType.Number }],
    ['fm2ZeroFuelWeightCg', { name: 'L:A32NX_FM2_ZERO_FUEL_WEIGHT_CG', type: SimVarValueType.Number }],
    ['fmGrossWeight', { name: 'L:A32NX_FM_GROSS_WEIGHT', type: SimVarValueType.Number }],
    ['grossWeightCg', { name: 'L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC', type: SimVarValueType.Number }],
    ['fuelTotalQuantity', { name: 'FUEL TOTAL QUANTITY', type: SimVarValueType.GAL }],
    ['fuelWeightPerGallon', { name: 'FUEL WEIGHT PER GALLON', type: SimVarValueType.Number }],
  ]);

  public constructor(bus: EventBus) {
    super(SDSimvarPublisher.simvars, bus);
  }
}
