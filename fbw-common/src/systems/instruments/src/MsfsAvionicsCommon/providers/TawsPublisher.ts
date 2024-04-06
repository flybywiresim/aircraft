// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable camelcase */

import { EventBus, IndexedEventType, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface BaseTawsEvents {
    gpws_discrete_word: number;
}

/**
 * Indexed events related to air data computer information.
 */
type TawsIndexedEvents = {
    [P in keyof BaseTawsEvents as IndexedEventType<P>]: BaseTawsEvents[P];
};

export interface TawsDataEvents extends BaseTawsEvents, TawsIndexedEvents {
}

export class TawsPublisher extends SimVarPublisher<TawsDataEvents> {
    /**
   * Creates an AdcPublisher.
   * @param bus The event bus to which to publish.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
    public constructor(bus: EventBus, pacer?: PublishPacer<TawsDataEvents>) {
        const simvars = new Map<keyof TawsDataEvents, SimVarPublisherEntry<any>>([
            ['gpws_discrete_word', { name: 'L:A32NX_GPWS_#index#_DISCRETE_WORD', type: SimVarValueType.Number, indexed: true }],
        ]);
        super(simvars, bus, pacer);
    }
}
