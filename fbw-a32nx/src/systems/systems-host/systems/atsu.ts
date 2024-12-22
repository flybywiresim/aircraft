// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Atc } from '@datalink/atc';
import { Aoc } from '@datalink/aoc';
import { SimVarHandling } from '@datalink/common';
import { Router } from '@datalink/router';
import { EventBus, EventSubscriber, Instrument } from '@microsoft/msfs-sdk';
import { PowerSupplyBusTypes } from 'systems-host/systems/powersupply';

export class AtsuSystem implements Instrument {
  private readonly simVarHandling: SimVarHandling;

  private readonly powerSupply: EventSubscriber<PowerSupplyBusTypes>;

  private readonly atc: Atc;

  private readonly aoc: Aoc;

  private readonly router: Router;

  constructor(private readonly bus: EventBus) {
    this.simVarHandling = new SimVarHandling(this.bus);
    this.router = new Router(this.bus, false, false);
    this.atc = new Atc(this.bus, false, false);
    this.aoc = new Aoc(this.bus, false);

    this.powerSupply = this.bus.getSubscriber<PowerSupplyBusTypes>();
    this.powerSupply.on('acBus1').handle((powered: boolean) => {
      if (powered) {
        this.router.powerUp();
        this.atc.powerUp();
        this.aoc.powerUp();
      } else {
        this.aoc.powerDown();
        this.atc.powerDown();
        this.router.powerDown();
      }
    });
  }

  public init(): void {
    this.simVarHandling.initialize();
    this.simVarHandling.startPublish();
    this.router.initialize();
    this.atc.initialize();
    this.aoc.initialize();
  }

  public onUpdate(): void {
    this.simVarHandling.update();
    this.router.update();
  }
}
