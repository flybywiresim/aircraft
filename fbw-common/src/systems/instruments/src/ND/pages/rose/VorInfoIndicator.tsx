// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  ComponentProps,
  DisplayComponent,
  EventBus,
  Subject,
  VNode,
  MappedSubject,
} from '@microsoft/msfs-sdk';
import { Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';

import { GenericVorEvents } from '../../types/GenericVorEvents';
import { GenericFlightManagementBusEvents } from '../../types/GenericFlightManagementBusEvents';
import { Layer } from '../../../MsfsAvionicsCommon/Layer';

export interface VorInfoIndicatorProps extends ComponentProps {
  bus: EventBus;
  index: 1 | 2;
}

export class VorInfoIndicator extends DisplayComponent<VorInfoIndicatorProps> {
  private readonly adf = Subject.create(false);

  private readonly vorIdent = Subject.create('');

  private readonly vorFrequency = Subject.create(-1);

  private readonly vorCourse = Subject.create(-1);

  // private readonly vorAvailable = Subject.create(false);

  private readonly fm1Healthy = Subject.create(false);

  private readonly fm2Healthy = Subject.create(false);

  private readonly fm1NavTuningWord = Arinc429RegisterSubject.createEmpty();

  private readonly fm2NavTuningWord = Arinc429RegisterSubject.createEmpty();

  private readonly tuningMode = MappedSubject.create(
    ([adf, fm1Healthy, fm2Healthy, fm1NavTuningWord, fm2NavTuningWord]) => {
      const bitIndex = 10 + this.props.index + (adf ? 2 : 0);

      if (
        (!fm1Healthy && !fm2Healthy) ||
        (!fm1NavTuningWord.isNormalOperation() && !fm2NavTuningWord.isNormalOperation())
      ) {
        return 'R';
      }

      if (fm1NavTuningWord.bitValueOr(bitIndex, false) || fm2NavTuningWord.bitValueOr(bitIndex, false)) {
        return 'M';
      }

      return '';
    },
    this.adf,
    this.fm1Healthy,
    this.fm2Healthy,
    this.fm1NavTuningWord,
    this.fm2NavTuningWord,
  );

  private readonly frequencyIntTextSub = Subject.create('---');

  private readonly frequencyDecimalTextSub = Subject.create('--');

  private readonly courseTextSub = Subject.create('---');

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const subs = this.props.bus.getSubscriber<GenericVorEvents & GenericFlightManagementBusEvents>();

    subs
      .on(`nav${this.props.index}Ident`)
      .whenChanged()
      .handle((value) => {
        this.vorIdent.set(value);
      });

    subs
      .on(`nav${this.props.index}Frequency`)
      .whenChanged()
      .handle((value) => {
        this.vorFrequency.set(value);
      });

    subs
      .on(`nav${this.props.index}Obs`)
      .whenChanged()
      .handle((value) => {
        this.vorCourse.set(value);
      });

    /*      subs.on(`nav${this.props.index}Available`).whenChanged().handle((value) => {
            this.vorAvailable.set(value);
        }); */

    subs
      .on('fm.1.healthy_discrete')
      .whenChanged()
      .handle((healthy) => this.fm1Healthy.set(healthy));

    subs
      .on('fm.2.healthy_discrete')
      .whenChanged()
      .handle((healthy) => this.fm2Healthy.set(healthy));

    subs
      .on('fm.1.tuning_discrete_word')
      .whenChanged()
      .handle((word) => this.fm1NavTuningWord.setWord(word));

    subs
      .on('fm.2.tuning_discrete_word')
      .whenChanged()
      .handle((word) => this.fm2NavTuningWord.setWord(word));

    this.vorFrequency.sub((frequency) => {
      const [int, dec] = frequency.toFixed(2).split('.', 2);

      if (frequency > 0) {
        this.frequencyIntTextSub.set(int);
        this.frequencyDecimalTextSub.set(dec);
      } else {
        this.frequencyIntTextSub.set('---');
        this.frequencyDecimalTextSub.set('--');
      }
    }, true);

    this.vorCourse.sub((course) => {
      this.courseTextSub.set(this.vorFrequency.get() > 0 ? Math.round(course).toString().padStart(3, '0') : '---');
    }, true);
  }

  private readonly visibilityFn = (v: boolean) => (v ? 'inherit' : 'hidden');

  render(): VNode | null {
    return (
      <Layer x={748} y={28}>
        <text x={-102} y={0} font-size={25} class="White" text-anchor="end">
          VOR
          {this.props.index.toString()}
        </text>

        <g class="White" text-anchor="end">
          <text x={-40} y={0} font-size={25}>
            {this.frequencyIntTextSub}
          </text>
          <text x={0} y={0} font-size={20}>
            .{this.frequencyDecimalTextSub}
          </text>
        </g>

        <text x={-56} y={30} font-size={25} class="White" text-anchor="end">
          CRS
        </text>
        <text x={20} y={30} font-size={25} class="Cyan" text-anchor="end">
          {this.courseTextSub}
          &deg;
        </text>

        <g visibility={this.vorFrequency.map((v) => v > 0).map(this.visibilityFn)}>
          <text x={-80} y={58} font-size={20} class="White" text-anchor="end" text-decoration="underline">
            {this.tuningMode}
          </text>
        </g>

        <text x={0} y={60} font-size={25} class="White" text-anchor="end">
          {this.vorIdent}
        </text>
      </Layer>
    );
  }
}
