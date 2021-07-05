import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { calculateVerticalOffsetFromRoll, LagFilter } from './ISISUtils';

type SideslipIndicatorProps = {
    isOnGround: boolean;
    roll: number;
    deltaTime: number;
}

const SideslipIndicatorFilter = new LagFilter(0.8);

const SideslipIndicator: React.FC<SideslipIndicatorProps> = ({ isOnGround, roll, deltaTime }) => {
    const maxDeflection = 30;

    const [latAcc] = useSimVar('ACCELERATION BODY X', 'G Force');
    const accInG = Math.min(0.3, Math.max(-0.3, latAcc));
    let SIIndexOffset = -accInG * maxDeflection / 0.3;

    SIIndexOffset = SideslipIndicatorFilter.step(SIIndexOffset, deltaTime / 1000);

    return (
        <path strokeWidth={3} stroke="white" fill="#040405" id="SideSlipIndicator" transform={`translate(${SIIndexOffset} 0)`} d="M 244 138 h24 l 5 9 h -34 z" />
    );
};

type RollIndexProps = {
    isOnGround: boolean;
    roll: number;
    deltaTime: number
}

export const RollIndex: React.FC<RollIndexProps> = ({ isOnGround, roll, deltaTime }) => (
    <g id="RollIndex">
        <rect x={-256} y={-256} width={1024} height={394} className="sky" />
        <path strokeWidth={3} stroke="white" fill="#040405" d="M256 118 l10 18 h-20z" />
        <SideslipIndicator isOnGround={isOnGround} roll={roll} deltaTime={deltaTime} />
    </g>
);
