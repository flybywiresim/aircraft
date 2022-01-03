import React, { FC, memo, useEffect, useState } from 'react';
import { useFlightPlanManager } from '@instruments/common/flightplan';
import { MathUtils } from '@shared/MathUtils';
import { useSimVar } from '@instruments/common/simVars';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { NdSymbol } from '@shared/NavigationDisplay';
import { LateralMode } from '@shared/autopilot';
import { CrossTrack } from '../elements/CrossTrack';
import { ToWaypointIndicator } from '../elements/ToWaypointIndicator';
import { FlightPlan, FlightPlanType } from '../elements/FlightPlan';
import { MapParameters } from '../utils/MapParameters';

export interface PlanModeProps {
    symbols: NdSymbol[],
    adirsAlign: boolean,
    rangeSetting: number,
    ppos: LatLongData,
    mapHidden: boolean,
}

export const PlanMode: FC<PlanModeProps> = ({ symbols, adirsAlign, rangeSetting, ppos, mapHidden }) => {
    const flightPlanManager = useFlightPlanManager();

    const [selectedWaypointIndex] = useSimVar('L:A32NX_SELECTED_WAYPOINT', 'number', 50);
    const [showTmpFplan] = useSimVar('L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN', 'bool');
    const [selectedWaypoint, setSelectedWaypoint] = useState<WayPoint>();
    const [trueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees');
    const [fmaLatMode] = useSimVar('L:A32NX_FMA_LATERAL_MODE', 'enum', 200);
    const [fmaLatArmed] = useSimVar('L:A32NX_FMA_LATERAL_ARMED', 'enum', 200);

    useEffect(() => {
        setSelectedWaypoint(flightPlanManager.getCurrentFlightPlan().waypoints[selectedWaypointIndex]);
    }, [selectedWaypointIndex]);

    const [mapParams] = useState(() => {
        const params = new MapParameters();
        params.compute(selectedWaypoint?.infos.coordinates ?? ppos, rangeSetting / 2, 250, 0);

        return params;
    });

    useEffect(() => {
        if (selectedWaypoint) {
            mapParams.compute(selectedWaypoint.infos.coordinates, rangeSetting / 2, 250, 0);
        }
    }, [selectedWaypoint?.infos.coordinates.lat, selectedWaypoint?.infos.coordinates.long, rangeSetting].map((n) => MathUtils.fastToFixed(n, 6)));

    let tmpFplan;
    if (showTmpFplan) {
        tmpFplan = (
            <FlightPlan
                x={384}
                y={384}
                flightPlanManager={flightPlanManager}
                mapParams={mapParams}
                symbols={symbols}
                debug={false}
                type={FlightPlanType.Temp}
            />
        );
    }

    return (
        <>
            <Overlay rangeSetting={rangeSetting} />

            <g id="map" clipPath="url(#plan-mode-map-clip)" visibility={mapHidden ? 'hidden' : 'visible'}>
                <FlightPlan
                    x={384}
                    y={384}
                    flightPlanManager={flightPlanManager}
                    mapParams={mapParams}
                    symbols={symbols}
                    debug={false}
                    type={
                        /* TODO FIXME: Check if intercepts active leg */
                        (fmaLatMode === LateralMode.NONE
                            || fmaLatMode === LateralMode.HDG
                            || fmaLatMode === LateralMode.TRACK)
                            && !fmaLatArmed
                            ? FlightPlanType.Dashed
                            : FlightPlanType.Nav
                    }
                />
                {tmpFplan}
            </g>

            {adirsAlign && !mapHidden && (
                <Plane location={ppos} heading={trueHeading} mapParams={mapParams} />
            )}

            <ToWaypointIndicator info={flightPlanManager.getCurrentFlightPlan().computeActiveWaypointStatistics(ppos)} />

            <CrossTrack x={44} y={690} isPlanMode />
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
