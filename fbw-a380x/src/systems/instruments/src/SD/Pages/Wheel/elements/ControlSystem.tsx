import React, { FC } from 'react';

export enum ControlSystemType {
  Steering,
  Braking,
}

interface ControlSystemProps {
  x: number;
  y: number;
  number: 1 | 2 | 'E';
  type: ControlSystemType;
}

export const ControlSystem: FC<ControlSystemProps> = ({ x, y, number, type }) => (
  <g id={`control-indications-${type}-${number}`} transform={`translate(${x} ${y})`}>
    <path className="SW2 Grey NoFill" d="m 0 0 h 18 v -21" />
    <text className="F22 Green" x={3} y={-3}>
      {number}
    </text>
  </g>
);
