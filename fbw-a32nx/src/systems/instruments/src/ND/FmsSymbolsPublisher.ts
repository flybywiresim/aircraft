// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BasePublisher, EventBus } from '@microsoft/msfs-sdk';
import { EfisSide, NdSymbol, NdTraffic, GenericDataListenerRecvSync } from '@flybywiresim/fbw-sdk';

export interface FmsSymbolsData {
  symbols: NdSymbol[];
  traffic: NdTraffic[];
}

export class FmsSymbolsPublisher extends BasePublisher<FmsSymbolsData> {
  private readonly events = new GenericDataListenerRecvSync();

  constructor(bus: EventBus, side: EfisSide) {
    super(bus);

    this.events.on(`A32NX_EFIS_${side}_SYMBOLS`, (topic, data) => {
      this.publish('symbols', data);
    });

    this.events.on(`A32NX_TCAS_TRAFFIC`, (topic, data: NdTraffic[]) => {
      this.publish('traffic', data);
    });
  }
}
