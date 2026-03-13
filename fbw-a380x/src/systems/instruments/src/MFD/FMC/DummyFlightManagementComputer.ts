// Copyright (c) 2023-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { Subscribable, Subscription } from '@microsoft/msfs-sdk';
import { FmcIndex } from 'instruments/src/MFD/FMC/FmcServiceInterface';

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class DummyFlightManagementComputer {
  protected readonly subs = [] as Subscription[];

  // TODO change after tracers PR
  private readonly healythSimvar = RegisteredSimVar.createBoolean(
    `L:A32NX_FMC_${this.instance === FmcIndex.FmcA ? 'A' : this.instance === FmcIndex.FmcB ? 'B' : 'C'}_IS_HEALTHY`,
  );

  constructor(
    private instance: FmcIndex,
    private readonly fmcInop: Subscribable<boolean>,
  ) {
    this.subs.push(this.fmcInop.sub((value) => this.healythSimvar.set(!value), true));

    console.log(`Dummy ${FmcIndex[this.instance]} initialized.`);
  }

  destroy() {
    for (const s of this.subs) {
      s.destroy();
    }
  }
}
