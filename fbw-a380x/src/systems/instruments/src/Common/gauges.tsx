import React, { FC, memo } from 'react';

import './gauges.scss';

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
 * @param sweep         value between 0 and 1 for sweep flag
 * @param largeArc      value between 0 and 1 for large arc flag
 */
export function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  sweep: number = 0,
  largeArc: number = 2,
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const arcSize = startAngle > endAngle ? 360 - endAngle + startAngle : endAngle - startAngle;
  if (largeArc === 2) {
    largeArc = arcSize <= 180 ? 0 : 1;
  }

  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArc, sweep, end.x, end.y].join(' ');
}

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
  showValue?: boolean;
  indicator?: boolean;
  outer?: boolean;
  multiplierOuter?: number;
  multiplierInner?: number;
  textNudgeX?: number;
  textNudgeY?: number;
  halfIndicator?: boolean;
  bold?: boolean;
  reverse?: boolean;
};

export const GaugeMarkerComponent: React.FC<GaugeMarkerComponentType> = ({
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
  showValue,
  indicator,
  outer,
  multiplierOuter = 1.15,
  multiplierInner = 0.85,
  textNudgeX = 0,
  textNudgeY = 0,
  bold,
  halfIndicator = false,
  reverse = false,
}) => {
  const dir = valueRadianAngleConverter({ value, min, max, endAngle, startAngle, perpendicular: reverse });

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
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} strokeWidth={bold ? 2 : undefined} className={className} />
      <text x={pos.x} y={pos.y} className={textClassName} alignmentBaseline="central" textAnchor="middle">
        {textValue}
      </text>
    </>
  );
};

export type GaugeComponentProps = {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  className: string;
  visible?: boolean;
  sweep?: number;
  largeArc?: number;
};

export const GaugeComponent: FC<GaugeComponentProps> = memo(
  ({ x, y, radius, startAngle, endAngle, className, children, visible, sweep, largeArc }) => {
    const d = describeArc(x, y, radius, startAngle, endAngle, sweep, largeArc);

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
  reverse?: boolean;
  outerMultiplier?: number;
  donutRadius?: number;
};

export const ThrottlePositionDonutComponent: FC<ThrottlePositionDonutComponentType> = memo(
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
    reverse = false,
    outerMultiplier = 1.12,
    donutRadius = 4,
  }) => {
    const dir = valueRadianAngleConverter({ value, min, max, endAngle, startAngle, perpendicular: reverse });

    x += dir.x * radius * outerMultiplier;
    y += dir.y * radius * outerMultiplier;

    return (
      <>
        <circle cx={x} cy={y} r={donutRadius} className={className} />
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

export const GaugeMaxEGTComponent: FC<GaugeMaxComponentType> = memo(
  ({ value, x, y, min, max, radius, startAngle, endAngle, className }) => {
    const dir = valueRadianAngleConverter({ value, min, max, endAngle, startAngle });

    const xy = {
      x: x + dir.x * radius,
      y: y + dir.y * radius,
    };

    return (
      <>
        <path
          d={`M ${xy.x - 6},${xy.y} l 12,0 l 0,4 l -8,0 Z`}
          className={className}
          transform={`rotate(${dir.angle} ${xy.x} ${xy.y})`}
        />
      </>
    );
  },
);

export type GaugeThrustComponentProps = {
  x: number;
  y: number;
  min: number;
  max: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  className: string;
  visible?: boolean;
  valueIdle: number;
  valueMax: number;
  reverse?: boolean;
};

export const GaugeThrustComponent: FC<GaugeThrustComponentProps> = memo(
  ({ x, y, radius, min, max, startAngle, endAngle, className, visible, valueIdle, valueMax, reverse = false }) => {
    const valueIdleDir = valueRadianAngleConverter({ value: valueIdle, min, max, endAngle, startAngle });
    const valueIdleEnd = {
      x: x + valueIdleDir.x * radius,
      y: y + valueIdleDir.y * radius,
    };
    const valueMaxDir = valueRadianAngleConverter({ value: valueMax, min, max, endAngle, startAngle });
    const valueMaxEnd = {
      x: x + valueMaxDir.x * radius,
      y: y + valueMaxDir.y * radius,
    };

    const ThrustPath = [
      `M ${x},${y} L ${valueIdleEnd.x},${valueIdleEnd.y}`,
      `A ${radius} ${radius} 0 ${reverse ? '0' : '1'} 1 ${valueMaxEnd.x} ${valueMaxEnd.y}`,
      `M ${valueMaxEnd.x} ${valueMaxEnd.y} L ${x},${y}`,
    ].join(' ');

    return (
      <>
        <g className="GaugeComponent">
          <g className={visible ? 'Show' : 'Hide'}>
            <path d={ThrustPath} className={className} />
          </g>
        </g>
      </>
    );
  },
);
