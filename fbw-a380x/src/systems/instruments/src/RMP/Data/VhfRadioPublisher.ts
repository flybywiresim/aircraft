// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface BaseVhfRadioEvents {
  /** The VHF radio frequeny ARINC429 word. */
  vhf_radio_frequency: number;
}

type IndexedTopics = 'vhf_radio_frequency';

type VhfRadioIndexedEvents = {
  [P in keyof Pick<BaseVhfRadioEvents, IndexedTopics> as IndexedEventType<P>]: BaseVhfRadioEvents[P];
};

export interface VhfRadioEvents extends BaseVhfRadioEvents, VhfRadioIndexedEvents {}

export class VhfRadioPublisher extends SimVarPublisher<VhfRadioEvents> {
  /**
   * Create a VHF radio publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<VhfRadioEvents>) {
    const simvars = new Map<keyof VhfRadioEvents, SimVarPublisherEntry<any>>([
      ['vhf_radio_frequency', { name: `L:FBW_VHF#index#_FREQUENCY`, type: SimVarValueType.Number, indexed: true }],
    ]);

    super(simvars, bus, pacer);
  }
}
