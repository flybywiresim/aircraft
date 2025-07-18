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
};

export type InternalKbdKeyEvent = {
  kbdKeyEvent: string;
};

export enum OitVars {
  coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
  elec = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
  elecFo = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
  potentiometerCaptain = 'LIGHT POTENTIOMETER:78',
  potentiometerFo = 'LIGHT POTENTIOMETER:79',
  oisDomainSwitchCapt = 'L:A380X_SWITCH_OIT_SIDE_LEFT',
  oisDomainSwitchFo = 'L:A380X_SWITCH_OIT_SIDE_RIGHT',
  nssAnsu1Healthy = 'L:A32NX_NSS_ANSU_1_IS_HEALTHY',
  nssAnsu2Healthy = 'L:A32NX_NSS_ANSU_2_IS_HEALTHY',
  fltOpsAnsu1Healthy = 'L:A32NX_FLTOPS_ANSU_1_IS_HEALTHY',
  laptopCaptHealthy = 'L:A32NX_FLTOPS_LAPTOP_1_IS_HEALTHY',
  laptopFoHealthy = 'L:A32NX_FLTOPS_LAPTOP_2_IS_HEALTHY',
  laptopCaptPowered = 'L:A380X_SWITCH_LAPTOP_POWER_LEFT',
  laptopFoPowered = 'L:A380X_SWITCH_LAPTOP_POWER_RIGHT',
}

/** A publisher to poll and publish nav/com simvars. */
export class OitSimvarPublisher extends SimVarPublisher<OitSimvars> {
  private static simvars = new Map<keyof OitSimvars, SimVarDefinition>([
    ['elec', { name: OitVars.elec, type: SimVarValueType.Bool }],
    ['elecFo', { name: OitVars.elecFo, type: SimVarValueType.Bool }],
    ['potentiometerCaptain', { name: OitVars.potentiometerCaptain, type: SimVarValueType.Number }],
    ['potentiometerFo', { name: OitVars.potentiometerFo, type: SimVarValueType.Number }],
    ['oisDomainSwitchCapt', { name: OitVars.oisDomainSwitchCapt, type: SimVarValueType.Bool }],
    ['oisDomainSwitchFo', { name: OitVars.oisDomainSwitchFo, type: SimVarValueType.Bool }],
    ['nssAnsu1Healthy', { name: OitVars.nssAnsu1Healthy, type: SimVarValueType.Bool }],
    ['nssAnsu2Healthy', { name: OitVars.nssAnsu2Healthy, type: SimVarValueType.Bool }],
    ['fltOpsAnsu1Healthy', { name: OitVars.fltOpsAnsu1Healthy, type: SimVarValueType.Bool }],
    ['laptopCaptHealthy', { name: OitVars.laptopCaptHealthy, type: SimVarValueType.Bool }],
    ['laptopFoHealthy', { name: OitVars.laptopFoHealthy, type: SimVarValueType.Bool }],
    ['laptopCaptPowered', { name: OitVars.laptopCaptPowered, type: SimVarValueType.Bool }],
    ['laptopFoPowered', { name: OitVars.laptopFoPowered, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(OitSimvarPublisher.simvars, bus);
  }
}
