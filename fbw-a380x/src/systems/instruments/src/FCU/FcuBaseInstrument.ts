//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FsBaseInstrument } from '@microsoft/msfs-sdk';
import { FcuFsInstrument } from './FcuFsInstrument';

/**
 * The FCU Instrument.
 */
export class FcuBaseInstrument extends FsBaseInstrument<FcuFsInstrument> {
  /** @inheritdoc */
  public get isInteractive(): boolean {
    return false;
  }

  /** @inheritdoc */
  public constructInstrument(): FcuFsInstrument {
    return new FcuFsInstrument(this);
  }

  /** @inheritdoc */
  get templateID(): string {
    return 'A380X_FCU';
  }

  /** @inheritdoc */
  public onPowerOn(): void {
    super.onPowerOn();

    this.fsInstrument.onPowerOn();
  }

  /** @inheritdoc */
  public onShutDown(): void {
    super.onShutDown();

    this.fsInstrument.onPowerOff();
  }
}

registerInstrument('a380x-fcu', FcuBaseInstrument);
