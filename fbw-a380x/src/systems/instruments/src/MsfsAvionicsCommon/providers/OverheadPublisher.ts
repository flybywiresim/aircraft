// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

export enum AnnLightTestState {
  Test = 0,
  Bright = 1,
  Dim = 2,
}

export interface OverheadEvents {
  ovhd_ann_lt_test_switch: AnnLightTestState;
  ovhd_ann_lt_test_active: boolean;
}

export class OverheadPublisher extends SimVarPublisher<OverheadEvents> {
  constructor(bus: EventBus) {
    super(
      new Map<keyof OverheadEvents, SimVarPublisherEntry<any>>([
        ['ovhd_ann_lt_test_switch', { name: 'L:A32NX_OVHD_INTLT_ANN', type: SimVarValueType.Enum }],
        [
          'ovhd_ann_lt_test_active',
          { name: 'L:A32NX_OVHD_INTLT_ANN', type: SimVarValueType.Enum, map: (v) => v === AnnLightTestState.Test },
        ],
      ]),
      bus,
    );
  }
}
