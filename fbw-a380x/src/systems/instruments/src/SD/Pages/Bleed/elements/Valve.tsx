import React, { FC } from 'react';

interface ValveProps {
  x: number;
  y: number;
  radius: number;
  position: 'V' | 'H';
  css: string;
  sdacDatum: boolean;
}

const Valve: FC<ValveProps> = ({ x, y, radius, position, css, sdacDatum }) => (
  <g style={{ transform: `translate3d(${x}px, ${y}px, 0px)` }}>
    <circle cx={0} cy={0} r={radius} className={css} />
    {!sdacDatum ? (
      <text x={1} y={5} className="Small Amber Center NoFill">
        XX
      </text>
    ) : null}
    {sdacDatum && position === 'V' ? <path className={css} d={`M ${0},${-radius} l 0,${2 * radius}`} /> : null}
    {sdacDatum && position === 'H' ? <path className={css} d={`M ${-radius},${0} l ${2 * radius},0`} /> : null}
  </g>
);

export default Valve;
