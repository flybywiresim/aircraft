// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, EfisNdMode, Arinc429ConsumerSubject, MathUtils } from '@flybywiresim/fbw-sdk';

import { NDSimvars } from '../../NDSimvarPublisher';
import { GenericDisplayManagementEvents } from '../../types/GenericDisplayManagementEvents';
import { GenericFcuEvents } from '../../types/GenericFcuEvents';

export interface LsCourseBugProps {
  bus: ArincEventBus;
  rotationOffset: Subscribable<number>;
  mode: Subscribable<EfisNdMode>;
}

export class LsCourseBug extends DisplayComponent<LsCourseBugProps> {
  private readonly diffSubject = Subject.create(0);

  private readonly headingWord = Arinc429ConsumerSubject.create(null).pause();

  private readonly lsCourse = ConsumerSubject.create(null, 0).pause();

  private readonly efisLsActive = ConsumerSubject.create(null, false);

  private readonly bugShown = MappedSubject.create(
    ([headingWord, lsCourse, diff, efisLsActive]) =>
      efisLsActive && headingWord.isNormalOperation() && lsCourse >= 0 && Math.abs(diff) <= 48,
    this.headingWord,
    this.lsCourse,
    this.diffSubject,
    this.efisLsActive,
  );

  private readonly transformSubject = MappedSubject.create(
    ([diff, ndMode]) => {
      return `rotate(${diff} 384 ${ndMode === EfisNdMode.ARC ? 620 : 384})`;
    },
    this.diffSubject,
    this.props.mode,
  );

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<GenericDisplayManagementEvents & GenericFcuEvents & NDSimvars>();

    this.headingWord.setConsumer(sub.on('heading').withArinc429Precision(2));

    this.headingWord.sub((_h) => this.handleDisplay());

    this.lsCourse.sub(this.handleDisplay.bind(this));

    this.lsCourse.setConsumer(sub.on('ilsCourse'));

    this.efisLsActive.sub((ls) => {
      if (ls) {
        this.headingWord.resume();
        this.lsCourse.resume();
        this.handleDisplay();
      } else {
        this.headingWord.pause();
        this.lsCourse.pause();
      }
    });

    this.efisLsActive.setConsumer(sub.on('efisLsActive'));
  }

  private handleDisplay() {
    const headingValid = this.headingWord.get().isNormalOperation();

    if (headingValid) {
      const diff = MathUtils.getSmallestAngle(this.lsCourse.get(), this.headingWord.get().value);

      this.diffSubject.set(diff + this.props.rotationOffset.get());
    }
  }

  render(): VNode | null {
    return (
      <>
        <g visibility={this.bugShown.map((v) => (v ? '' : 'hidden'))} transform={this.transformSubject}>
          <line x1={376} y1={114} x2={392} y2={114} class="rounded shadow" stroke-width={2.5} />
          <line x1={384} y1={122} x2={384} y2={74} class="rounded shadow" stroke-width={2.5} />

          <line x1={376} y1={114} x2={392} y2={114} class="Magenta rounded" stroke-width={2.5} />
          <line x1={384} y1={122} x2={384} y2={74} class="Magenta rounded" stroke-width={2.5} />
        </g>
      </>
    );
  }
}
