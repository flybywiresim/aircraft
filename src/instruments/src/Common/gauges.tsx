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
    x: number,
    y: number,
    length: number,
    value: string | number,
    scaleMin?: number,
    scaleMax: number,
    className: string,
    dashOffset?: number,
    strokeWidth?: number
}

export const Needle: FC<NeedleProps> = memo(({ x, y, length, value, scaleMin = 0, scaleMax, className, dashOffset, strokeWidth }) => (
    <path
        className={className}
        strokeWidth={strokeWidth ?? 2}
        d={`M ${x} ${y} v -${length}`}
        transform={`rotate(${gaugeRotationFor(value, scaleMin, scaleMax)} ${x} ${y})`}
        strokeDashoffset={dashOffset}
        strokeDasharray={length}
    />
));

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians)),
    };
}

export function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const arcSize = startAngle > endAngle ? 360 - endAngle + startAngle : endAngle - startAngle;
    const largeArcFlag = arcSize <= 180 ? '0' : '1';

    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
}

export type ArcProps = {
    x: number,
    y: number,
    radius: number,
    toValue: number,
    scaleMin?: number,
    scaleMax: number,
    className: string,
    strokeWidth?: number
}

export const Arc: FC<ArcProps> = memo(({ x, y, radius, toValue, scaleMin = 0, scaleMax, className, strokeWidth }) => (
    <path
        className={className}
        strokeWidth={strokeWidth ?? 2.5}
        d={describeArc(x, y, radius, -90, gaugeRotationFor(toValue, scaleMin, scaleMax))}
    />
));

export type MarkProps = {
    x: number,
    y: number,
    value: number,
    scaleMin?: number,
    scaleMax: number,
    className: string,
    strokeWidth?: number
}

export const Mark: FC<MarkProps> = ({ x, y, value, scaleMin = 0, scaleMax, className, strokeWidth }) => (
    <path
        className={className}
        strokeWidth={strokeWidth ?? 2.5}
        d={`M ${x} ${y} m 0 -80 v -15`}
        transform={`rotate(${gaugeRotationFor(value, scaleMin, scaleMax)} ${x} ${y})`}
    />
);

export type VerticalNeedleProps = {
    x: number,
    y: number,
    height: number,
    side: 'left' | 'right',
    value: string | number,
    scaleMin?: number,
    scaleMax: number,
}

export const VerticalNeedle: FC<VerticalNeedleProps> = ({ x, y, height, side, value, scaleMin = 0, scaleMax }) => {
    const valueInScale = Math.max(scaleMin, Math.min(Number(value), scaleMax));
    const position = (valueInScale - scaleMin) / (scaleMax - scaleMin) * height;

    let path: string;
    if (side === 'left') {
        path = `M ${x + 1} ${y} m 0 -${position} l -22 9 l 0 -16 l 22 9 z`;
    } else {
        path = `M ${x - 1} ${y} m 0 -${position} l 22 9 l 0 -16 l -22 9 z`;
    }

    return (
        <path
            className="WhiteFill"
            d={path}
        />
    );
};

export type VerticalMarkProps = {
    x: number,
    y: number,
    height: number,
    value: number,
    scaleMin?: number,
    scaleMax: number,
    className?: string,
}

export const VerticalMark: FC<VerticalMarkProps> = ({ x, y, height, value, scaleMin = 0, scaleMax, className }) => {
    const valueInScale = Math.max(scaleMin, Math.min(Number(value), scaleMax));
    const position = (valueInScale - scaleMin) / (scaleMax - scaleMin) * height;

    return (
        <path
            className={className ?? 'White'}
            strokeWidth={2.5}
            d={`M ${x} ${y} m -15 -${position} h 30`}
        />
    );
};

export type VerticalSegmentProps = {
    x: number,
    y: number,
    height: number,
    rangeStart: number,
    rangeEnd: number,
    scaleMin?: number,
    scaleMax: number,
    className?: string,
}

export const VerticalSegment: FC<VerticalSegmentProps> = ({ x, y, height, rangeStart, rangeEnd, scaleMin = 0, scaleMax, className }) => {
    const rangeStartInScale = Math.max(scaleMin, Math.min(rangeStart, scaleMax));
    const startPosition = (rangeStartInScale - scaleMin) / (scaleMax - scaleMin) * height;

    const rangeEndInScale = Math.max(scaleMin, Math.min(rangeEnd, scaleMax));
    const endPosition = (rangeEndInScale - scaleMin) / (scaleMax - scaleMin) * height;

    return (
        <path
            className={className ?? 'White'}
            strokeWidth={2.5}
            d={`M ${x} ${y} M ${x} ${y - startPosition} L ${x} ${y - endPosition}`}
        />
    );
};

export function splitDecimals(value, type) {
    if (type === 'oil') {
        value = value * 0.01 * 25;
    } else if (type === 'vib') {
        value = value < 0 ? 0.0 : value;
    }
    const decimalSplit = value.toFixed(1).split('.', 2);
    return (decimalSplit);
};

export function valueRadianAngleConverter(value, min, max, endAngle, startAngle) {
    const valuePercentage = (value - min) / (max - min);
    // const start = startAngle > 180 ? 360 - startAngle : startAngle;
    let angleInRadians = startAngle > endAngle
        ? startAngle + (valuePercentage * (360 - startAngle + endAngle)) - 90
        : startAngle + (valuePercentage * (endAngle - startAngle)) - 90;
    // let angleInRadians = angleInRadiansOne > 359 ? 360 - angleInRadiansOne : angleInRadiansOne;
    console.log(`Angle is ${angleInRadians}`);
    angleInRadians *= (Math.PI / 180.0);
    console.log(`Angle is radians is ${angleInRadians}`);
    return ({
        x: Math.cos(angleInRadians),
        y: Math.sin(angleInRadians),
    });
};

type GaugeMarkerComponentType = {
    value: number,
    x: number,
    y: number,
    min: number,
    max: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    className: string,
    showValue?: boolean,
    indicator?: boolean,
    outer?: boolean,
    multiplier?: number,
};

const GaugeMarkerComponentNoMemo = ({ value, x, y, min, max, radius, startAngle, endAngle, className, showValue, indicator, outer, multiplier } : GaugeMarkerComponentType) => {
    const dir = valueRadianAngleConverter(value, min, max, endAngle, startAngle);

    if (typeof multiplier === 'undefined') multiplier = 1.15;

    let start = {
        x: x + (dir.x * radius * 0.9),
        y: y + (dir.y * radius * 0.9),
    };
    let end = {
        x: x + (dir.x * radius),
        y: y + (dir.y * radius),
    };

    if (outer) {
        start = {
            x: x + (dir.x * radius),
            y: y + (dir.y * radius),
        };
        end = {
            x: x + (dir.x * radius * multiplier),
            y: y + (dir.y * radius * multiplier),
        };
    }

    if (indicator) {
        start = { x, y };

        end = {
            x: x + (dir.x * radius * multiplier),
            y: y + (dir.y * radius * multiplier),
        };
    }

    // Text
    const multiplierX = value >= 8 ? 0.8 : 0.7;
    const multiplierY = value >= 8 ? 0.52 : 0.7;
    const pos = {
        x: x + (dir.x * (radius * multiplierX)),
        y: y + (dir.y * (radius * multiplierY)),
    };

    const textValue = !showValue ? '' : Math.abs(value).toString();

    return (
        <>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={className} />
            <text x={pos.x} y={pos.y} className={className} alignmentBaseline="central" textAnchor="middle">{textValue}</text>
        </>
    );
};
export const GaugeMarkerComponent = memo(GaugeMarkerComponentNoMemo);

type GaugeComponentProps = {
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    className: string,
    manMode: boolean,
    children?: React.ReactNode,
}

export const GaugeComponentNoMemo: FC<GaugeComponentProps> = ({ x, y, radius, startAngle, endAngle, className, children, manMode }) => {
    const d = describeArc(x, y, radius, startAngle, endAngle);

    return (
        <>
            <g id="HideOrShowGauge" className={manMode ? 'Show' : 'Hide'}>
                <path d={d} className={className} />
                <>{children}</>
            </g>
        </>
    );
};

export const GaugeComponent = React.memo(GaugeComponentNoMemo);
