// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable camelcase */

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface BaseTawsEvents {
  egpws_alert_discrete_word_1: number;
  egpws_alert_discrete_word_2: number;
}

/**
 * Indexed events related to air data computer information.
 */
type TawsIndexedEvents = {
  [P in keyof BaseTawsEvents as IndexedEventType<P>]: BaseTawsEvents[P];
};

export interface TawsDataEvents extends BaseTawsEvents, TawsIndexedEvents {}

export class TawsPublisher extends SimVarPublisher<TawsDataEvents> {
  /**
   * Creates an AdcPublisher.
   * @param bus The event bus to which to publish.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<TawsDataEvents>) {
    const simvars = new Map<keyof TawsDataEvents, SimVarPublisherEntry<any>>([
      [
        'egpws_alert_discrete_word_1',
        { name: 'L:A32NX_EGPWS_ALERT_#index#_DISCRETE_WORD_1', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'egpws_alert_discrete_word_2',
        { name: 'L:A32NX_EGPWS_ALERT_#index#_DISCRETE_WORD_2', type: SimVarValueType.Number, indexed: true },
      ],
    ]);
    super(simvars, bus, pacer);
  }
}
