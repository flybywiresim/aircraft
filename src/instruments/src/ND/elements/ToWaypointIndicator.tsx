import React, { FC, memo } from 'react';
import { Layer } from '@instruments/common/utils';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { GeoMath } from '@fmgc/flightplanning/GeoMath';

export type ToWaypointIndicatorProps = {
    info?: WaypointStats,
}

export const ToWaypointIndicator: FC<ToWaypointIndicatorProps> = memo(({ info }) => {
    if (!info) {
        return null;
    }

    let distanceFixed;
    let distanceIntegralPart;
    let distanceDecimalPart;

    /*
     * distance < 20nm: XX.Y NM
     * distance > 20nm: XXXX NM
     */
    if (info.distanceFromPpos < 20) {
        distanceFixed = info.distanceFromPpos.toFixed(1);
        [distanceIntegralPart, distanceDecimalPart] = distanceFixed.split('.');
    } else {
        distanceFixed = Math.round(Math.min(9999, info.distanceFromPpos));
    }

    let timeText;
    if (info.etaFromPpos) {
        const timeMinutes = Math.floor(info.timeFromPpos / 60).toString().padStart(2, '0');
        const timeSeconds = Math.floor(info.timeFromPpos % 60).toString().padStart(2, '0');

        timeText = `${timeMinutes}:${timeSeconds}`;
    } else {
        timeText = '--:--';
    }

    const heading = Avionics.Utils.clampAngle(GeoMath.correctMagvar(info.bearingInFp, info.magneticVariation));

    return (
        <Layer x={690} y={28}>
            {/* EIS2 can only display 9 characters for this ident */}
            <text x={-9} y={0} fontSize={25} className="White" textAnchor="end">{info.ident.substring(0, 8)}</text>

            <text x={54} y={0} fontSize={25} className="Green" textAnchor="end">{(Math.round(heading)).toString().padStart(3, '0')}</text>
            <text x={73} y={2} fontSize={25} className="Cyan" textAnchor="end">&deg;</text>

            {info.distanceFromPpos < 20 ? (
                <>
                    <text x={8} y={30} fontSize={24} className="Green" textAnchor="end">{distanceIntegralPart}</text>
                    <text x={8} y={30} fontSize={23} className="Green" textAnchor="start">.</text>
                    <text x={22} y={30} fontSize={19} className="Green" textAnchor="start">{distanceDecimalPart}</text>
                </>
            ) : (
                <>
                    <text x={34} y={30} fontSize={24} className="Green" textAnchor="end">{distanceFixed}</text>
                </>
            )}

            <text x={72} y={30} fontSize={18} className="Cyan" textAnchor="end">NM</text>

            <text x={72} y={62} fontSize={25} className="Green" textAnchor="end">{timeText}</text>
        </Layer>
    );
});
