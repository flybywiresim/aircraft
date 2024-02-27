// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { EfisNdMode, Arinc429ConsumerSubject, MathUtils } from '@flybywiresim/fbw-sdk';

import { NDSimvars } from '../NDSimvarPublisher';
import { GenericDisplayManagementEvents } from '../types/GenericDisplayManagementEvents';
import { GenericFcuEvents } from '../types/GenericFcuEvents';

export interface TrackBugProps {
  bus: EventBus;
  isUsingTrackUpMode: Subscribable<boolean>;
  ndMode: Subscribable<EfisNdMode>;
}

export class TrackBug extends DisplayComponent<TrackBugProps> {
  private readonly ndMode = ConsumerSubject.create(null, EfisNdMode.ARC);

  private readonly headingWord = Arinc429ConsumerSubject.create(null);

  private readonly trackWord = Arinc429ConsumerSubject.create(null);

  private readonly diffSubject = Subject.create(0);

  private readonly bugShown = Subject.create(false);

  private readonly transformSubject = MappedSubject.create(
    ([diff, ndMode]) => {
      return `rotate(${diff} 384 ${ndMode === EfisNdMode.ARC ? 620 : 384})`;
    },
    this.diffSubject,
    this.props.ndMode,
  );

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericDisplayManagementEvents & NDSimvars & GenericFcuEvents>();

    this.ndMode.setConsumer(sub.on('ndMode').whenChanged());
    this.headingWord.setConsumer(sub.on('heading'));
    this.trackWord.setConsumer(sub.on('track'));

    this.ndMode.sub(() => this.handleDisplay(), true);
    this.headingWord.sub(() => this.handleDisplay(), true);
    this.trackWord.sub(() => this.handleDisplay(), true);
  }

  private handleDisplay() {
    const wrongNdMode = this.ndMode.get() === EfisNdMode.PLAN;

    const headingInvalid = !this.headingWord.get().isNormalOperation();
    const trackInvalid = !this.trackWord.get().isNormalOperation();

    if (wrongNdMode || headingInvalid || trackInvalid) {
      this.bugShown.set(false);
    } else {
      let diff;
      if (this.props.isUsingTrackUpMode.get()) {
        diff = 0;
      } else {
        diff = MathUtils.getSmallestAngle(this.trackWord.get().value, this.headingWord.get().value);
      }

      this.bugShown.set(diff <= 40);
      this.diffSubject.set(diff);
    }
  }

  render(): VNode | null {
    return (
      <g visibility={this.bugShown.map((v) => (v ? 'inherit' : 'hidden'))} transform={this.transformSubject}>
        <path
          d={this.ndMode.map((ndMode) =>
            ndMode !== EfisNdMode.ARC
              ? 'M384,134 L379,143 L384,152 L389,143 L384,134'
              : 'M384,128 L378,138 L384,148 L390,138 L384,128',
          )}
          class="rounded shadow"
          stroke-width={4.5}
        />
        <path
          d={this.ndMode.map((ndMode) =>
            ndMode !== EfisNdMode.ARC
              ? 'M384,134 L379,143 L384,152 L389,143 L384,134'
              : 'M384,128 L378,138 L384,148 L390,138 L384,128',
          )}
          class="Green rounded"
          stroke-width={3}
        />
      </g>
    );
  }
}
