// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, Instrument } from '@microsoft/msfs-sdk';
import { AudioControlLocalVarEvents } from 'instruments/src/RMP/Data/AudioControlPublisher';
import { RmpMessageControlEvents } from 'instruments/src/RMP/Systems/RmpMessageManager';

/** Monitors the transmit state of each external COM means and posts a message if receive is not selected. */
export class TransmitMessageMonitor implements Instrument {
  private readonly sub = this.bus.getSubscriber<AudioControlLocalVarEvents>();
  private pub = this.bus.getPublisher<RmpMessageControlEvents>();

  private static readonly monitorDefinitions = [
    {
      type: 'VHF',
      index: 1,
    },
    {
      type: 'VHF',
      index: 2,
    },
    {
      type: 'VHF',
      index: 3,
    },
    {
      type: 'HF',
      index: 1,
    },
    {
      type: 'HF',
      index: 2,
    },
    {
      type: 'TEL',
      index: 1,
    },
    {
      type: 'TEL',
      index: 2,
    },
  ];

  private readonly monitorSubs = TransmitMessageMonitor.monitorDefinitions.map((def) => {
    const receiveState = ConsumerSubject.create(
      this.sub.on(`${def.type.toLowerCase()}_receive_${def.index}` as keyof AudioControlLocalVarEvents),
      false,
    );
    const transmitState = ConsumerSubject.create(
      this.sub.on(`${def.type.toLowerCase()}_transmit_${def.index}` as keyof AudioControlLocalVarEvents),
      false,
    );
    return transmitState.sub(
      (tx) =>
        tx && !receiveState.get() && this.pub.pub('rmp_message_set', `${def.type}${def.index} RECEPTION NOT SELECTED`),
      false,
      true,
    );
  });

  constructor(private readonly bus: EventBus) {}

  init(): void {
    for (const sub of this.monitorSubs) {
      // no initialNotify as we don't care about boot up state...
      sub.resume();
    }
  }
  onUpdate(): void {
    // noop
  }
}
