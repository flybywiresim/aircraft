// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { Layer } from '../MsfsAvionicsCommon/Layer';

interface N1LimitProps {
  bus: EventBus;
}
export class N1Limit extends DisplayComponent<N1LimitProps> {
  private inactiveVisibility = Subject.create('hidden');

  private activeVisibility = Subject.create('hidden');

  private flexVisibility = Subject.create('hidden');

  private textThrustLimitType = Subject.create('');

  private textThrustLimitInt = Subject.create('');

  private textThrustLimitFract = Subject.create('');

  private textFlexTemp = Subject.create('');

  private engine1Fadec: boolean = false;

  private engine2Fadec: boolean = false;

  private autoThrustLimit: number = 0;

  private thrustLimitType: number = 0;

  private flexTemp: number = 0;

  private sat = new Arinc429Word(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents & EwdSimvars>();

    sub
      .on('engine1Fadec')
      .whenChanged()
      .handle((f) => {
        this.engine1Fadec = f;
      });

    sub
      .on('engine2Fadec')
      .whenChanged()
      .handle((f) => {
        this.engine2Fadec = f;
      });

    sub
      .on('autoThrustLimit')
      .whenChanged()
      .handle((l) => {
        this.autoThrustLimit = Math.abs(l);
      });

    sub
      .on('thrustLimitType')
      .whenChanged()
      .handle((l) => {
        this.thrustLimitType = l;
      });

    sub
      .on('flexTemp')
      .whenChanged()
      .handle((c) => {
        this.flexTemp = c;
      });

    sub
      .on('sat')
      .whenChanged()
      .handle((sat) => {
        this.sat = sat;
      });

    sub
      .on('realTime')
      .atFrequency(2)
      .handle((_t) => {
        const isActive = this.engine1Fadec || this.engine2Fadec;
        if (isActive) {
          this.inactiveVisibility.set('hidden');
          this.activeVisibility.set('visible');

          const thrustLimitTypes = ['', 'CLB', 'MCT', 'FLX', 'TOGA', 'MREV'];
          this.textThrustLimitType.set(thrustLimitTypes[this.thrustLimitType]);

          const n1Limit = this.autoThrustLimit.toFixed(1).split('.', 2);
          this.textThrustLimitInt.set(n1Limit[0]);
          this.textThrustLimitFract.set(n1Limit[1]);

          const showFlex =
            this.flexTemp !== 0 &&
            this.sat.isNormalOperation() &&
            this.flexTemp >= this.sat.value - 10 &&
            this.thrustLimitType === 3;
          this.flexVisibility.set(showFlex ? 'visible' : 'hidden');
          this.textFlexTemp.set(Math.round(this.flexTemp).toString());
        } else {
          this.inactiveVisibility.set('visible');
          this.activeVisibility.set('hidden');
        }
      });
  }

  render(): VNode {
    return (
      <Layer x={698} y={28}>
        <g visibility={this.inactiveVisibility}>
          <text class="Large Center Amber" x={0} y={0}>
            XX
          </text>
          <text class="Large Center Amber" x={0} y={28}>
            XX
          </text>
        </g>
        <g visibility={this.activeVisibility}>
          <text class="Huge Center Cyan" x={0} y={-1}>
            {this.textThrustLimitType}
          </text>
          <text class="Huge End Green" x={5} y={28}>
            {this.textThrustLimitInt}
          </text>
          <text class="Large End Green" x={18} y={28}>
            .
          </text>
          <text class="Standard End Green" x={34} y={28}>
            {this.textThrustLimitFract}
          </text>
          <text class="Medium End Cyan" x={49} y={27}>
            %
          </text>

          <g visibility={this.flexVisibility}>
            <text class="Standard Cyan" x={-23} y={57}>
              {this.textFlexTemp}
              &deg;C
            </text>
          </g>
        </g>
      </Layer>
    );
  }
}
