import { useSimVar } from '@instruments/common/simVars';
import { EfisSide } from '@shared/NavigationDisplay';
import React from 'react';

interface CrossTrackProps {
    x: number,
    y: number,
    isPlanMode?: boolean,
    side: EfisSide,
}

export const CrossTrack: React.FC<CrossTrackProps> = ({ x, y, isPlanMode, side }) => {
    const [crossTrackError] = useSimVar('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', 250);
    const [rnp] = useSimVar(`L:A32NX_FMGC_${side}_RNP`, 'number');

    let crossTrackText = '';
    let crossTrackAnchor = 'start';
    let crossTrackX = x;
    const crossTrackAbs = Math.min(99.9, Math.abs(crossTrackError));

    if (rnp > 0 && rnp <= (0.3 + Number.EPSILON) && crossTrackAbs >= (0.02 - Number.EPSILON) && crossTrackAbs < (0.3 + Number.EPSILON)) {
        crossTrackText = crossTrackAbs.toFixed(2);
    } else if (crossTrackAbs >= 0.1) {
        crossTrackText = crossTrackAbs.toFixed(1);
    }

    if (crossTrackText.length > 0) {
        if (crossTrackError < 0) {
            crossTrackText += 'R';
            crossTrackAnchor = 'start';
            crossTrackX = x + 34;
        } else {
            crossTrackText += 'L';
            crossTrackAnchor = 'end';
            crossTrackX = x - 38;
        }
    }

    return (
        <text x={isPlanMode ? x : crossTrackX} y={y} textAnchor={isPlanMode ? 'start' : crossTrackAnchor} fontSize={24} className="Green shadow">
            {crossTrackText}
        </text>
    );
};
