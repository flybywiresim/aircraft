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
};

export enum VdVars {
  activeLateralMode = 'L:A32NX_FMA_LATERAL_MODE',
  armedLateralMode = 'L:A32NX_FMA_LATERAL_ARMED',
  activeVerticalMode = 'L:A32NX_FMA_VERTICAL_MODE',
  altConstraint = 'L:A32NX_FG_ALTITUDE_CONSTRAINT',
  selectedVs = 'L:A32NX_AUTOPILOT_VS_SELECTED',
  selectedFpa = 'L:A32NX_AUTOPILOT_FPA_SELECTED',
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
  ]);

  public constructor(bus: EventBus) {
    super(VdSimvarPublisher.simvars, bus);
  }
}
