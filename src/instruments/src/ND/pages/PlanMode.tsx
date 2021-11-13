import React, { FC, memo, useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { EfisSide, NdSymbol } from '@shared/NavigationDisplay';
import { ToWaypointIndicator } from '../elements/ToWaypointIndicator';
import { FlightPlan } from '../elements/FlightPlan';
import { MapParameters } from '../utils/MapParameters';

export interface PlanModeProps {
    side: EfisSide,
    symbols: NdSymbol[],
    adirsAlign: boolean,
    rangeSetting: number,
    ppos: LatLongData,
    mapHidden: boolean,
}

export const PlanMode: FC<PlanModeProps> = ({ side, symbols, adirsAlign, rangeSetting, ppos, mapHidden }) => {
    const [planCentreLat] = useSimVar('L:A32NX_SELECTED_WAYPOINT_LAT', 'Degrees');
    const [planCentreLong] = useSimVar('L:A32NX_SELECTED_WAYPOINT_LONG', 'Degrees');

    const [trueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees');

    const [mapParams] = useState<MapParameters>(new MapParameters());

    useEffect(() => {
        mapParams.compute({ lat: planCentreLat, long: planCentreLong }, rangeSetting / 2, 250, 0);
    }, [planCentreLat, planCentreLong, rangeSetting]);

    return (
        <>
            <Overlay rangeSetting={rangeSetting} />

            <g id="map" clipPath="url(#plan-mode-map-clip)" visibility={mapHidden ? 'hidden' : 'visible'}>
                <FlightPlan
                    x={384}
                    y={384}
                    side={side}
                    symbols={symbols}
                    mapParams={mapParams}
                    mapParamsVersion={mapParams.version}
                    debug={false}
                />
            </g>

            {adirsAlign && !mapHidden && mapParams.valid && (
                <Plane location={ppos} heading={trueHeading} mapParams={mapParams} />
            )}

            <ToWaypointIndicator side={side} />
        </>
    );
};

interface OverlayProps {
    rangeSetting: number,
}

const Overlay: FC<OverlayProps> = memo(({ rangeSetting }) => (
    <>
        <clipPath id="plan-mode-map-clip">
            <polygon points="45,112 140,112 280,56 488,56 628,112 723,112 723,720 114,720 114,633 45,633" />
        </clipPath>
        <g strokeWidth={3}>
            <circle cx={384} cy={384} r={250} className="White" />

            <path d="M259,384a125,125 0 1,0 250,0a125,125 0 1,0 -250,0" strokeDasharray="14 13" className="White" />

            <text x={310} y={474} className="Cyan" fontSize={22}>{rangeSetting / 4}</text>
            <text x={212} y={556} className="Cyan" fontSize={22}>{rangeSetting / 2}</text>

            <text x={384} y={170} className="White" fontSize={25} textAnchor="middle" alignmentBaseline="central">N</text>
            <path d="M384,141.5 L390,151 L378,151 L384,141.5" fill="white" stroke="none" />

            <text x={598} y={384} className="White" fontSize={25} textAnchor="middle" alignmentBaseline="central">E</text>
            <path d="M626.2,384 L617,390 L617,378 L626.5,384" fill="white" stroke="none" />

            <text x={384} y={598} className="White" fontSize={25} textAnchor="middle" alignmentBaseline="central">S</text>
            <path d="M384,626.5 L390,617 L378,617 L384,626.5" fill="white" stroke="none" />

            <text x={170} y={384} className="White" fontSize={25} textAnchor="middle" alignmentBaseline="central">W</text>
            <path d="M141.5,384 L151,390 L151,378 L141.5,384" fill="white" stroke="none" />
        </g>
    </>
));

interface PlaneProps {
    location: Coordinates,
    heading: Degrees, // True
    mapParams: MapParameters,
}

const Plane: FC<PlaneProps> = ({ location, heading, mapParams }) => {
    const [x, y] = mapParams.coordinatesToXYy(location);
    const rotation = mapParams.rotation(heading);

    return (
        <g transform={`translate(${x} ${y}) rotate(${rotation} 384 384)`}>
            <image x={342} y={357} width={84} height={71} xlinkHref="/Images/ND/AIRPLANE.svg" />
        </g>
    );
};
