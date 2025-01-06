// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  VNode,
  Subscribable,
  MappedSubject,
  ComponentProps,
  EventBus,
  ConsumerSubject,
  Subject,
  SubscribableUtils,
} from '@microsoft/msfs-sdk';
import { ExtendedClockEvents } from './providers/ExtendedClockProvider';
import { NXLogicTriggeredMonostableNode } from '@flybywiresim/fbw-sdk';

export interface FlashProps extends ComponentProps {
  bus: EventBus;
  className1?: Subscribable<string> | string;
  className2?: Subscribable<string> | string;
  visible?: Subscribable<boolean>;
  flashing?: Subscribable<boolean>;
  flashDuration: number;
}

export class FlashOneHertz extends DisplayComponent<FlashProps> {
  private readonly oneHertzClock = ConsumerSubject.create(null, false);

  private readonly flashingMtrig = new NXLogicTriggeredMonostableNode(this.props.flashDuration, true);

  private readonly flashingMtrigResult = Subject.create(false);

  private readonly visible = MappedSubject.create(
    ([visible, oneHertzClock, flashingMtrig]) => visible && !(flashingMtrig && oneHertzClock),
    this.props.visible ?? Subject.create(true),
    this.oneHertzClock,
    this.flashingMtrigResult,
  );

  private readonly class = MappedSubject.create(
    ([visible, class1, class2]) => (visible ? class1 : class2),
    this.visible,
    SubscribableUtils.toSubscribable(this.props.className1 ?? '', true),
    SubscribableUtils.toSubscribable(this.props.className2 ?? 'HiddenElement', true),
  );

  private prevClass = '';

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ExtendedClockEvents>();

    this.oneHertzClock.setConsumer(sub.on('oneHertzClock'));

    sub.on('deltaTime').handle((dt) => {
      const visible = this.props.visible?.get() ?? true;
      const shouldFlash = this.props.flashing?.get() ?? true;
      this.flashingMtrigResult.set(
        this.props.flashDuration === Infinity
          ? visible && shouldFlash
          : this.flashingMtrig.write(visible && shouldFlash, dt),
      );
    });

    this.class.sub((value) => {
      this.props.children.forEach((child) => {
        const classList = ((child as VNode).instance as HTMLElement).classList;

        classList.remove(...FSComponent.parseCssClassesFromString(this.prevClass));
        classList.add(...FSComponent.parseCssClassesFromString(value));
      });

      this.prevClass = value;
    }, true);
  }

  render(): VNode {
    return <>{this.props.children}</>;
  }
}
