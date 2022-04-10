import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '../../../Common/Shapes';

interface RATProps {
    x: number,
    y: number,
}

const RAT = ({ x, y }: RATProps) => {
    const [RatStowed] = useSimVar('L:A32NX_HYD_RAT_STOW_POSITION', 'percent over 100', 500);

    return (
        <>
            <text className="RatPtuElec FillWhite" x={x - 42} y={y + 180} alignmentBaseline="central">RAT</text>
            <line className={`GreenLine ${RatStowed > 0.1 ? '' : 'Hide'}`} x1={x} y1={y + 180} x2={x + 10} y2={y + 180} />
            <Triangle x={x} y={y + 180} colour={RatStowed > 0.1 ? 'Green' : 'White'} fill={RatStowed > 0.1 ? 1 : 0} orientation={90} />
        </>
    );
};

export default RAT;
