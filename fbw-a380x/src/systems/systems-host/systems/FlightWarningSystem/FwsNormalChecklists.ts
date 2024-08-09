// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Subject } from '@microsoft/msfs-sdk';
import { FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';

export class FwsNormalChecklists {
  constructor(private fws: FwsCore) {
    this.showChecklist.sub((v) => this.pub.pub('fws_show_normal_procedures', v, true));
  }

  private readonly pub = this.fws.bus.getPublisher<FwsEwdEvents>();

  public readonly showChecklist = Subject.create(false);

  onUpdate() {
    if (this.fws.clPulseNode.read() === true) {
      this.showChecklist.set(!this.showChecklist.get());
    }
  }
}
