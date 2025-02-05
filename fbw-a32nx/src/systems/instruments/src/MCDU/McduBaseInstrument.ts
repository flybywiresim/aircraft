//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FsBaseInstrument } from '@microsoft/msfs-sdk';
import { McduFsInstrument } from './McduFsInstrument';

/**
 * The MCDU Instrument.
 */
export class McduBaseInstrument extends FsBaseInstrument<McduFsInstrument> {
  /** @inheritdoc */
  public get isInteractive(): boolean {
    return true;
  }

  /** @inheritdoc */
  public constructInstrument(): McduFsInstrument {
    return new McduFsInstrument(this);
  }

  /** @inheritdoc */
  get templateID(): string {
    return 'A32NX_MCDU';
  }

  /** @inheritdoc */
  public onPowerOn(): void {
    super.onPowerOn();

    // TODO why fsInstrument undefined
    //this.fsInstrument.onPowerOn();
  }

  /** @inheritdoc */
  public onShutDown(): void {
    super.onShutDown();

    // TODO why fsInstrument undefined
    //this.fsInstrument.onPowerOff();
  }
}

registerInstrument('a32nx-mcdu', McduBaseInstrument);
