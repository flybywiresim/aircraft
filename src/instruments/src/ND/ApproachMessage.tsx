import React, { memo } from 'react';
import { Layer } from '@instruments/common/utils';
import { ApproachStats } from '@fmgc/flightplanning/data/flightplan';
import { normaliseApproachName } from '@instruments/common/flightplan';
import { FmgcFlightPhase } from '@shared/flightphase';

type ApproachMessageProps = {
    info?: ApproachStats,
    flightPhase: FmgcFlightPhase,
}

export const ApproachMessage: React.FC<ApproachMessageProps> = memo(({ info, flightPhase }) => {
    if (!info || flightPhase < FmgcFlightPhase.Cruise || (flightPhase === FmgcFlightPhase.Cruise && info.distanceFromPpos > 250)) {
        return null;
    }

    return (
        <Layer x={384} y={28}>
            <text x={0} y={0} fontSize={25} className="Green" textAnchor="middle">{normaliseApproachName(info.name)}</text>
        </Layer>
    );
});
