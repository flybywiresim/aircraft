// Copyright (c) 2021-2023 FlyByWire Simulations
//
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
  SetSubject,
} from '@microsoft/msfs-sdk';
import { ExtendedClockEvents } from './providers/ExtendedClockProvider';
import { NXLogicTriggeredMonostableNode } from '@flybywiresim/fbw-sdk';

export interface FlashProps extends ComponentProps {
  bus: EventBus;
  visibleClassName?: string;
  hiddenClassName: string;
  visible?: Subscribable<boolean>;
  flashing?: Subscribable<boolean>;
  flashDuration: number;
}

export class FlashOneHertz extends DisplayComponent<FlashProps> {
  private oneHertzClock = ConsumerSubject.create(null, false);

  private flashingMtrig = new NXLogicTriggeredMonostableNode(this.props.flashDuration, true);

  private flashingMtrigResult = Subject.create(false);

  private visible = MappedSubject.create(
    ([visible, oneHertzClock, flashingMtrig]) => visible && !(flashingMtrig && oneHertzClock),
    this.props.visible ?? Subject.create(true),
    this.oneHertzClock,
    this.flashingMtrigResult,
  );

  private classList = SetSubject.create<string>();

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

    this.visible.sub((vis) => {
      if (vis) {
        if (this.props.visibleClassName) {
          this.classList.add(this.props.visibleClassName);
        }
        this.classList.delete(this.props.hiddenClassName);
      } else {
        this.classList.add(this.props.hiddenClassName);
        if (this.props.visibleClassName) {
          this.classList.delete(this.props.visibleClassName ?? '');
        }
      }
    }, true);
  }

  render(): VNode {
    return <g class={this.classList}>{this.props.children}</g>;
  }
}
