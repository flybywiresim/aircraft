//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { FcuSimvars } from '../Publishers/FcuSimvarPublisher';

interface BaroRefDisplayProps {
  isCaptSide: boolean;
  bus: EventBus;
}

export class BaroRefDisplay extends DisplayComponent<BaroRefDisplayProps> {
  private sub = this.props.bus.getSubscriber<FcuSimvars>();

  private baroIsInhg = ConsumerSubject.create(null, false);

  private baroIsStd = ConsumerSubject.create(null, false);

  private baroValue = ConsumerSubject.create(null, 0);

  private baroMode = ConsumerSubject.create(null, 0);

  private lightsTest = ConsumerSubject.create(this.sub.on('lightsTest'), false);

  private baroValueSub = MappedSubject.create(
    ([lightsTest, baroIsStd, baroIsInhg, baroValue]) => {
      if (lightsTest) {
        return '88.88';
      } else if (baroIsStd) {
        return 'Std';
      } else if (!baroIsInhg) {
        return Math.round(baroValue).toString().padStart(4, '0');
      } else {
        return baroValue.toFixed(2);
      }
    },
    this.lightsTest,
    this.baroIsStd,
    this.baroIsInhg,
    this.baroValue,
  );

  private baroPreselValueSub = MappedSubject.create(
    ([lightsTest, baroIsInhg, baroIsStd, baroValue, baroMode]) => {
      if (lightsTest) {
        return 'p8.88';
      } else if (!baroIsStd && baroMode === 2) {
        return 'qfe';
      } else if (!baroIsInhg) {
        return Math.round(baroValue).toString().padStart(4, '0');
      } else {
        return baroValue.toFixed(2);
      }
    },
    this.lightsTest,
    this.baroIsInhg,
    this.baroIsStd,
    this.baroValue,
    this.baroMode,
  );

  private baroPreselSub = MappedSubject.create(
    ([lightsTest, baroMode]) => {
      return lightsTest || baroMode === 2;
    },
    this.lightsTest,
    this.baroMode,
  );

  private qnhLabelSub = MappedSubject.create(
    ([lightsTest, baroMode]) => {
      if (lightsTest) {
        return true;
      } else if (baroMode === 0) {
        return false;
      } else if (baroMode === 1) {
        return true;
      } else {
        return false;
      }
    },
    this.lightsTest,
    this.baroMode,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<FcuSimvars>();

    this.baroIsInhg.setConsumer(sub.on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroIsInhg`));

    this.baroIsStd.setConsumer(sub.on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroIsStd`));

    this.baroValue.setConsumer(sub.on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroValue`));

    this.baroMode.setConsumer(sub.on(`eisDisplay${this.props.isCaptSide ? 'Left' : 'Right'}BaroMode`));
  }

  public render(): VNode {
    return (
      <div id={`baro-screen-${this.props.isCaptSide ? 1 : 2}`} class="baro-screen">
        <div id="Selected">
          <svg width="100%" height="100%" class="Baro">
            <text
              id="QNH"
              class={{
                Common: true,
                Active: this.qnhLabelSub,
                Inactive: this.qnhLabelSub.map(SubscribableMapFunctions.not()),
              }}
              x="6%"
              y="23%"
            >
              QNH
            </text>
            <text
              id="PreSelBaroValue"
              class={{
                Common: true,
                Value: this.baroPreselSub,
                Inactive: this.baroPreselSub.map(SubscribableMapFunctions.not()),
              }}
              x="97%"
              y="30%"
              text-anchor="end"
            >
              {this.baroPreselValueSub}
            </text>
            <text id="Value" class="Common Value" x="4%" y="95%">
              {this.baroValueSub}
            </text>
          </svg>
        </div>
      </div>
    );
  }
}
