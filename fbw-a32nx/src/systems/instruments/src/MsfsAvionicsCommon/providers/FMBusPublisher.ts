// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export interface FMBusEvents {
  'fm.1.healthy_discrete': boolean;

  'fm.2.healthy_discrete': boolean;

  'fm.1.tuning_discrete_word': number;

  'fm.2.tuning_discrete_word': number;

  // FIXME get the backbeam state from the FG when implemented
  /** Whether FM1 localiser course is a backbeam. */
  'fm.1.backbeam': boolean;
  /** Whether FM2 localiser course is a backbeam. */
  'fm.2.backbeam': boolean;
}

export class FMBusPublisher extends SimVarPublisher<FMBusEvents> {
  constructor(bus: EventBus) {
    super(
      new Map([
        ['fm.1.healthy_discrete', { name: 'L:A32NX_FM1_HEALTHY_DISCRETE', type: SimVarValueType.Bool }],
        ['fm.2.healthy_discrete', { name: 'L:A32NX_FM2_HEALTHY_DISCRETE', type: SimVarValueType.Bool }],
        ['fm.1.tuning_discrete_word', { name: 'L:A32NX_FM1_NAV_DISCRETE', type: SimVarValueType.Number }],
        ['fm.2.tuning_discrete_word', { name: 'L:A32NX_FM2_NAV_DISCRETE', type: SimVarValueType.Number }],
        ['fm.1.backbeam', { name: 'L:A32NX_FM1_BACKBEAM_SELECTED', type: SimVarValueType.Bool }],
        ['fm.2.backbeam', { name: 'L:A32NX_FM2_BACKBEAM_SELECTED', type: SimVarValueType.Bool }],
      ]),
      bus,
    );
  }
}
