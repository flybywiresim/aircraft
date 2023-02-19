//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtcAocRouterBus } from '@datalink/router';
import { EventBus } from 'msfssdk';
import { AocFmsBus } from './databus/FmsBus';
import { AocFwcBus } from './databus/FwcBus';

export class DigitalOutputs {
    public FwcBus: AocFwcBus = null;

    public FmsBus: AocFmsBus = null;

    public RouterBus: AtcAocRouterBus = null;

    constructor(private readonly bus: EventBus, synchronizedRouter: boolean) {
        this.FwcBus = new AocFwcBus();
        this.FmsBus = new AocFmsBus(this.bus);
        this.RouterBus = new AtcAocRouterBus(this.bus, synchronizedRouter);
    }
}
