// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  ComponentProps,
  DisplayComponent,
  VNode,
  Subject,
  EventBus,
  MappedSubject,
  Subscribable,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';
import { GenericVorEvents } from '../../types/GenericVorEvents';
import { Layer } from '../../../MsfsAvionicsCommon/Layer';

export interface GlideSlopeProps extends ComponentProps {
  bus: EventBus;
  backbeam?: Subscribable<boolean>;
}

export class GlideSlope extends DisplayComponent<GlideSlopeProps> {
  private readonly sub = this.props.bus.getSubscriber<GenericVorEvents>();

  private readonly backbeam = this.props.backbeam ?? Subject.create(false);

  // FIXME hook up when MMR ready
  private readonly mixLocVnav = Subject.create(false);

  private readonly isHidden = MappedSubject.create(
    ([backbeam, mixLocVnav]) => backbeam && !mixLocVnav,
    this.backbeam,
    this.mixLocVnav,
  );

  private readonly glideSlopeValid = ConsumerSubject.create(this.sub.on('glideSlopeValid'), false);

  private readonly gsAvailable = MappedSubject.create(
    ([isHidden, glideSlopeValid]) => !isHidden && glideSlopeValid,
    this.isHidden,
    this.glideSlopeValid,
  );

  private readonly gsDeviation = ConsumerSubject.create(this.sub.on('glideSlopeDeviation'), 0);

  private readonly deviationPxSub = this.gsDeviation.map((deviation) => {
    return (deviation / 0.8) * 128;
  });

  private readonly deviationUpperVisibleSub = MappedSubject.create(
    ([available, deviationPx]) => {
      return available && deviationPx < 128;
    },
    this.gsAvailable,
    this.deviationPxSub,
  );

  private readonly deviationLowerVisibleSub = MappedSubject.create(
    ([available, deviationPx]) => {
      return available && deviationPx > -128;
    },
    this.gsAvailable,
    this.deviationPxSub,
  );

  private readonly visibilityFn = (v) => (v ? 'inherit' : 'hidden');

  render(): VNode | null {
    return (
      <g
        id="glideslope-deviation"
        class={{
          hidden: this.isHidden,
        }}
      >
        <Layer x={750} y={384}>
          <circle cx={0} cy={-128} r={4} stroke-width={2.5} class="White" />
          <circle cx={0} cy={-64} r={4} stroke-width={2.5} class="White" />
          <line x1={-12} x2={12} y1={0} y2={0} stroke-width={5} class="Yellow" />
          <circle cx={0} cy={64} r={4} stroke-width={2.5} class="White" />
          <circle cx={0} cy={128} r={4} stroke-width={2.5} class="White" />
        </Layer>

        <Layer x={750} y={384}>
          <path
            d="M10,0 L0,-16 L-10,0"
            transform={this.deviationPxSub.map((deviationPx) => `translate(0 ${Math.max(-128, deviationPx)})`)}
            class="Magenta rounded"
            stroke-width={2.5}
            visibility={this.deviationUpperVisibleSub.map(this.visibilityFn)}
          />
          <path
            d="M-10,0 L0,16 L10,0"
            transform={this.deviationPxSub.map((deviationPx) => `translate(0 ${Math.min(128, deviationPx)})`)}
            class="Magenta rounded"
            stroke-width={2.5}
            visibility={this.deviationLowerVisibleSub.map(this.visibilityFn)}
          />
        </Layer>
      </g>
    );
  }
}
