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

export interface SelectedHeadingBugProps {
  bus: ArincEventBus;
  rotationOffset: Subscribable<number>;
  mode: Subscribable<EfisNdMode>;
}

export class SelectedHeadingBug extends DisplayComponent<SelectedHeadingBugProps> {
  private readonly diffSubject = Subject.create(0);

  private readonly headingWord = Arinc429ConsumerSubject.create(null);

  private readonly selected = Subject.create(0);

  private readonly isSelectedHeadingShown = ConsumerSubject.create(null, false);

  // eslint-disable-next-line
    private readonly bugShown = MappedSubject.create(([headingWord, isShown, diff, mode]) => {
      if (!isShown) {
        return false;
      }
      if (!headingWord.isNormalOperation()) {
        return false;
      }

      if (mode === EfisNdMode.ROSE_ILS || mode === EfisNdMode.ROSE_NAV || mode === EfisNdMode.ROSE_VOR) {
        return true;
      }

      if (mode === EfisNdMode.PLAN) {
        return false;
      }

      return diff <= 48;
    },
    this.headingWord,
    this.isSelectedHeadingShown,
    this.diffSubject,
    this.props.mode,
  );

  // eslint-disable-next-line
    private readonly textShown = MappedSubject.create(([headingWord, isShown, diff, mode]) => {
      if (!isShown) {
        return false;
      }
      if (!headingWord.isNormalOperation()) {
        return false;
      }

      if (mode === EfisNdMode.ROSE_ILS || mode === EfisNdMode.ROSE_NAV || mode === EfisNdMode.ROSE_VOR) {
        return false;
      }

      if (mode === EfisNdMode.PLAN) {
        return false;
      }

      return Math.abs(diff) > 48;
    },
    this.headingWord,
    this.isSelectedHeadingShown,
    this.diffSubject,
    this.props.mode,
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

    const sub = this.props.bus.getArincSubscriber<GenericDisplayManagementEvents & NDSimvars>();

    sub
      .on('selectedHeading')
      .whenChanged()
      .handle((v) => {
        this.selected.set(v);
        this.handleDisplay();
      });

    this.headingWord.setConsumer(sub.on('heading').withArinc429Precision(2));

    this.isSelectedHeadingShown.setConsumer(sub.on('showSelectedHeading').whenChanged());

    this.headingWord.sub((_v) => this.handleDisplay(), true);
  }

  private handleDisplay() {
    const headingValid = this.headingWord.get().isNormalOperation();

    if (headingValid) {
      const diff = MathUtils.getSmallestAngle(this.selected.get(), this.headingWord.get().value);

      this.diffSubject.set(diff + this.props.rotationOffset.get());
    }
  }

  render(): VNode | null {
    return (
      <>
        <g visibility={this.bugShown.map((v) => (v ? 'inherit' : 'hidden'))} transform={this.transformSubject}>
          <path d="M382,126 L370,99 L398,99 L386,126" class="rounded shadow" stroke-width={3.5} />
          <path d="M382,126 L370,99 L398,99 L386,126" class="Cyan rounded" stroke-width={3} />
        </g>

        <text
          visibility={this.textShown.map((v) => (v ? 'inherit' : 'hidden'))}
          x={384}
          y={60}
          text-anchor="middle"
          transform={this.diffSubject.map((diff) => `rotate(${diff < 0 ? -38 : 38} 384 620)`)}
          class="Cyan shadow"
          font-size={22}
        >
          {this.selected.map((selected) => `${Math.round(selected).toString().padStart(3, '0')}`)}
        </text>
      </>
    );
  }
}
