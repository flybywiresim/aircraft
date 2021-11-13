import React, { FC, memo, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { useCoherentEvent } from '@instruments/common/hooks';
import { EfisSide } from '@shared/NavigationDisplay';

export type ToWaypointIndicatorProps = {
    side: EfisSide,
}

export const ToWaypointIndicator: FC<ToWaypointIndicatorProps> = memo(({ side }) => {
    const [ident, setIdent] = useState<string | null>(null);
    const [bearing, setBearing] = useState<Degrees | null>(null);
    const [distance, setDistance] = useState<NauticalMiles | null>(null);
    const [eta, setEta] = useState<string | null>(null);

    // TODO replace with appropriate ARINC 429 labels
    useCoherentEvent(`A32NX_EFIS_${side}_TO_WPT_1`, (ident: string, bearing: string) => {
        setIdent(ident.substring(0, 8)); // EIS2 can only display 9 characters for the ident

        const parsedBearing = parseFloat(bearing);

        setBearing(Number.isNaN(parsedBearing) ? null : parsedBearing);
    });

    useCoherentEvent(`A32NX_EFIS_${side}_TO_WPT_2`, (distance: string, eta: string) => {
        const parsedDistance = parseFloat(distance);

        setDistance(Number.isNaN(parsedDistance) ? null : parsedDistance);

        setEta(eta);
    });

    let distanceFixed;
    let distanceIntegralPart;
    let distanceDecimalPart;

    /*
     * distance < 20nm: XX.Y NM
     * distance > 20nm: XXXX NM
     */
    if (!distance) {
        distanceFixed = '';
        distanceIntegralPart = '';
        distanceDecimalPart = '';
    } else if (distance < 20) {
        distanceFixed = distance.toFixed(1);
        [distanceIntegralPart, distanceDecimalPart] = distanceFixed.split('.');
    } else {
        distanceFixed = Math.round(Math.min(9999, distance));
    }

    // const heading = Avionics.Utils.clampAngle(GeoMath.correctMagvar(info.bearingInFp, info.magneticVariation));

    return (
        <Layer x={690} y={28}>
            {ident && (
                <text x={-9} y={0} fontSize={25} className="White" textAnchor="end">{ident}</text>
            )}

            {bearing && Number.isFinite(bearing) && (
                <>
                    <text x={54} y={0} fontSize={25} className="Green" textAnchor="end">{(Math.round(bearing)).toString().padStart(3, '0')}</text>
                    <text x={73} y={2} fontSize={25} className="Cyan" textAnchor="end">&deg;</text>
                </>
            )}

            {distance && Number.isFinite(distance) && (
                <>
                    {distance < 20 ? (
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
                </>
            )}

            {eta && (
                <text x={72} y={62} fontSize={25} className="Green" textAnchor="end">{eta}</text>
            )}
        </Layer>
    );
});
