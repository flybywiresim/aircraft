// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  EventBus,
  VNode,
  MappedSubject,
  Subscribable,
  ConsumerSubject,
  Subject,
} from '@microsoft/msfs-sdk';
import { MathUtils, EfisNdMode, Arinc429ConsumerSubject } from '@flybywiresim/fbw-sdk';

import { NDSimvars } from '../NDSimvarPublisher';
import { GenericDisplayManagementEvents } from '../types/GenericDisplayManagementEvents';
import { GenericFcuEvents } from '../types/GenericFcuEvents';
import {
  ArmedLateralMode,
  GenericFlightGuidanceEvents,
  isArmed,
  LateralMode,
} from '../types/GenericFlightGuidanceEvents';
import { FmsSymbolsData } from 'instruments/src/ND/FmsSymbolsPublisher';

export interface TrackLineProps {
  bus: EventBus;
  isUsingTrackUpMode: Subscribable<boolean>;
}

const TRACK_LINE_Y_POSITION = {
  [EfisNdMode.ROSE_NAV]: 384,
  [EfisNdMode.ARC]: 620,
};

export class TrackLine extends DisplayComponent<TrackLineProps> {
  private readonly lineRef = FSComponent.createRef<SVGLineElement>();

  private readonly sub = this.props.bus.getSubscriber<
    GenericDisplayManagementEvents & GenericFlightGuidanceEvents & NDSimvars & GenericFcuEvents & FmsSymbolsData
  >();

  private readonly ndMode = ConsumerSubject.create(this.sub.on('ndMode').whenChanged(), EfisNdMode.ARC);

  private headingWord = Arinc429ConsumerSubject.create(null);

  private trackWord = Arinc429ConsumerSubject.create(null);

  private lateralModeSub = ConsumerSubject.create(this.sub.on('fg.fma.lateralMode').whenChanged(), null);

  private lateralArmedSub = ConsumerSubject.create(this.sub.on('fg.fma.lateralArmedBitmask').whenChanged(), null);

  private readonly visibility = Subject.create('hidden');

  private readonly rotate = MappedSubject.create(
    ([heading, track]) => {
      if (this.props.isUsingTrackUpMode.get()) {
        return 0;
      }

      if (heading.isNormalOperation() && track.isNormalOperation()) {
        return MathUtils.diffAngle(heading.value, track.value);
      }

      return 0;
    },
    this.headingWord,
    this.trackWord,
  );

  private readonly y = this.ndMode.map((mode) => TRACK_LINE_Y_POSITION[mode] ?? 0);

  private readonly transform = MappedSubject.create(
    ([rotation, y]) => {
      return `rotate(${rotation} 384 ${y})`;
    },
    this.rotate,
    this.y,
  );

  private readonly areActiveVectorsTransmitted = Subject.create(false);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.headingWord.setConsumer(this.sub.on('heading'));
    this.trackWord.setConsumer(this.sub.on('track'));
    this.sub
      .on('vectorsActive')
      .handle((data) => this.areActiveVectorsTransmitted.set(data !== null && data !== undefined));

    this.headingWord.sub(() => this.handleLineVisibility(), true);
    this.trackWord.sub(() => this.handleLineVisibility(), true);
    this.lateralModeSub.sub(() => this.handleLineVisibility(), true);
    this.lateralArmedSub.sub(() => this.handleLineVisibility(), true);
    this.ndMode.sub(() => this.handleLineVisibility(), true);
    this.areActiveVectorsTransmitted.sub(() => this.handleLineVisibility(), true);
  }

  private handleLineVisibility() {
    const wrongNDMode = TRACK_LINE_Y_POSITION[this.ndMode.get()] === undefined;

    const headingInvalid = !this.headingWord.get().isNormalOperation();
    const trackInvalid = !this.trackWord.get().isNormalOperation();

    const lateralMode = this.lateralModeSub.get();
    const lateralArmed = this.lateralArmedSub.get();

    const areActiveVectorsTransmitted = this.areActiveVectorsTransmitted.get();

    const shouldShowLine =
      (lateralMode === LateralMode.HDG ||
        lateralMode === LateralMode.TRACK ||
        lateralMode === LateralMode.GA_TRACK ||
        lateralMode === LateralMode.RWY_TRACK) &&
      (!isArmed(lateralArmed, ArmedLateralMode.NAV) || !areActiveVectorsTransmitted);

    if (wrongNDMode || headingInvalid || trackInvalid || !shouldShowLine) {
      this.visibility.set('hidden');
    } else {
      this.visibility.set('inherit');
    }
  }

  render(): VNode | null {
    return (
      <g ref={this.lineRef} transform={this.transform} visibility={this.visibility}>
        <line x1={384} y1={149} x2={384} y2={this.y} class="rounded shadow" stroke-width={3.0} />
        <line x1={384} y1={149} x2={384} y2={this.y} class="Green rounded" stroke-width={2.5} />
      </g>
    );
  }
}
