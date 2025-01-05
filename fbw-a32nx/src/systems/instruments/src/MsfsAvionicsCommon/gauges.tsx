// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscribable, Subject, VNode } from '@microsoft/msfs-sdk';

import './gauges.scss';

export const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

/**
 * Draws an arc between startAngle and endAngle. This can start and finish anywhere on a circle
 * Note all arcs are drawn in a clockwise fashion
 *
 * @param x             x coordinate of arc centre
 * @param y             y coordinate of arc centre
 * @param radius        radius of arc
 * @param startAngle    value between 0 and 360 degrees where arc starts
 * @param endAngle      value between 0 and 360 degrees where arc finishes
 */
export const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const arcSize = startAngle > endAngle ? 360 - endAngle + startAngle : endAngle - startAngle;
  const largeArcFlag = arcSize <= 180 ? '0' : '1';

  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
};

export const valueRadianAngleConverter = (
  value: number,
  min: number,
  max: number,
  endAngle: number,
  startAngle: number,
  perpendicular: boolean = false,
) => {
  const valuePercentage = (value - min) / (max - min);
  const angle = perpendicular ? 0 : 90;
  const angleInDegress =
    startAngle > endAngle
      ? startAngle + valuePercentage * (360 - startAngle + endAngle) - angle
      : startAngle + valuePercentage * (endAngle - startAngle) - angle;
  const angleInRadians = angleInDegress * (Math.PI / 180.0);
  return {
    x: Math.cos(angleInRadians),
    y: Math.sin(angleInRadians),
    angle: angleInDegress,
  };
};

interface GaugeMarkerComponentProps {
  value: Subscribable<number>;
  x: number;
  y: number;
  min: number;
  max: number;
  radius: number;
  startAngle: Subscribable<number>;
  endAngle: Subscribable<number>;
  class: string | Subscribable<string>;
  textClass?: string;
  useCentralAlignmentBaseline?: boolean;
  showValue?: boolean;
  indicator?: boolean;
  outer?: boolean;
  multiplierOuter?: number;
  multiplierInner?: number;
  textNudgeX?: number;
  textNudgeY?: number;
  halfIndicator?: boolean;
  bold?: boolean;
  roundLinecap?: boolean;
}
export class GaugeMarkerComponent extends DisplayComponent<GaugeMarkerComponentProps> {
  private startX = Subject.create(0);

  private startY = Subject.create(0);

  private endX = Subject.create(0);

  private endY = Subject.create(0);

  private textX = Subject.create(0);

  private textY = Subject.create(0);

  private text = Subject.create('');

  private startAngle: number = 0;

  private endAngle: number = 0;

  private value: number = 0;

  constructor(props: GaugeMarkerComponentProps) {
    super(props);

    this.props.textClass ??= 'GaugeText';
    this.props.multiplierOuter ??= 1.15;
    this.props.multiplierInner ??= 0.85;

    this.startAngle = this.props.startAngle.get();
    this.endAngle = this.props.endAngle.get();
    this.value = this.props.value.get();
    this.update();
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.startAngle.sub((a) => {
      this.startAngle = a;
      this.update();
    });

    this.props.endAngle.sub((a) => {
      this.endAngle = a;
      this.update();
    });

    this.props.value.sub((v) => {
      this.value = v;
      this.update();
    });
  }

  update(): void {
    const dir = valueRadianAngleConverter(this.value, this.props.min, this.props.max, this.endAngle, this.startAngle);

    let start = {
      x: this.props.x + dir.x * this.props.radius * this.props.multiplierInner,
      y: this.props.y + dir.y * this.props.radius * this.props.multiplierInner,
    };
    let end = {
      x: this.props.x + dir.x * this.props.radius,
      y: this.props.y + dir.y * this.props.radius,
    };

    if (this.props.outer) {
      start = {
        x: this.props.x + dir.x * this.props.radius,
        y: this.props.y + dir.y * this.props.radius,
      };
      end = {
        x: this.props.x + dir.x * this.props.radius * this.props.multiplierOuter,
        y: this.props.y + dir.y * this.props.radius * this.props.multiplierOuter,
      };
    }

    if (this.props.indicator) {
      // Need case for EGT and other gauges which do not originate from the centre of the arc
      // In this case use original start definition
      if (!this.props.halfIndicator) {
        start = { x: this.props.x, y: this.props.y };
      }

      end = {
        x: this.props.x + dir.x * this.props.radius * this.props.multiplierOuter,
        y: this.props.y + dir.y * this.props.radius * this.props.multiplierOuter,
      };
    }

    // Text
    const pos = {
      x: this.props.x + dir.x * this.props.radius * this.props.multiplierInner + this.props.textNudgeX,
      y: this.props.y + dir.y * this.props.radius * this.props.multiplierInner + this.props.textNudgeY,
    };

    if (Number.isNaN(start.x)) {
      console.log(dir);
      console.log(this);
    }

    this.startX.set(start.x);
    this.startY.set(start.y);
    this.endX.set(end.x);
    this.endY.set(end.y);
    this.textX.set(pos.x);
    this.textY.set(pos.y);
    this.text.set(this.props.showValue ? Math.abs(this.value).toString() : '');
  }

  render(): VNode {
    return (
      <>
        <line
          x1={this.startX}
          y1={this.startY}
          x2={this.endX}
          y2={this.endY}
          strokeWidth={this.props.bold ? 2 : undefined}
          class={this.props.class}
          strokeLinecap={this.props.roundLinecap ? 'round' : 'square'}
        />
        <text
          x={this.textX}
          y={this.textY}
          class={this.props.textClass}
          alignmentBaseline={this.props.useCentralAlignmentBaseline ? 'central' : 'auto'}
          textAnchor="middle"
        >
          {this.text}
        </text>
      </>
    );
  }
}

interface GaugeMaxComponentProps {
  value: Subscribable<number>;
  x: number;
  y: number;
  min: number;
  max: number;
  radius: number;
  startAngle: Subscribable<number>;
  endAngle: Subscribable<number>;
  class: string;
}
export class GaugeMaxComponent extends DisplayComponent<GaugeMaxComponentProps> {
  private rectX = Subject.create(0);

  private rectY = Subject.create(0);

  private transform = Subject.create('');

  private startAngle: number = 0;

  private endAngle: number = 0;

  private value: number = 0;

  constructor(props: GaugeMaxComponentProps) {
    super(props);

    this.startAngle = this.props.startAngle.get();
    this.endAngle = this.props.endAngle.get();
    this.value = this.props.value.get();
    this.update();
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.startAngle.sub((a) => {
      this.startAngle = a;
      this.update();
    });

    this.props.endAngle.sub((a) => {
      this.endAngle = a;
      this.update();
    });

    this.props.value.sub((v) => {
      this.value = v;
      this.update();
    });
  }

  update(): void {
    const dir = valueRadianAngleConverter(this.value, this.props.min, this.props.max, this.endAngle, this.startAngle);

    const xy = { x: this.props.x + dir.x * this.props.radius, y: this.props.y + dir.y * this.props.radius };

    this.rectX.set(xy.x);
    this.rectY.set(xy.y);
    this.transform.set(`rotate(${dir.angle} ${xy.x} ${xy.y})`);
  }

  render(): VNode {
    return (
      <rect x={this.rectX} y={this.rectY} width={6} height={4} class={this.props.class} transform={this.transform} />
    );
  }
}

interface ThrottlePositionDonutComponentProps {
  value: Subscribable<number>;
  x: number;
  y: number;
  min: number;
  max: number;
  radius: number;
  startAngle: Subscribable<number>;
  endAngle: Subscribable<number>;
  class: string;
}
export class ThrottlePositionDonutComponent extends DisplayComponent<ThrottlePositionDonutComponentProps> {
  private circleX = Subject.create(0);

  private circleY = Subject.create(0);

  private startAngle: number = 0;

  private endAngle: number = 0;

  private value: number = 0;

  constructor(props: ThrottlePositionDonutComponentProps) {
    super(props);

    this.startAngle = this.props.startAngle.get();
    this.endAngle = this.props.endAngle.get();
    this.value = this.props.value.get();
    this.update();
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.startAngle.sub((a) => {
      this.startAngle = a;
      this.update();
    });

    this.props.endAngle.sub((a) => {
      this.endAngle = a;
      this.update();
    });

    this.props.value.sub((v) => {
      this.value = v;
      this.update();
    });
  }

  update(): void {
    const dir = valueRadianAngleConverter(this.value, this.props.min, this.props.max, this.endAngle, this.startAngle);

    this.circleX.set(dir.x * this.props.radius * 1.12);
    this.circleY.set(dir.y * this.props.radius * 1.12);
  }

  render(): VNode {
    return <circle cx={this.circleX} cy={this.circleY} r={4} class={this.props.class} />;
  }
}

interface GaugeComponentProps {
  x: number;
  y: number;
  radius: number;
  startAngle: Subscribable<number>;
  endAngle: Subscribable<number>;
  class: string;
  visible?: Subscribable<boolean>;
}
export class GaugeComponent extends DisplayComponent<GaugeComponentProps> {
  private arc = Subject.create('');

  private startAngle: number = 0;

  private endAngle: number = 0;

  constructor(props: GaugeComponentProps) {
    super(props);

    this.startAngle = this.props.startAngle.get();
    this.endAngle = this.props.endAngle.get();
    this.updateArc();
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.startAngle.sub((a) => {
      this.startAngle = a;
      this.updateArc();
    });

    this.props.endAngle.sub((a) => {
      this.endAngle = a;
      this.updateArc();
    });
  }

  updateArc(): void {
    this.arc.set(describeArc(this.props.x, this.props.y, this.props.radius, this.startAngle, this.endAngle));
  }

  render(): VNode {
    return (
      <g class="GaugeComponent" visibility={this.props.visible?.map((v) => (v ? 'inherit' : 'hidden')) ?? 'inherit'}>
        <path d={this.arc} class={this.props.class} />
        {this.props.children}
      </g>
    );
  }
}
