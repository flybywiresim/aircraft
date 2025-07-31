// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ComponentProps, ConsumerSubject, DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { RmpMessageDataEvents } from 'instruments/src/RMP/Systems/RmpMessageManager';

export interface RmpMessagesProps extends ComponentProps {
  bus: EventBus;
}

export class RmpMessages extends DisplayComponent<RmpMessagesProps> {
  private readonly message = ConsumerSubject.create(
    this.props.bus.getSubscriber<RmpMessageDataEvents>().on('rmp_message'),
    '',
  );

  /** @inheritdoc */
  render(): VNode {
    return <div class="rmp-messages font-10">{this.message}</div>;
  }
}
