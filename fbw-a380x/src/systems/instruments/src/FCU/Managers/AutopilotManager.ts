// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

// FIXME port to MSFS avionics framework style
export class AutopilotManager extends TemporaryHax implements Instrument {
  constructor(private readonly bus: EventBus) {
    super(bus, document.getElementById('Autopilot')!);
    this.init();
    this.onUpdate();
  }

  public init(): void {}

  protected override onEvent(_event: string): void {
    if (_event === 'AP_1_PUSH') {
      SimVar.SetSimVarValue('K:A32NX.FCU_AP_1_PUSH', 'number', 0);
    } else if (_event === 'AP_2_PUSH') {
      SimVar.SetSimVarValue('K:A32NX.FCU_AP_2_PUSH', 'number', 0);
    } else if (_event === 'LOC_PUSH') {
      SimVar.SetSimVarValue('K:A32NX.FCU_LOC_PUSH', 'number', 0);
    } else if (_event === 'APPR_PUSH') {
      SimVar.SetSimVarValue('K:A32NX.FCU_APPR_PUSH', 'number', 0);
    } else if (_event === 'EXPED_PUSH') {
      SimVar.SetSimVarValue('K:A32NX.FCU_EXPED_PUSH', 'number', 0);
    } else if (_event === 'TRUEMAG_PUSH') {
      SimVar.SetSimVarValue('L:A32NX_PUSH_TRUE_REF', 'bool', !SimVar.GetSimVarValue('L:A32NX_PUSH_TRUE_REF', 'bool'));
    }
  }

  public onUpdate(): void {}
}
