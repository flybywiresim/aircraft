// @ts-strict-ignore
// Copyright (c) 2021-2026 FlyByWire Simulations
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
  Subscription,
  TypedDataBusClient,
} from '@microsoft/msfs-sdk';
import {
  MathUtils,
  EfisNdMode,
  EfisSide,
  EfisVectorsData,
  EfisVectorsGroup,
  Arinc429ConsumerSubject,
} from '@flybywiresim/fbw-sdk';

import { NDSimvars } from '../NDSimvarPublisher';
import { GenericDisplayManagementEvents } from '../types/GenericDisplayManagementEvents';
import { GenericFcuEvents } from '../types/GenericFcuEvents';
import { GenericFlightGuidanceEvents } from '../types/GenericFlightGuidanceEvents';

export interface TrackLineProps {
  bus: EventBus;
  efisVectors: TypedDataBusClient<EfisVectorsData>;
  side: EfisSide;
  isUsingTrackUpMode: Subscribable<boolean>;
}

const TRACK_LINE_Y_POSITION = {
  [EfisNdMode.ROSE_NAV]: 384,
  [EfisNdMode.ARC]: 620,
};

export class TrackLine extends DisplayComponent<TrackLineProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly lineRef = FSComponent.createRef<SVGLineElement>();

  private readonly sub = this.props.bus.getSubscriber<
    GenericDisplayManagementEvents & GenericFlightGuidanceEvents & NDSimvars & GenericFcuEvents
  >();

  private readonly ndMode = ConsumerSubject.create(this.sub.on('ndMode').whenChanged(), EfisNdMode.ARC);

  private readonly headingWord = Arinc429ConsumerSubject.create(null);

  private readonly trackWord = Arinc429ConsumerSubject.create(null);

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

  private readonly areActiveVectorsTransmitted = this.props.efisVectors
    .getSubscribable(this.props.side, EfisVectorsGroup.ACTIVE)
    .map((data) => data.value !== undefined);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.headingWord.setConsumer(this.sub.on('heading'));
    this.trackWord.setConsumer(this.sub.on('track'));

    this.subscriptions.push(
      this.headingWord.sub(() => this.handleLineVisibility(), true),
      this.trackWord.sub(() => this.handleLineVisibility(), true),
      this.ndMode.sub(() => this.handleLineVisibility(), true),
      this.areActiveVectorsTransmitted.sub(() => this.handleLineVisibility(), true),
    );
  }

  public destroy(): void {
    this.subscriptions.forEach((subscription) => subscription.destroy());
    this.areActiveVectorsTransmitted.destroy();
    this.transform.destroy();
    this.y.destroy();
    this.rotate.destroy();
    this.headingWord.destroy();
    this.trackWord.destroy();
    this.ndMode.destroy();
    super.destroy();
  }

  private handleLineVisibility() {
    const wrongNDMode = TRACK_LINE_Y_POSITION[this.ndMode.get()] === undefined;

    const headingInvalid = !this.headingWord.get().isNormalOperation();
    const trackInvalid = !this.trackWord.get().isNormalOperation();

    const areActiveVectorsTransmitted = this.areActiveVectorsTransmitted.get();

    const shouldShowLine = !areActiveVectorsTransmitted;

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
