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

interface BaseFwcEvents {
  fwc_discrete_word_126: number;
}

/**
 * Indexed events related to air data computer information.
 */
type FwcIndexedEvents = {
  [P in keyof BaseFwcEvents as IndexedEventType<P>]: BaseFwcEvents[P];
};

export interface FwcDataEvents extends BaseFwcEvents, FwcIndexedEvents {}

export class FwcPublisher extends SimVarPublisher<FwcDataEvents> {
  /**
   * Creates an AdcPublisher.
   * @param bus The event bus to which to publish.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<FwcDataEvents>) {
    const simvars = new Map<keyof FwcDataEvents, SimVarPublisherEntry<any>>([
      [
        'fwc_discrete_word_126',
        { name: 'L:A32NX_FWC_#index#_DISCRETE_WORD_126', type: SimVarValueType.Number, indexed: true },
      ],
    ]);
    super(simvars, bus, pacer);
  }
}
