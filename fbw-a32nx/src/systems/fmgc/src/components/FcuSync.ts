// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { LateralMode } from '@shared/autopilot';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { FmgcComponent } from './FmgcComponent';

// Note the logic for this is different on A330/350/380

export class FcuSync implements FmgcComponent {
  private trueRef = false;

  // eslint-disable-next-line no-empty-function
  init(): void {}

  update(_deltaTime: number): void {
    const irMaint = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_IR_1_MAINT_WORD');
    const trueRefPb = SimVar.GetSimVarValue('L:A32NX_PUSH_TRUE_REF', 'bool');

    const trueRef = (irMaint.bitValueOr(15, false) || trueRefPb) && !irMaint.bitValueOr(2, false);

    if (trueRef !== this.trueRef) {
      this.trueRef = trueRef;
      SimVar.SetSimVarValue('L:A32NX_FMGC_TRUE_REF', 'boolean', trueRef);
      const activeMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'number');
      if (activeMode === LateralMode.HDG || activeMode === LateralMode.TRACK) {
        SimVar.SetSimVarValue('L:A32NX_FM_HEADING_SYNC', 'boolean', true);
      }
    }
  }
}
