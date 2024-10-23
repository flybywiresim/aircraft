import { Position, CargoDoorProps } from '@instruments/common/types';
import React from 'react';

const CargoDoor: React.FC<Position & CargoDoorProps> = ({ x, y, label, closed, width, height, engineRunning }) => {
  const doorOpen = !closed;
  const validSDAC = true;

  let cargoDoorMessage = '';
  if ((doorOpen && (engineRunning || label === 'AVNCS')) || !validSDAC) {
    cargoDoorMessage = label === 'AVNCS' ? `${label} ----` : `--${label}`;
  }

  return (
    <g id={`${label}-door`} transform={`translate(${x} ${y})`}>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx="4"
        className={!validSDAC || doorOpen ? 'Amber SW2' : 'Green SW2'}
      />
      <rect
        x={3}
        y={4}
        width={width - 6}
        height={height - 8}
        rx="4"
        className={!validSDAC || doorOpen ? 'Amber SW2 AmberFill' : 'Green SW2 NoFill'}
      />
      <text
        x={label === 'AVNCS' ? -160 : 35}
        y={label === 'AVNCS' ? 18 : 20}
        className={`${!validSDAC ? 'White' : 'AmberFill'} F24`}
      >
        {cargoDoorMessage}
      </text>
    </g>
  );
};

export default CargoDoor;
