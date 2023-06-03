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
            <rect x={0} y={0} width={200} height={20} fill="black" />
            <circle className="StrokeWhite NoFill" cx={17} cy={10} r={3} />
            <circle className="StrokeWhite NoFill" cx={58.5} cy={10} r={3} />
            <circle className="StrokeWhite NoFill" cx={141.5} cy={10} r={3} />
            <circle className="StrokeWhite NoFill" cx={183} cy={10} r={3} />
            { available && !(aboveMaximum || belowMinimum)
            && (// assumes 0.4 deg of deviation per dot and 41.5px distance between dots
                <g transform={`translate(${(dots * 41.5).toFixed(5)} 0)`}>
                    <path className="FillMagenta" d="M 84.88 10 v 0.8 l 9.45 6.7 h 11.34 l 9.45 -6.7 v -1.6 l -9.45 -6.7 h -11.34 l -9.45 6.7 z" />
                </g>
            )}
            { belowMinimum
            && (
                <path className="FillMagenta" d="M 1 10 v 0.8 l 9.45 6.7 h 5.67 v-15 h -5.67 l -9.45 6.7 z" />
            )}
            { aboveMaximum
            && (
                <path className="FillMagenta" d="M 199 10 v 0.8 l -9.45 6.7 h -5.67 v-15 h 5.67 l 9.45 6.7 z" />
            )}
            <line x1={100} x2={100} y1={2.5} y2={17.5} strokeWidth={5} stroke="yellow" />
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
                <g transform="translate(343 171) rotate(90 0 0)">
                    <DeviationIndicator deviation={gsLagfilter.step(gsDeviation, 50 / 1000)} available={gsAvailable} />
                </g>
            </g>
        )
    );
};
