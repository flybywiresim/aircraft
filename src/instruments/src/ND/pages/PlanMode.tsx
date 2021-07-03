import React, { FC, useEffect, useState } from 'react';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { useFlightPlanManager } from '@instruments/common/flightplan';
import { MathUtils } from '@shared/MathUtils';
import { WayPoint } from '@fmgc/types/fstypes/FSTypes';
import { useSimVar } from '@instruments/common/simVars';
import { ToWaypointIndicator } from '../ToWaypointIndicator';
import { FlightPlan } from '../FlightPlan';
import { MapParameters } from '../utils/MapParameters';

export interface PlanModeProps {
    rangeSetting: number,
    ppos: LatLongData,
}

export const PlanMode: FC<PlanModeProps> = ({ rangeSetting, ppos }) => {
    const flightPlanManager = useFlightPlanManager();

    const [selectedWaypointIndex] = useSimVar('L:A32NX_SELECTED_WAYPOINT', 'number', 50);
    const [selectedWaypoint, setSelectedWaypoint] = useState<WayPoint>();

    useEffect(() => {
        setSelectedWaypoint(flightPlanManager.getCurrentFlightPlan().waypoints[selectedWaypointIndex]);
    }, [selectedWaypointIndex]);

    const [mapParams] = useState(() => {
        const params = new MapParameters();
        params.compute(selectedWaypoint?.infos.coordinates ?? ppos, rangeSetting * 2, 768, 0);

        return params;
    });

    useEffect(() => {
        if (selectedWaypoint) {
            mapParams.compute(selectedWaypoint.infos.coordinates, rangeSetting * 2, 768, 0);
        }
    }, [selectedWaypoint?.infos.coordinates.lat ?? 0, selectedWaypoint?.infos.coordinates.long ?? 0, 0, rangeSetting].map((n) => MathUtils.fastToFixed(n, 6)));

    return (
        <>
            <FlightPlan
                flightPlanManager={flightPlanManager}
                mapParams={mapParams}
                clipPath="url(#arc-mode-flight-plan-clip)"
                debug={false}
            />

            <Overlay rangeSetting={rangeSetting} />

            <ToWaypointIndicator info={flightPlanManager.getCurrentFlightPlan().computeActiveWaypointStatistics(ppos)} />
        </>
    );
};

interface OverlayProps {
    rangeSetting: number,
}

const Overlay: FC<OverlayProps> = ({ rangeSetting }) => (
    <g className="White" strokeWidth={3}>
        <circle cx={384} cy={384} r={250} />

        <path d="M259,384a125,125 0 1,0 250,0a125,125 0 1,0 -250,0" strokeDasharray="14 13" />

        <text x={310} y={474} className="Cyan" fontSize={22}>{rangeSetting}</text>
        <text x={212} y={556} className="Cyan" fontSize={22}>{rangeSetting / 2}</text>
    </g>
);
