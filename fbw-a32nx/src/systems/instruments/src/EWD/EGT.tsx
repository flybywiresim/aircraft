// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { GaugeComponent, GaugeMarkerComponent, GaugeMaxComponent } from '../MsfsAvionicsCommon/gauges';
import { Layer } from '../MsfsAvionicsCommon/Layer';

import './style.scss';

interface EgtProps {
  bus: EventBus;
  x: number;
  y: number;
  engine: 1 | 2;
}
export class Egt extends DisplayComponent<EgtProps> {
  private readonly gaugeStartAngle = Subject.create(270);

  private readonly gaugeStartAngleRed = Subject.create(70);

  private readonly gaugeEndAngle = Subject.create(90);

  private inactiveVisibility = Subject.create('hidden');

  private activeVisibility = Subject.create('hidden');

  private thrustLimitType: number = 0;

  private autoThrustWarningToga: boolean = false;

  private egt: number = 0;

  private egtIndicatorClass = Subject.create('');

  private egtText = Subject.create('');

  private egtValue = Subject.create(0);

  private egtClass = Subject.create('');

  private egtMaxValue = Subject.create(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

    sub
      .on(`engine${this.props.engine}Fadec`)
      .whenChanged()
      .handle((f) => {
        this.inactiveVisibility.set(f ? 'hidden' : 'visible');
        this.activeVisibility.set(f ? 'visible' : 'hidden');
      });

    sub
      .on('thrustLimitType')
      .whenChanged()
      .handle((t) => {
        this.thrustLimitType = t;
      });

    sub
      .on('autoThrustWarningToga')
      .whenChanged()
      .handle((t) => {
        this.autoThrustWarningToga = t;
      });

    sub
      .on(`engine${this.props.engine}EGT`)
      .whenChanged()
      .handle((egt) => {
        this.egt = egt;
        this.egtValue.set(egt);
      });

    sub
      .on('realTime')
      .atFrequency(10)
      .handle((_t) => {
        this.egtMaxValue.set(this.egtMax);
        this.egtText.set(Math.round(this.egt).toString());
        this.egtClass.set(`Large End ${this.egtColor}`);
        this.egtIndicatorClass.set(`GaugeIndicator Gauge ${this.egtColor}`);
      });
  }

  get egtMax(): number {
    switch (this.thrustLimitType) {
      case 4:
        return this.autoThrustWarningToga ? 1060 : 1025;

      case 1:
      case 2:
      case 3:
      case 5:
        return 1025;

      default:
        return 750;
    }
  }

  get egtColor(): string {
    if (this.egt > 1060) {
      return 'Red';
    }
    if (this.egt > this.egtMax) {
      return 'Amber';
    }
    return 'Green';
  }

  render(): VNode {
    const min = 0;
    const max = 1200;
    const radius = 61;

    return (
      <Layer x={this.props.x} y={this.props.y}>
        <g visibility={this.inactiveVisibility}>
          <GaugeComponent
            x={0}
            y={0}
            radius={radius}
            startAngle={this.gaugeStartAngle}
            endAngle={this.gaugeEndAngle}
            class="GaugeComponent GaugeInactive"
          />
          <text class="Large End Amber" x={20} y={6}>
            XX
          </text>
        </g>
        <g visibility={this.activeVisibility}>
          <text class={this.egtClass} x={35} y={6}>
            {this.egtText}
          </text>
          <GaugeComponent
            x={0}
            y={0}
            radius={radius}
            startAngle={this.gaugeStartAngle}
            endAngle={this.gaugeEndAngle}
            class="GaugeComponent Gauge"
          >
            <GaugeComponent
              x={0}
              y={0}
              radius={radius}
              startAngle={this.gaugeStartAngleRed}
              endAngle={this.gaugeEndAngle}
              class="GaugeComponent Gauge RedLine"
            />

            <GaugeMarkerComponent
              value={Subject.create(min)}
              x={0}
              y={0}
              min={min}
              max={max}
              radius={radius}
              startAngle={this.gaugeStartAngle}
              endAngle={this.gaugeEndAngle}
              class="GaugeText Gauge Medium"
            />
            <GaugeMarkerComponent
              value={Subject.create(600)}
              x={0}
              y={0}
              min={min}
              max={max}
              radius={radius}
              startAngle={this.gaugeStartAngle}
              endAngle={this.gaugeEndAngle}
              class="GaugeText Gauge"
            />
            <GaugeMarkerComponent
              value={Subject.create(max)}
              x={0}
              y={0}
              min={min}
              max={max}
              radius={radius}
              startAngle={this.gaugeStartAngle}
              endAngle={this.gaugeEndAngle}
              class="GaugeText Gauge RedLine"
            />

            <GaugeMarkerComponent
              value={this.egtMaxValue}
              x={0}
              y={0}
              min={min}
              max={max}
              radius={radius}
              startAngle={this.gaugeStartAngle}
              endAngle={this.gaugeEndAngle}
              class="GaugeThrustLimitIndicator Gauge"
            />
            <GaugeMaxComponent
              value={this.egtMaxValue}
              x={0}
              y={0}
              min={min}
              max={max}
              radius={radius}
              startAngle={this.gaugeStartAngle}
              endAngle={this.gaugeEndAngle}
              class="GaugeThrustLimitIndicatorFill Gauge"
            />

            <rect x={-34} y={-16} width={69} height={24} class="DarkGreyBox" />

            <GaugeMarkerComponent
              value={this.egtValue}
              x={0}
              y={0}
              min={min}
              max={max}
              radius={radius}
              startAngle={this.gaugeStartAngle}
              endAngle={this.gaugeEndAngle}
              class={this.egtIndicatorClass}
              multiplierInner={0.6}
              multiplierOuter={1.08}
              indicator
              halfIndicator
              roundLinecap
            />
          </GaugeComponent>
        </g>
      </Layer>
    );
  }
}
