// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BasePublisher, EventBus } from '@microsoft/msfs-sdk';
import { EfisSide, GenericDataListenerSync } from '@flybywiresim/fbw-sdk';

export interface OansControlEvents {
    ndShowOans: boolean,
    ndSetOrigin: string;
    ndSetDestination: string;
    ndSetAlternate: string;
    ndSetContextMenu: { x: number, y: number },
    oansDisplayAirport: string,
    oansZoomIn: number,
    oansZoomOut: number,
}

export class OansControlEventPublisher extends BasePublisher<OansControlEvents> {
    private readonly events: GenericDataListenerSync[] = [];

    constructor(bus: EventBus, side: EfisSide) {
        super(bus);

        // Doesn't work atm, not possible to send between instruments of the same VCockpit
        this.events.push(new GenericDataListenerSync((ev, data: string) => {
            this.publish('oansDisplayAirport', data);
        }, `A380X_OANS_${side}_DISPLAY_AIRPORT`));
    }
}
