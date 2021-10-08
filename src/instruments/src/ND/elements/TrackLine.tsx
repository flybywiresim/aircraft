import { useSimVar } from '@instruments/common/simVars';
import { MathUtils } from '@shared/MathUtils';
import React from 'react';

export const TrackLine: React.FC<{ x: number, y: number, heading: number, track:number}> = ({ x, y, heading, track }) => {
    const [apActive] = useSimVar('L:A32NX_AUTOPILOT_ACTIVE', 'bool');

    const rotate = MathUtils.diffAngle(heading, track);

    return (apActive
        && (
            <g transform={`rotate(${rotate} ${x} ${y})`}>
                <line x1={384} y1={149} x2={x} y2={y} className="Green rounded" strokeWidth={2.5} />
            </g>
        )
    );
};
