// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument } from '@microsoft/msfs-sdk';
import { TemporaryHax } from './TemporaryHax';

export class ModeManager extends TemporaryHax implements Instrument {
  constructor(private readonly bus: EventBus) {
      super(bus, document.getElementById('Mode')!);
      this.init();
      this.onUpdate();
  }

  init() {
      this.textHDG = this.getTextElement('HDG');
      this.textVS = this.getTextElement('VS');
      this.textTRK = this.getTextElement('TRK');
      this.textFPA = this.getTextElement('FPA');
      this.refresh(false, 0, true);
  }

  onUpdate() {
      if (SimVar.GetSimVarValue('L:A32NX_FCU_MODE_REVERSION_TRK_FPA_ACTIVE', 'Bool')) {
          SimVar.SetSimVarValue('L:A32NX_TRK_FPA_MODE_ACTIVE', 'Bool', 0);
      }
      const _isTRKFPADisplayMode = SimVar.GetSimVarValue('L:A32NX_TRK_FPA_MODE_ACTIVE', 'Bool');
      this.refresh(_isTRKFPADisplayMode, SimVar.GetSimVarValue('L:A32NX_OVHD_INTLT_ANN', 'number') == 0);
  }

  refresh(_isTRKFPADisplayMode, _lightsTest, _force = false) {
      if ((_isTRKFPADisplayMode != this.isTRKFPADisplayMode) || (_lightsTest !== this.lightsTest) || _force) {
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
          this.setTextElementActive(this.textTRK, this.isTRKFPADisplayMode);
          this.setTextElementActive(this.textFPA, this.isTRKFPADisplayMode);
      }
  }
}
