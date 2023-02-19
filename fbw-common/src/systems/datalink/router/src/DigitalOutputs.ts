//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { CpdlcMessage, FreetextMessage } from '@datalink/common';
import { EventBus, Publisher } from 'msfssdk';
import { RouterAtcAocMessages, RouterFmsBus } from './databus';

export class DigitalOutputs {
    private publisher: Publisher<RouterAtcAocMessages>;

    public FmsBus: RouterFmsBus = null;

    constructor(
        private readonly bus: EventBus,
        private readonly synchronizedAtc: boolean,
        private readonly synchronizedAoc: boolean,
    ) {
        this.publisher = this.bus.getPublisher<RouterAtcAocMessages>();
        this.FmsBus = new RouterFmsBus(this.bus);
    }

    public receivedFreetextMesage(message: FreetextMessage): void {
        this.publisher.pub('routerReceivedFreetextMessage', message, this.synchronizedAoc || this.synchronizedAtc, false);
    }

    public receivedCpdlcMessage(message: CpdlcMessage): void {
        this.publisher.pub('routerReceivedCpdlcMessage', message, this.synchronizedAtc, false);
    }
}
