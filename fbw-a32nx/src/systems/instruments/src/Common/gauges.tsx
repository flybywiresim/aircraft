// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, memo } from 'react';

import './gauges.scss';

/**
 * Calculates the rotation needed to position an item at a certain value mark on a half-circle gauge
 *
 * @param value     the desired value
 * @param scaleMin  the lower bound of the half-circle gauge. Defaults to 0
 * @param scaleMax  the upper bound of the half-circle gauge.
 */
function gaugeRotationFor(value, scaleMin = 0, scaleMax) {
  return -90 + ((Math.min(scaleMax, Number(value)) - scaleMin) / (scaleMax - scaleMin)) * 180;
}

export type NeedleProps = {
  x: number;
  y: number;
  length: number;
  value: string | number;
  scaleMin?: number;
  scaleMax: number;
  className: string;
  dashOffset?: number;
  strokeWidth?: number;
};

export const Needle: FC<NeedleProps> = memo(
  ({ x, y, length, value, scaleMin = 0, scaleMax, className, dashOffset, strokeWidth }) => (
    <path
      className={className}
      strokeWidth={strokeWidth ?? 2}
      d={`M ${x} ${y} v -${length}`}
      transform={`rotate(${gaugeRotationFor(value, scaleMin, scaleMax)} ${x} ${y})`}
      strokeDashoffset={dashOffset}
      strokeDasharray={length}
    />
  ),
);

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

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
export function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const arcSize = startAngle > endAngle ? 360 - endAngle + startAngle : endAngle - startAngle;
  const largeArcFlag = arcSize <= 180 ? '0' : '1';

  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

export type ArcProps = {
  x: number;
  y: number;
  radius: number;
  toValue: number;
  scaleMin?: number;
  scaleMax: number;
  className: string;
  strokeWidth?: number;
};

export const Arc: FC<ArcProps> = memo(({ x, y, radius, toValue, scaleMin = 0, scaleMax, className, strokeWidth }) => (
  <path
    className={className}
    strokeWidth={strokeWidth ?? 2.5}
    d={describeArc(x, y, radius, -90, gaugeRotationFor(toValue, scaleMin, scaleMax))}
  />
));

export type MarkProps = {
  x: number;
  y: number;
  value: number;
  scaleMin?: number;
  scaleMax: number;
  className: string;
  strokeWidth?: number;
};

export const Mark: FC<MarkProps> = ({ x, y, value, scaleMin = 0, scaleMax, className, strokeWidth }) => (
  <path
    className={className}
    strokeWidth={strokeWidth ?? 2.5}
    d={`M ${x} ${y} m 0 -80 v -15`}
    transform={`rotate(${gaugeRotationFor(value, scaleMin, scaleMax)} ${x} ${y})`}
  />
);

export type VerticalNeedleProps = {
  x: number;
  y: number;
  height: number;
  side: 'left' | 'right';
  value: string | number;
  scaleMin?: number;
  scaleMax: number;
};

export const VerticalNeedle: FC<VerticalNeedleProps> = ({ x, y, height, side, value, scaleMin = 0, scaleMax }) => {
  const valueInScale = Math.max(scaleMin, Math.min(Number(value), scaleMax));
  const position = ((valueInScale - scaleMin) / (scaleMax - scaleMin)) * height;

  let path: string;
  if (side === 'left') {
    path = `M ${x + 1} ${y} m 0 -${position} l -22 9 l 0 -16 l 22 9 z`;
  } else {
    path = `M ${x - 1} ${y} m 0 -${position} l 22 9 l 0 -16 l -22 9 z`;
  }

  return <path className="WhiteFill" d={path} />;
};

export type VerticalMarkProps = {
  x: number;
  y: number;
  height: number;
  value: number;
  scaleMin?: number;
  scaleMax: number;
  className?: string;
};

export const VerticalMark: FC<VerticalMarkProps> = ({ x, y, height, value, scaleMin = 0, scaleMax, className }) => {
  const valueInScale = Math.max(scaleMin, Math.min(Number(value), scaleMax));
  const position = ((valueInScale - scaleMin) / (scaleMax - scaleMin)) * height;

  return <path className={className ?? 'White'} strokeWidth={2.5} d={`M ${x} ${y} m -15 -${position} h 30`} />;
};

export type VerticalSegmentProps = {
  x: number;
  y: number;
  height: number;
  rangeStart: number;
  rangeEnd: number;
  scaleMin?: number;
  scaleMax: number;
  className?: string;
};

export const VerticalSegment: FC<VerticalSegmentProps> = ({
  x,
  y,
  height,
  rangeStart,
  rangeEnd,
  scaleMin = 0,
  scaleMax,
  className,
}) => {
  const rangeStartInScale = Math.max(scaleMin, Math.min(rangeStart, scaleMax));
  const startPosition = ((rangeStartInScale - scaleMin) / (scaleMax - scaleMin)) * height;

  const rangeEndInScale = Math.max(scaleMin, Math.min(rangeEnd, scaleMax));
  const endPosition = ((rangeEndInScale - scaleMin) / (scaleMax - scaleMin)) * height;

  return (
    <path
      className={className ?? 'White'}
      strokeWidth={2.5}
      d={`M ${x} ${y} M ${x} ${y - startPosition} L ${x} ${y - endPosition}`}
    />
  );
};

export const splitDecimals = (value: number) => value.toFixed(1).split('.', 2);

type valueRadianAngleConverterType = {
  value: number;
  min: number;
  max: number;
  endAngle: number;
  startAngle: number;
  perpendicular?: boolean;
};

export const valueRadianAngleConverter = ({
  value,
  min,
  max,
  endAngle,
  startAngle,
  perpendicular = false,
}: valueRadianAngleConverterType) => {
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

export type GaugeMarkerComponentType = {
  value: number;
  x: number;
  y: number;
  min: number;
  max: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  className: string;
  textClassName?: string;
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
};

export const GaugeMarkerComponent: FC<GaugeMarkerComponentType> = memo(
  ({
    value,
    x,
    y,
    min,
    max,
    radius,
    startAngle,
    endAngle,
    className,
    textClassName = 'GaugeText',
    useCentralAlignmentBaseline = true,
    showValue,
    indicator,
    outer,
    multiplierOuter = 1.15,
    multiplierInner = 0.85,
    textNudgeX = 0,
    textNudgeY = 0,
    bold,
    halfIndicator = false,
    roundLinecap = false,
  }) => {
    const dir = valueRadianAngleConverter({ value, min, max, endAngle, startAngle });

    let start = {
      x: x + dir.x * radius * multiplierInner,
      y: y + dir.y * radius * multiplierInner,
    };
    let end = {
      x: x + dir.x * radius,
      y: y + dir.y * radius,
    };

    if (outer) {
      start = {
        x: x + dir.x * radius,
        y: y + dir.y * radius,
      };
      end = {
        x: x + dir.x * radius * multiplierOuter,
        y: y + dir.y * radius * multiplierOuter,
      };
    }

    if (indicator) {
      // Need case for EGT and other gauges which do not originate from the centre of the arc
      // In this case use original start definition
      if (!halfIndicator) {
        start = { x, y };
      }

      end = {
        x: x + dir.x * radius * multiplierOuter,
        y: y + dir.y * radius * multiplierOuter,
      };
    }

    // Text
    const pos = {
      x: x + dir.x * radius * multiplierInner + textNudgeX,
      y: y + dir.y * radius * multiplierInner + textNudgeY,
    };

    const textValue = !showValue ? '' : Math.abs(value).toString();

    return (
      <>
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          strokeWidth={bold ? 2 : undefined}
          className={className}
          strokeLinecap={roundLinecap ? 'round' : 'square'}
        />
        <text
          x={pos.x}
          y={pos.y}
          className={textClassName}
          alignmentBaseline={useCentralAlignmentBaseline ? 'central' : 'auto'}
          textAnchor="middle"
        >
          {textValue}
        </text>
      </>
    );
  },
);

export type GaugeComponentProps = {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  className: string;
  visible?: boolean;
};

export const GaugeComponent: FC<GaugeComponentProps> = memo(
  ({ x, y, radius, startAngle, endAngle, className, children, visible }) => {
    const d = describeArc(x, y, radius, startAngle, endAngle);

    return (
      <>
        <g className="GaugeComponent">
          <g className={visible ? 'Show' : 'Hide'}>
            <path d={d} className={className} />
            <>{children}</>
          </g>
        </g>
      </>
    );
  },
);

type ThrottlePositionDonutComponentType = {
  value: number;
  x: number;
  y: number;
  min: number;
  max: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  className: string;
};

export const ThrottlePositionDonutComponent: FC<ThrottlePositionDonutComponentType> = memo(
  ({ value, x, y, min, max, radius, startAngle, endAngle, className }) => {
    const dir = valueRadianAngleConverter({ value, min, max, endAngle, startAngle });

    x += dir.x * radius * 1.12;
    y += dir.y * radius * 1.12;

    return (
      <>
        <circle cx={x} cy={y} r={4} className={className} />
      </>
    );
  },
);

type GaugeMaxComponentType = {
  value: number;
  x: number;
  y: number;
  min: number;
  max: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  className: string;
};

export const GaugeMaxComponent: FC<GaugeMaxComponentType> = memo(
  ({ value, x, y, min, max, radius, startAngle, endAngle, className }) => {
    const dir = valueRadianAngleConverter({ value, min, max, endAngle, startAngle });

    const xy = {
      x: x + dir.x * radius,
      y: y + dir.y * radius,
    };

    return (
      <>
        <rect
          x={xy.x}
          y={xy.y}
          width={6}
          height={4}
          className={className}
          transform={`rotate(${dir.angle} ${xy.x} ${xy.y})`}
        />
      </>
    );
  },
);
