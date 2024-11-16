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

interface BaseSecEvents {
  sec_rudder_status_word: number;
  sec_rudder_trim_actual_position: number;
}

/**
 * Indexed events related to air data computer information.
 */
type SecIndexedEvents = {
  [P in keyof BaseSecEvents as IndexedEventType<P>]: BaseSecEvents[P];
};

export interface SecDataEvents extends BaseSecEvents, SecIndexedEvents {}

export class SecPublisher extends SimVarPublisher<SecDataEvents> {
  /**
   * Creates an AdcPublisher.
   * @param bus The event bus to which to publish.
   * @param pacer An optional pacer to use to control the rate of publishing.
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<SecDataEvents>) {
    const simvars = new Map<keyof SecDataEvents, SimVarPublisherEntry<any>>([
      [
        'sec_rudder_status_word',
        { name: 'L:A32NX_SEC_#index#_RUDDER_STATUS_WORD', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'sec_rudder_trim_actual_position',
        { name: 'L:A32NX_SEC_#index#_RUDDER_ACTUAL_POSITION', type: SimVarValueType.Number, indexed: true },
      ],
    ]);
    super(simvars, bus, pacer);
  }
}
