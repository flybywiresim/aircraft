import React from 'react';
import { Layer } from './Layer';

type ArrowProps = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  angle?: number;
};

export const Arrows = ({ x, y, angle, width = 30, height = 30 }: ArrowProps) => (
  <Layer x={x} y={y} angle={angle}>
    <polygon points={`0, ${-height / 2} ${width / 2}, 0 ${-width / 2}, 0`} fill="white" strokeLinejoin="round" />
    <polygon
      points={`0, 0 ${width / 2}, ${height / 2} ${-width / 2}, ${height / 2}`}
      fill="white"
      strokeLinejoin="round"
    />
  </Layer>
);
