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
    const dots = deviation / 0.4;

    const belowMinimum = dots < -2;
    const aboveMaximum = dots > 2;

    return (
        <>
            <rect x={0} y={0} width={176.6} height={20} fill="black" />
            <circle className="StrokeWhite NoFill" cx={15.011} cy={10} r={3} />
            <circle className="StrokeWhite NoFill" cx={51.655} cy={10} r={3} />
            <circle className="StrokeWhite NoFill" cx={124.944} cy={10} r={3} />
            <circle className="StrokeWhite NoFill" cx={161.588} cy={10} r={3} />
            { available && !(aboveMaximum || belowMinimum)
            && (// assumes 0.4 deg of deviation per dot and 36.644px distance between dots
                <g transform={`translate(${(dots * 36.644).toFixed(5)} 0)`}>
                    <path className="FillMagenta" d="M 74.95 10 v 0.8 l 8.3443 6.7 h 10.0132 l 8.3443 -6.7 v -1.6 l -8.3443 -6.7 h -10.0132 l -8.3443 6.7 z" />
                </g>
            )}
            { belowMinimum
            && (
                <path className="FillMagenta" d="M 0.883 10 v 0.8 l 8.3443 6.7 h 5.0066 v -15 h -5.0066 l -8.3443 6.7 z" />
            )}
            { aboveMaximum
            && (
                <path className="FillMagenta" d="M 175.72 10 v 0.8 l -8.3443 6.7 h -5.0066 v -15 h 5.0066 l 8.3443 6.7 z" />
            )}
            <line x1={88.3} x2={88.3} y1={2.5} y2={17.5} strokeWidth={5} stroke="yellow" />
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
                <g transform="translate(167.7 380)">
                    <DeviationIndicator deviation={lsDeviation / 2} available={lsAvailable} />
                </g>
                <g transform="translate(343 182.7) rotate(90 0 0)">
                    <DeviationIndicator deviation={gsDeviation} available={gsAvailable} />
                </g>
            </g>
        )
    );
};
