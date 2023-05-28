import React from 'react';

import { useInteractionSimVar, useSimVar } from '@instruments/common/simVars';
import { LagFilter } from 'instruments/src/ISIS/ISISUtils';

type DeviationIndicatorProps = {
    deviation: number,
    available: boolean
}

const locLagfilter = new LagFilter(1.5);
const gsLagfilter = new LagFilter(1.5);

const DeviationIndicator: React.FC<DeviationIndicatorProps> = ({ deviation, available }) => {
    const maxDeviation = 1.778; // the maximum position the diamond can be while still fully inside scale

    const dots = Math.sign(deviation) * Math.min(Math.abs(deviation / 0.4), maxDeviation);

    return (
        <>
            <rect x={0} y={0} width={200} height={20} fill="black" />
            <circle className="StrokeWhite NoFill" cx={10} cy={10} r={7} />
            <circle className="StrokeWhite NoFill" cx={55} cy={10} r={7} />
            <line x1={100} x2={100} y1={2} y2={18} strokeWidth={4} stroke="white" />
            <circle className="StrokeWhite NoFill" cx={145} cy={10} r={7} />
            <circle className="StrokeWhite NoFill" cx={190} cy={10} r={7} />
            { available
            && (// assumes 0.4 deg of deviation per dot and 45px distance between dots
                <g transform={`translate(${(dots * 45).toFixed(5)} 0)`}>
                    <path className="FillMagenta" d="M80,10 L100,2 L120,10 L100,18z" />
                </g>
            )}
        </>
    );
};
export const LandingSystem: React.FC = () => {
    const [gsDeviation] = useSimVar('L:A32NX_RADIO_RECEIVER_GS_DEVIATION', 'number', 50);
    const [gsAvailable] = useSimVar('L:A32NX_RADIO_RECEIVER_GS_IS_VALID', 'number', 50);
    const [lsDeviation] = useSimVar('L:A32NX_RADIO_RECEIVER_LOC_DEVIATION', 'number', 50);
    const [lsAvailable] = useSimVar('L:A32NX_RADIO_RECEIVER_LOC_IS_VALID', 'number', 50);

    const [lsActive] = useInteractionSimVar('L:A32NX_ISIS_LS_ACTIVE', 'Boolean', 'H:A32NX_ISIS_LS_PRESSED');

    return (
        lsActive && (
            <g id="LandingSystem">
                <g transform="translate(156 380)">
                    <DeviationIndicator deviation={locLagfilter.step(lsDeviation / 2, 50 / 1000)} available={lsAvailable} />
                </g>
                <g transform="translate(356 166) rotate(90 0 0)">
                    <DeviationIndicator deviation={gsLagfilter.step(gsDeviation, 50 / 1000)} available={gsAvailable} />
                </g>
            </g>
        )
    );
};
