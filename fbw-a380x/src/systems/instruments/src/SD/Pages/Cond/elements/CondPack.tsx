import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '@instruments/common/Shapes';

interface CondPackProps {
    x: number,
    y: number,
    pack: number,
}

const CondPack: FC<CondPackProps> = ({ x, y, pack }) => {
    const [isPackOperative] = useSimVar(`L:A32NX_COND_PACK_${pack}_IS_OPERATING`, 'bool', 500);

    return (
        <g id={`CondPack-${pack}`}>
            <path className={`${isPackOperative ? 'Green' : 'Amber'} Line`} d={`M${x},${y} l 0,-70`} />
            <Triangle x={x} y={y - 88} colour={isPackOperative ? 'Green' : 'Amber'} fill={0} orientation={0} scale={1.1} />

            <text x={x - 35} y={y + 30} className={`F23 ${isPackOperative ? 'White' : 'Amber'}`}>PACK</text>
            <text x={x + 30} y={y + 30} className={`F26 ${isPackOperative ? 'Green' : 'Amber'}`}>{pack}</text>
        </g>
    );
};

export default CondPack;
