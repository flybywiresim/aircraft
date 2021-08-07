import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { LagFilter } from './ISISUtils';

const SideslipIndicatorFilter = new LagFilter(0.8);

const SideslipIndicator: React.FC = () => {
    const maxDeflection = 30;

    const [latAcc] = useSimVar('ACCELERATION BODY X', 'G Force', 500);
    const accInG = Math.min(0.3, Math.max(-0.3, latAcc.toFixed(2)));
    const sideslipIndicatorIndexOffset = SideslipIndicatorFilter.step(-accInG * maxDeflection / 0.3, 500 / 1000);

    return (
        <path id="SideSlipIndicator" className="StrokeWhite FillBackground" transform={`translate(${sideslipIndicatorIndexOffset} 0)`} d="M 244 138 h24 l 5 9 h -34 z" />
    );
};

export const RollIndex: React.FC = () => (
    <g id="RollIndex">
        <rect x={-256} y={-256} width={1024} height={394} className="sky" />
        <path className="StrokeWhite FillBackground" d="M256 118 l10 18 h-20z" />
        <SideslipIndicator />
    </g>
);
