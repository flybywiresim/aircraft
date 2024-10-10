// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

// FIXME port to MSFS avionics framework style
export class ModeManager extends TemporaryHax implements Instrument {
  private textHDG?: ReturnType<typeof this.getTextElement>;
  private textVS?: ReturnType<typeof this.getTextElement>;
  private textTRK?: ReturnType<typeof this.getTextElement>;
  private textFPA?: ReturnType<typeof this.getTextElement>;

  private isTRKFPADisplayMode?: number | boolean;
  private lightsTest?: number | boolean;

  constructor(private readonly bus: EventBus) {
    super(bus, document.getElementById('Mode')!);
    this.init();
    this.onUpdate();
  }

  public init(): void {
    this.textHDG = this.getTextElement('HDG');
    this.textVS = this.getTextElement('VS');
    this.textTRK = this.getTextElement('TRK');
    this.textFPA = this.getTextElement('FPA');
    this.refresh(false, 0, true);
  }

  public onUpdate(): void {
    if (SimVar.GetSimVarValue('L:A32NX_FCU_MODE_REVERSION_TRK_FPA_ACTIVE', 'Bool')) {
      SimVar.SetSimVarValue('L:A32NX_TRK_FPA_MODE_ACTIVE', 'Bool', 0);
    }
    const _isTRKFPADisplayMode = SimVar.GetSimVarValue('L:A32NX_TRK_FPA_MODE_ACTIVE', 'Bool');
    this.refresh(_isTRKFPADisplayMode, SimVar.GetSimVarValue('L:A32NX_OVHD_INTLT_ANN', 'number') == 0);
  }

  private refresh(_isTRKFPADisplayMode: number | boolean, _lightsTest: number | boolean, _force = false): void {
    if (_isTRKFPADisplayMode != this.isTRKFPADisplayMode || _lightsTest !== this.lightsTest || _force) {
      this.isTRKFPADisplayMode = _isTRKFPADisplayMode;
      this.lightsTest = _lightsTest;
      if (this.lightsTest) {
        this.setTextElementActive(this.textHDG, true);
        this.setTextElementActive(this.textVS, true);
        this.setTextElementActive(this.textTRK, true);
        this.setTextElementActive(this.textFPA, true);
        return;
      }
      this.setTextElementActive(this.textHDG, !this.isTRKFPADisplayMode);
      this.setTextElementActive(this.textVS, !this.isTRKFPADisplayMode);
      this.setTextElementActive(this.textTRK, !!this.isTRKFPADisplayMode);
      this.setTextElementActive(this.textFPA, !!this.isTRKFPADisplayMode);
    }
  }
}
