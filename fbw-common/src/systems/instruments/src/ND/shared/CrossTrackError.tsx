// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  Subject,
  Subscribable,
  VNode,
  EventBus,
  MappedSubject,
} from '@microsoft/msfs-sdk';
import { EfisNdMode } from '@flybywiresim/fbw-sdk';

import { GenericFmsEvents } from '../types/GenericFmsEvents';

export interface CrossTrackErrorProps {
  bus: EventBus;
  currentPageMode: Subscribable<EfisNdMode>;
  isNormalOperation: Subscribable<boolean>; // TODO replace with ARINC429 word
}

export class CrossTrackError extends DisplayComponent<CrossTrackErrorProps> {
  private readonly crossTrackText = Subject.create('');

  private readonly crossTrackX = Subject.create(0);

  private readonly xValueInitial = this.props.currentPageMode.map((p) => {
    return p === EfisNdMode.PLAN ? 44 : 390;
  });

  private readonly yValueInitial = this.props.currentPageMode.map((p) => {
    switch (p) {
      case EfisNdMode.ARC:
        return 646;
      case EfisNdMode.PLAN:
        return 690;
      case EfisNdMode.ROSE_NAV:
        return 407;
      default:
        return 0;
    }
  });

  private readonly crossTrackAnchor = Subject.create('');

  private rnp = 0;

  /* eslint-disable max-len */
  private readonly crossTrackVisibility = MappedSubject.create(
    ([isNormalOperation, currentPageMode]) =>
      isNormalOperation &&
      (currentPageMode === EfisNdMode.ARC ||
        currentPageMode === EfisNdMode.PLAN ||
        currentPageMode === EfisNdMode.ROSE_NAV)
        ? 'inherit'
        : 'hidden',
    this.props.isNormalOperation,
    this.props.currentPageMode,
  );

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericFmsEvents>();

    sub
      .on('crossTrackError')
      .atFrequency(2)
      .handle((crossTrackError) => {
        const x = this.xValueInitial.get();

        let crossTrackText = '';
        let crossTrackAnchor = 'start';
        let crossTrackX = x;
        const crossTrackAbs = Math.min(99.9, Math.abs(crossTrackError));

        if (
          this.rnp > 0 &&
          this.rnp <= 0.3 + Number.EPSILON &&
          crossTrackAbs >= 0.02 - Number.EPSILON &&
          crossTrackAbs < 0.3 + Number.EPSILON
        ) {
          crossTrackText = crossTrackAbs.toFixed(2);
        } else if (crossTrackAbs >= 0.1) {
          crossTrackText = crossTrackAbs.toFixed(1);
        }

        if (crossTrackText.length > 0) {
          if (crossTrackError < 0) {
            crossTrackText += 'R';
            crossTrackAnchor = 'start';
            crossTrackX = x + 34;
          } else {
            crossTrackText += 'L';
            crossTrackAnchor = 'end';
            crossTrackX = x - 38;
          }
        }

        this.crossTrackText.set(crossTrackText);
        this.crossTrackAnchor.set(crossTrackAnchor);
        this.crossTrackX.set(crossTrackX);
      });

    sub
      .on('rnp')
      .whenChanged()
      .handle((rnp) => {
        this.rnp = rnp;
      });
  }

  render(): VNode | null {
    return (
      <text
        x={MappedSubject.create(
          ([currentPageMode, crossTrackX, xValueInitial]) =>
            currentPageMode === EfisNdMode.PLAN ? xValueInitial : crossTrackX,
          this.props.currentPageMode,
          this.crossTrackX,
          this.xValueInitial,
        )}
        y={this.yValueInitial}
        text-anchor={MappedSubject.create(
          ([currentPageMode, crossTrackAnchor]) => (currentPageMode === EfisNdMode.PLAN ? 'start' : crossTrackAnchor),
          this.props.currentPageMode,
          this.crossTrackAnchor,
        )}
        class="Green FontSmall shadow"
        visibility={this.crossTrackVisibility}
      >
        {this.crossTrackText}
      </text>
    );
  }
}
