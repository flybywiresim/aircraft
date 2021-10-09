import { MathUtils } from '@shared/MathUtils';
import React, { memo } from 'react';

export const TrackLine: React.FC<{ x: number, y: number, heading: number, track:number}> = memo(({ x, y, heading, track }) => {
    const rotate = MathUtils.diffAngle(heading, track);

    return (
        <g transform={`rotate(${rotate} ${x} ${y})`}>
            <line x1={384} y1={149} x2={x} y2={y} className="Green rounded" strokeWidth={2.5} />
        </g>
    );
});
