// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  VNode,
  Subject,
  MappedSubject,
  EventBus,
  Subscribable,
} from '@microsoft/msfs-sdk';

import { EfisNdMode, TcasWxrMessage } from '@flybywiresim/fbw-sdk';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { GenericTcasEvents } from './types/GenericTcasEvents';

export interface TcasWXMessagesProps {
  bus: EventBus;
  mode: Subscribable<EfisNdMode>;
}

export class TcasWxrMessages extends DisplayComponent<TcasWXMessagesProps> {
  private readonly taOnlySub = Subject.create(false);

  private readonly failSub = Subject.create(false);

  private readonly leftMessage = Subject.create<TcasWxrMessage | undefined>(undefined);

  private readonly rightMessage = Subject.create<TcasWxrMessage | undefined>(undefined);

  private readonly y = this.props.mode.map((mode) =>
    mode === EfisNdMode.ROSE_VOR || mode === EfisNdMode.ROSE_ILS ? 713 : 680,
  );

  private readonly backgroundFillShown = this.props.mode.map(
    (it) => it === EfisNdMode.ARC || it === EfisNdMode.ROSE_NAV,
  );

  private shown = MappedSubject.create(
    ([mode, left, right]) => {
      const improperMode =
        mode !== EfisNdMode.ARC &&
        mode !== EfisNdMode.ROSE_NAV &&
        mode !== EfisNdMode.ROSE_VOR &&
        mode !== EfisNdMode.ROSE_ILS;

      return !improperMode && (left !== undefined || right !== undefined);
    },
    this.props.mode,
    this.leftMessage,
    this.rightMessage,
  );

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericTcasEvents>();

    sub
      .on('tcasTaOnly')
      .whenChanged()
      .handle((value) => this.taOnlySub.set(value));
    sub
      .on('tcasFault')
      .whenChanged()
      .handle((value) => this.failSub.set(value));

    MappedSubject.create(
      ([taOnly, failed]) => {
        if (failed) {
          this.leftMessage.set({ text: 'TCAS', color: 'Amber' });
        } else if (taOnly) {
          this.leftMessage.set({ text: 'TA ONLY', color: 'White' });
        } else {
          this.leftMessage.set(undefined);
        }
      },
      this.taOnlySub,
      this.failSub,
    );
  }

  render(): VNode | null {
    return (
      <Layer x={Subject.create(164)} y={this.y} visible={this.shown}>
        <rect
          visibility={this.backgroundFillShown.map((shown) => (shown ? 'inherit' : 'hidden'))}
          x={0}
          y={0}
          width={440}
          height={88}
          class="BackgroundFill"
          stroke="none"
        />

        <rect x={0} y={0} width={440} height={27} class="Grey BackgroundFill" stroke-width={1.75} />

        <text x={8} y={25} class={this.leftMessage.map((it) => it?.color ?? '')} text-anchor="start" font-size={27}>
          {this.leftMessage.map((it) => it?.text ?? '')}
        </text>

        <text x={425} y={25} class={this.rightMessage.map((it) => it?.color ?? '')} text-anchor="end" font-size={27}>
          {this.rightMessage.map((it) => it?.text ?? '')}
        </text>
      </Layer>
    );
  }
}
