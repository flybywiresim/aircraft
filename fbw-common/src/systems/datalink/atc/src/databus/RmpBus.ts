//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, EventSubscriber, Publisher, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

interface RmpSimvars {
    msfsTransponderCode: number,
}

enum RmpSimvarSources {
    transponderCode = 'TRANSPONDER CODE:1',
}

export class RmpSimvarPublisher extends SimVarPublisher<RmpSimvars> {
    private static simvars = new Map<keyof RmpSimvars, SimVarDefinition>([
        ['msfsTransponderCode', { name: RmpSimvarSources.transponderCode, type: SimVarValueType.Number }],
    ]);

    public constructor(bus: EventBus) {
        super(RmpSimvarPublisher.simvars, bus);
    }
}

export interface RmpDataBusTypes {
    transponderCode: number,
}

export class RmpInputBus {
    private simVarPublisher: RmpSimvarPublisher = null;

    private subscriber: EventSubscriber<RmpSimvars> = null;

    private publisher: Publisher<RmpDataBusTypes> = null;

    constructor(private readonly bus: EventBus) {
        this.simVarPublisher = new RmpSimvarPublisher(this.bus);
    }

    public initialize(): void {
        this.publisher = this.bus.getPublisher<RmpDataBusTypes>();
        this.subscriber = this.bus.getSubscriber<RmpSimvars>();

        this.subscriber.on('msfsTransponderCode').handle((code: number) => this.publisher.pub('transponderCode', code, false, false));
    }

    public connectedCallback(): void {
        this.simVarPublisher.subscribe('msfsTransponderCode');
    }

    public startPublish(): void {
        this.simVarPublisher.startPublish();
    }

    public update(): void {
        this.simVarPublisher.onUpdate();
    }
}
