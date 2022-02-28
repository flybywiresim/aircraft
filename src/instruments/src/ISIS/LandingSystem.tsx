import React from 'react';

import { useInteractionSimVar, useSimVar } from '@instruments/common/simVars';

type DeviationIndicatorProps = {
    deviation: number,
    available: boolean
}

const DeviationIndicator: React.FC<DeviationIndicatorProps> = ({ deviation, available }) => (
    <>
        <rect x={0} y={0} width={200} height={20} fill="black" />
        <circle className="StrokeWhite NoFill" cx={10} cy={10} r={7} />
        <circle className="StrokeWhite NoFill" cx={55} cy={10} r={7} />
        <line x1={100} x2={100} y1={2} y2={18} strokeWidth={4} stroke="white" />
        <circle className="StrokeWhite NoFill" cx={145} cy={10} r={7} />
        <circle className="StrokeWhite NoFill" cx={190} cy={10} r={7} />
        { available
            && (
                <g transform={`translate(${(deviation * 50).toFixed(5)} 0)`}>
                    <path className="FillMagenta" d="M80,10 L100,2 L120,10 L100,18z" />
                </g>
            )}
    </>
);

export const LandingSystem: React.FC = () => {
    const [gsDeviation] = useSimVar('L:A32NX_RADIO_RECEIVER_GS_DEVIATION', 'number');
    const [gsAvailable] = useSimVar('L:A32NX_RADIO_RECEIVER_GS_IS_VALID', 'number');
    const [lsDeviation] = useSimVar('L:A32NX_RADIO_RECEIVER_LOC_DEVIATION', 'number');
    const [lsAvailable] = useSimVar('L:A32NX_RADIO_RECEIVER_LOC_IS_VALID', 'number');

    const [lsActive] = useInteractionSimVar('L:A32NX_ISIS_LS_ACTIVE', 'Boolean', 'H:A32NX_ISIS_LS_PRESSED');

    return (
        lsActive && (
            <g id="LandingSystem">
                <g transform="translate(156 380)">
                    <DeviationIndicator deviation={lsDeviation} available={lsAvailable} />
                </g>
                <g transform="translate(356 166) rotate(90 0 0)">
                    <DeviationIndicator deviation={gsDeviation} available={gsAvailable} />
                </g>
            </g>
        )
    );
};
