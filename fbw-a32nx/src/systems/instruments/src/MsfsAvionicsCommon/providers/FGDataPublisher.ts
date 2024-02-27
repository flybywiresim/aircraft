// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { LateralMode } from '@shared/autopilot';

export interface FGVars {
  'fg.fma.lateralMode': LateralMode;
  'fg.fma.lateralArmedBitmask': number;
}

export class FGDataPublisher extends SimVarPublisher<FGVars> {
  constructor(bus: EventBus) {
    super(
      new Map([
        ['fg.fma.lateralMode', { name: 'L:A32NX_FMA_LATERAL_MODE', type: SimVarValueType.Number }],
        ['fg.fma.lateralArmedBitmask', { name: 'L:A32NX_FMA_LATERAL_ARMED', type: SimVarValueType.Number }],
      ]),
      bus,
    );
  }
}
