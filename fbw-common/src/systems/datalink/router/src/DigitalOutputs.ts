//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, Publisher } from '@microsoft/msfs-sdk';
import { CpdlcMessage, DatalinkModeCode, DatalinkStatusCode, FreetextMessage } from '../../common/src';
import { RouterAtcAocMessages, RouterFmsMessages } from './databus';

export class DigitalOutputs {
  private publisher: Publisher<RouterAtcAocMessages & RouterFmsMessages>;

  constructor(
    private readonly bus: EventBus,
    private readonly synchronizedAtc: boolean,
    private readonly synchronizedAoc: boolean,
  ) {
    this.publisher = this.bus.getPublisher<RouterAtcAocMessages & RouterFmsMessages>();
  }

  public receivedFreetextMesage(message: FreetextMessage): void {
    this.publisher.pub('routerReceivedFreetextMessage', message, this.synchronizedAoc || this.synchronizedAtc, false);
  }

  public receivedCpdlcMessage(message: CpdlcMessage): void {
    this.publisher.pub('routerReceivedCpdlcMessage', message, this.synchronizedAtc, false);
  }

  public sendDatalinkStatus(status: {
    vhf: DatalinkStatusCode;
    satellite: DatalinkStatusCode;
    hf: DatalinkStatusCode;
  }): void {
    this.publisher.pub('routerDatalinkStatus', status, true, false);
  }

  public sendDatalinkMode(mode: { vhf: DatalinkModeCode; satellite: DatalinkModeCode; hf: DatalinkModeCode }): void {
    this.publisher.pub('routerDatalinkMode', mode, true, false);
  }
}
