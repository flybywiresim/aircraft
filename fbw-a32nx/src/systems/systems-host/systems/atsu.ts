// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Atc } from '@datalink/atc';
import { Aoc } from '@datalink/aoc';
import { SimVarHandling } from '@datalink/common';
import { Router, VhfRadioInterface } from '@datalink/router';
import { EventBus, EventSubscriber, Instrument, SimVarValueType } from '@microsoft/msfs-sdk';
import { PowerSupplyBusTypes } from 'systems-host/systems/powersupply';
import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';

class A32nxVhfProvider implements VhfRadioInterface {
  private readonly ComActiveFrequency3 = RegisteredSimVar.create<number>(
    'A:COM ACTIVE FREQUENCY:3',
    SimVarValueType.MHz,
  );

  isDataModeActive(): boolean {
    if (this.ComActiveFrequency3.get() === 0) {
      return true;
    }
    return false;
  }
}

export class AtsuSystem implements Instrument {
  private readonly simVarHandling: SimVarHandling;

  private readonly powerSupply: EventSubscriber<PowerSupplyBusTypes>;

  private readonly atc: Atc;

  private readonly aoc: Aoc;

  private readonly router: Router;

  constructor(private readonly bus: EventBus) {
    this.simVarHandling = new SimVarHandling(this.bus);
    this.router = new Router(this.bus, false, false, new A32nxVhfProvider());
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
