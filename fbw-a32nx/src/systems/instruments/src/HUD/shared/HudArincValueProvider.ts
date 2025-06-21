// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Instrument } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word } from '@flybywiresim/fbw-sdk';

import { HUDSimvars } from './HUDSimvarPublisher';

export interface HudArinc429Values {
  fcuAtsFmaDiscreteWord: Arinc429Word;
}
export class ArincValueProvider implements Instrument {
  constructor(private readonly bus: ArincEventBus) {}

  /** @inheritdoc */
  public init() {
    const publisher = this.bus.getPublisher<HudArinc429Values>();
    const subscriber = this.bus.getSubscriber<HUDSimvars>();

    subscriber.on('fcuAtsFmaDiscreteWordRaw').handle((word) => {
      publisher.pub('fcuAtsFmaDiscreteWord', new Arinc429Word(word));
    });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
