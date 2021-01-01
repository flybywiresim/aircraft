import { useSimVar } from '@instruments/common/simVars';
import React, { memo } from 'react';

export const CrossTrack: React.FC<{ x: number, y: number}> = memo(({ x, y }) => {
    const [crossTrackError] = useSimVar('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', 250);

    let crossTrackText = '';
    let crossTrackAnchor = 'start';
    let crossTrackX = x;
    const crossTrackAbs = Math.abs(crossTrackError);

    if (crossTrackAbs > 0.02) {
        crossTrackText = crossTrackAbs.toFixed(crossTrackAbs < 0.3 ? 2 : 1);
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
        <text x={crossTrackX} y={y} textAnchor={crossTrackAnchor} fontSize={24} className="Green shadow">
            {crossTrackText}
        </text>
    );
});
