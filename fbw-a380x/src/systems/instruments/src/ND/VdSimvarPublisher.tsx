// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { UpdatableSimVarPublisher } from '../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type VdSimvars = {
  activeLateralMode: number;
  armedLateralMode: number;
  activeVerticalMode: number;
  altConstraint: number;
  selectedVs: number;
  selectedFpa: number;
  terrSysOff: boolean;
  activeOverlayCapt: number;
  activeOverlayFO: number;
  wxrTawsSysSelected: number;
  terr1Failed: boolean;
  terr2Failed: boolean;
  wxr1Failed: boolean;
  wxr2Failed: boolean;
};

export enum VdVars {
  activeLateralMode = 'L:A32NX_FMA_LATERAL_MODE',
  armedLateralMode = 'L:A32NX_FMA_LATERAL_ARMED',
  activeVerticalMode = 'L:A32NX_FMA_VERTICAL_MODE',
  altConstraint = 'L:A32NX_FG_ALTITUDE_CONSTRAINT',
  selectedVs = 'L:A32NX_AUTOPILOT_VS_SELECTED',
  selectedFpa = 'L:A32NX_AUTOPILOT_FPA_SELECTED',
  terrSysOff = 'L:A32NX_GPWS_TERR_OFF',
  activeOverlayCapt = 'L:A380X_EFIS_L_ACTIVE_OVERLAY',
  activeOverlayFO = 'L:A380X_EFIS_R_ACTIVE_OVERLAY',
  wxrTawsSysSelected = 'L:A32NX_WXR_TAWS_SYS_SELECTED',
  terr1Failed = 'L:A32NS_TERR_1_FAILED',
  terr2Failed = 'L:A32NS_TERR_2_FAILED',
  wxr1Failed = 'L:A32NS_WXR_1_FAILED',
  wxr2Failed = 'L:A32NS_WXR_2_FAILED',
}

/** A publisher to poll and publish nav/com simvars. */
export class VdSimvarPublisher extends UpdatableSimVarPublisher<VdSimvars> {
  private static simvars = new Map<keyof VdSimvars, SimVarDefinition>([
    ['activeLateralMode', { name: VdVars.activeLateralMode, type: SimVarValueType.Number }],
    ['armedLateralMode', { name: VdVars.armedLateralMode, type: SimVarValueType.Number }],
    ['activeVerticalMode', { name: VdVars.activeVerticalMode, type: SimVarValueType.Number }],
    ['altConstraint', { name: VdVars.altConstraint, type: SimVarValueType.Number }],
    ['selectedVs', { name: VdVars.selectedVs, type: SimVarValueType.Number }],
    ['selectedFpa', { name: VdVars.selectedFpa, type: SimVarValueType.Number }],
    ['terrSysOff', { name: VdVars.terrSysOff, type: SimVarValueType.Bool }],
    ['activeOverlayCapt', { name: VdVars.activeOverlayCapt, type: SimVarValueType.Number }],
    ['activeOverlayFO', { name: VdVars.activeOverlayFO, type: SimVarValueType.Number }],
    ['wxrTawsSysSelected', { name: VdVars.wxrTawsSysSelected, type: SimVarValueType.Number }],
    ['terr1Failed', { name: VdVars.terr1Failed, type: SimVarValueType.Bool }],
    ['terr2Failed', { name: VdVars.terr2Failed, type: SimVarValueType.Bool }],
    ['wxr1Failed', { name: VdVars.wxr1Failed, type: SimVarValueType.Bool }],
    ['wxr2Failed', { name: VdVars.wxr2Failed, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(VdSimvarPublisher.simvars, bus);
  }
}
