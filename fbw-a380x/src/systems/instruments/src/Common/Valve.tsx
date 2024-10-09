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
  <g>
    <circle cx={x} cy={y} r={radius} className={css} />
    {sdacDatum && position === 'V' ? <path className={css} d={`M ${x},${y - radius} l 0,${2 * radius}`} /> : null}
    {sdacDatum && position === 'H' ? <path className={css} d={`M ${x - radius},${y} l ${2 * radius},0`} /> : null}
  </g>
);

export default Valve;
