import React from 'react';
import { Layer } from './Layer';

type ArrowProps = {
    x: number;
    y: number;
    width?: number;
    height?: number;
    angle?: number;
    length?: number
}

export const Arrow = ({ x, y, angle, width = 30, height = 30, length = 30 }: ArrowProps) => (
    <Layer x={x} y={y} angle={angle}>
        <polygon points={`0, ${-height / 2} ${width / 2}, 0 ${-width / 2}, 0`} fill="white" strokeLinejoin="round" />
        <line x1="0" y1="0" x2="0" y2={length} stroke="white" strokeWidth={6} />
    </Layer>
);
