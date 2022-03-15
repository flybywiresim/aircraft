import React, { FC } from 'react';

interface ValveProps {
    x: number,
    y: number,
    radius: number,
    position: 'V' |'H',
    css: string,
    visible: boolean
}

const Valve: FC<ValveProps> = ({ x, y, radius, position, css, visible }) => (
    <g className={visible ? 'Show' : 'Hide'}>
        <circle cx={x} cy={y} r={radius} className={css} />
        {position === 'V'
            ? <path className={css} d={`M ${x},${y - radius} l 0,${2 * radius}`} />
            : <path className={css} d={`M ${x - radius},${y} l ${2 * radius},0`} />}
    </g>
);

export default Valve;
