import React, { FC, memo } from 'react';
import { Layer } from '@instruments/common/utils';
import { ActiveWaypointInfo } from '@fmgc/flightplanning/data/waypoints';

export type ToWaypointIndicatorProps = {
    info?: ActiveWaypointInfo,
}

export const ToWaypointIndicator: FC<ToWaypointIndicatorProps> = memo(({ info }) => {
    if (!info) {
        return null;
    }

    const distanceFixed = info.distance.toFixed(1);
    const distanceIntegralPart = distanceFixed.substring(0, 1);
    const distanceDecimalPArt = distanceFixed.substring(2, 3);

    return (
        <Layer x={690} y={28}>
            <text x={-9} y={0} fontSize={25} className="White" textAnchor="end">{info.ident}</text>

            <text x={54} y={0} fontSize={25} className="Green" textAnchor="end">{(Math.round(info.bearing)).toString().padStart(3, '0')}</text>
            <text x={73} y={2} fontSize={25} className="Cyan" textAnchor="end">&deg;</text>

            <text x={8} y={30} fontSize={24} className="Green" textAnchor="end">{distanceIntegralPart}</text>
            <text x={8} y={30} fontSize={23} className="Green" textAnchor="start">.</text>
            <text x={22} y={30} fontSize={19} className="Green" textAnchor="start">{distanceDecimalPArt}</text>
            <text x={72} y={30} fontSize={18} className="Cyan" textAnchor="end">NM</text>
        </Layer>
    );
});
