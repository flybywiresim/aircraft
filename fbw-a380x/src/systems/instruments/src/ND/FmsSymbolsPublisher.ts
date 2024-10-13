// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BasePublisher, EventBus } from '@microsoft/msfs-sdk';
import { EfisSide, NdSymbol, NdTraffic, GenericDataListenerSync } from '@flybywiresim/fbw-sdk';

import { PathVector } from '@fmgc/guidance/lnav/PathVector';

export interface FmsSymbolsData {
  symbols: NdSymbol[];
  vectorsActive: PathVector[];
  vectorsDashed: PathVector[];
  vectorsTemporary: PathVector[];
  vectorsMissed: PathVector[];
  vectorsAlternate: PathVector[];
  vectorsSecondary: PathVector[];
  traffic: NdTraffic[];
}

export class FmsSymbolsPublisher extends BasePublisher<FmsSymbolsData> {
  private readonly events: GenericDataListenerSync[] = [];

  constructor(bus: EventBus, side: EfisSide) {
    super(bus);

    this.events.push(
      new GenericDataListenerSync((ev, data) => {
        this.publish('symbols', data);
      }, `A32NX_EFIS_${side}_SYMBOLS`),
    );

    this.events.push(
      new GenericDataListenerSync((ev, data: PathVector[]) => {
        this.publish('vectorsActive', data);
      }, `A32NX_EFIS_VECTORS_${side}_ACTIVE`),
    );

    this.events.push(
      new GenericDataListenerSync((ev, data: PathVector[]) => {
        this.publish('vectorsDashed', data);
      }, `A32NX_EFIS_VECTORS_${side}_DASHED`),
    );

    this.events.push(
      new GenericDataListenerSync((ev, data: PathVector[]) => {
        this.publish('vectorsTemporary', data);
      }, `A32NX_EFIS_VECTORS_${side}_TEMPORARY`),
    );

    this.events.push(
      new GenericDataListenerSync((ev, data: PathVector[]) => {
        this.publish('vectorsMissed', data);
      }, `A32NX_EFIS_VECTORS_${side}_MISSED`),
    );

    this.events.push(
      new GenericDataListenerSync((ev, data: PathVector[]) => {
        this.publish('vectorsAlternate', data);
      }, `A32NX_EFIS_VECTORS_${side}_ALTERNATE`),
    );

    this.events.push(
      new GenericDataListenerSync((ev, data: PathVector[]) => {
        this.publish('vectorsSecondary', data);
      }, `A32NX_EFIS_VECTORS_${side}_SECONDARY`),
    );

    this.events.push(
      new GenericDataListenerSync((ev, data: NdTraffic[]) => {
        this.publish('traffic', data);
      }, `A32NX_TCAS_${side}_TRAFFIC`),
    );
  }
}
