//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { Aoc } from '@datalink/aoc';
import { EventBus, EventSubscriber } from '@microsoft/msfs-sdk';
import { AtsuFmsClient } from './AtsuFmsClient';
import { PowerSupplyBusTypes } from '../Misc/powersupply';

export class AtsuSystem {
  //FIXME: This should be in NSS? Not CPIOM D.
  private readonly powerSupply: EventSubscriber<PowerSupplyBusTypes>;

  private readonly aoc: Aoc;

  private readonly atsuFmsClient: AtsuFmsClient;

  constructor(private readonly bus: EventBus) {
    this.aoc = new Aoc(this.bus, false);
    this.atsuFmsClient = new AtsuFmsClient(this.bus);

    this.powerSupply = this.bus.getSubscriber<PowerSupplyBusTypes>();
    this.powerSupply.on('acBus1').handle((powered: boolean) => {
      //FIXME: Should be NSS status
      if (powered) {
        this.aoc.powerUp();
      } else {
        this.aoc.powerDown();
      }
    });
  }

  public init(): void {
    this.aoc.initialize();
    this.atsuFmsClient.init();
  }
}
