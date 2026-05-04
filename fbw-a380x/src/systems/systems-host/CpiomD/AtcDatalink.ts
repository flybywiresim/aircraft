//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Atc } from '@datalink/atc';
import { ConsumerSubject, EventBus } from '@microsoft/msfs-sdk';
import { CpiomData } from '@providers/CpiomPublisher';
export class AtcDatalink {
  private readonly available = ConsumerSubject.create(
    this.bus.getSubscriber<CpiomData>().on('cpiom_d_available_1'),
    false,
  );

  private readonly atc: Atc;
  constructor(private readonly bus: EventBus) {
    this.atc = new Atc(this.bus, false, false);
    this.available.sub((available: boolean) => {
      if (available) {
        this.atc.powerUp();
      } else {
        this.atc.powerDown();
      }
    }, true);
  }

  public init(): void {
    this.atc.initialize();
  }
}
