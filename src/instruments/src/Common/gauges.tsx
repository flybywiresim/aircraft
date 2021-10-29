import React, { FC, memo } from 'react';

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

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

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
