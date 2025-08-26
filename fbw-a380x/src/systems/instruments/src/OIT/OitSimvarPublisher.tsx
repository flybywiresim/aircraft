//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export type OitSimvars = {
  coldDark: number;
  elec: boolean;
  elecFo: boolean;
  potentiometerCaptain: number;
  potentiometerFo: number;
  oisDomainSwitchCapt: boolean;
  oisDomainSwitchFo: boolean;
  nssAnsu1Healthy: boolean;
  nssAnsu2Healthy: boolean;
  fltOpsAnsu1Healthy: boolean;
  laptopCaptHealthy: boolean;
  laptopFoHealthy: boolean;
  laptopCaptPowered: boolean;
  laptopFoPowered: boolean;
  nssMasterOff: boolean;
  nssDataToAvncsOff: boolean;
  parkBrakeSet: boolean;
  cabinDoorOpen: number;
  fuelTotalQuantity: number;
  /** in pounds */
  fuelWeightPerGallon: number;
  hydGreenPressurized: boolean;
  hydYellowPressurized: boolean;
};

export type InternalKbdKeyEvent = {
  kbdKeyEvent: string;
};

/** A publisher to poll and publish nav/com simvars. */
export class OitSimvarPublisher extends SimVarPublisher<OitSimvars> {
  private static simvars = new Map<keyof OitSimvars, SimVarDefinition>([
    ['coldDark', { name: 'L:A32NX_COLD_AND_DARK_SPAWN', type: SimVarValueType.Number }],
    ['elec', { name: 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED', type: SimVarValueType.Bool }],
    ['elecFo', { name: 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED', type: SimVarValueType.Bool }],
    ['potentiometerCaptain', { name: 'LIGHT POTENTIOMETER:78', type: SimVarValueType.Number }],
    ['potentiometerFo', { name: 'LIGHT POTENTIOMETER:79', type: SimVarValueType.Number }],
    ['oisDomainSwitchCapt', { name: 'L:A380X_SWITCH_OIT_SIDE_LEFT', type: SimVarValueType.Bool }],
    ['oisDomainSwitchFo', { name: 'L:A380X_SWITCH_OIT_SIDE_RIGHT', type: SimVarValueType.Bool }],
    ['nssAnsu1Healthy', { name: 'L:A32NX_NSS_ANSU_1_IS_HEALTHY', type: SimVarValueType.Bool }],
    ['nssAnsu2Healthy', { name: 'L:A32NX_NSS_ANSU_2_IS_HEALTHY', type: SimVarValueType.Bool }],
    ['fltOpsAnsu1Healthy', { name: 'L:A32NX_FLTOPS_ANSU_1_IS_HEALTHY', type: SimVarValueType.Bool }],
    ['laptopCaptHealthy', { name: 'L:A32NX_FLTOPS_LAPTOP_1_IS_HEALTHY', type: SimVarValueType.Bool }],
    ['laptopFoHealthy', { name: 'L:A32NX_FLTOPS_LAPTOP_2_IS_HEALTHY', type: SimVarValueType.Bool }],
    ['laptopCaptPowered', { name: 'L:A380X_SWITCH_LAPTOP_POWER_LEFT', type: SimVarValueType.Bool }],
    ['laptopFoPowered', { name: 'L:A380X_SWITCH_LAPTOP_POWER_RIGHT', type: SimVarValueType.Bool }],
    ['nssMasterOff', { name: 'L:A32NX_NSS_MASTER_OFF', type: SimVarValueType.Bool }],
    ['nssDataToAvncsOff', { name: 'L:A32NX_OVHD_NSS_DATA_TO_AVNCS_TOGGLE', type: SimVarValueType.Bool }],
    ['parkBrakeSet', { name: 'L:A32NX_PARK_BRAKE_LEVER_POS', type: SimVarValueType.Bool }],
    ['cabinDoorOpen', { name: 'INTERACTIVE POINT OPEN:0', type: SimVarValueType.PercentOver100 }],
    ['fuelTotalQuantity', { name: 'L:A32NX_TOTAL_FUEL_VOLUME', type: SimVarValueType.GAL }],
    ['fuelWeightPerGallon', { name: 'FUEL WEIGHT PER GALLON', type: SimVarValueType.Number }],
    ['hydGreenPressurized', { name: 'L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH', type: SimVarValueType.Bool }],
    [
      'hydYellowPressurized',
      { name: 'L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH', type: SimVarValueType.Bool },
    ],
  ]);

  public constructor(bus: EventBus) {
    super(OitSimvarPublisher.simvars, bus);
  }
}
