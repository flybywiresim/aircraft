// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { Layer, useSimVar } from '@flybywiresim/fbw-sdk';
import { ControlLaw } from '@fmgc/guidance/ControlLaws';

export const DebugInfo: React.FC = () => {
    const [law] = useSimVar('L:A32NX_FG_CURRENT_LATERAL_LAW', 'number', 1_000);
    const [xte] = useSimVar('L:A32NX_FG_CROSS_TRACK_ERROR', 'number', 100);
    const [tae] = useSimVar('L:A32NX_FG_TRACK_ANGLE_ERROR', 'number', 100);
    const [phi] = useSimVar('L:A32NX_FG_PHI_COMMAND', 'number', 100);

    return (
        <Layer>
            <text x={420} y={25} fontSize={24} fill="cyan" textAnchor="middle">debug</text>

            <text x={25} y={25} fontSize={22} fill="green">
                law:
                {' '}
                {law}
                {' '}
                {ControlLaw[law]}
            </text>
            <text x={25} y={50} fontSize={22} fill="red">
                xte:
                {' '}
                {xte}
            </text>
            <text x={25} y={75} fontSize={22} fill="red">
                tae:
                {' '}
                {tae}
            </text>
            <text x={25} y={100} fontSize={22} fill="red">
                phi:
                {' '}
                {phi}
            </text>

            <DebugLegs />
        </Layer>
    );
};

const DebugLegs: React.FC = () =>
// const currentFlightPlan = useCurrentFlightPlan();

    (
        <>
            {/* {currentFlightPlan.waypoints.map((waypoint: WayPoint, index) => <text x={25} y={150 + (index * 25)} fontSize={26} fill="yellow">{waypoint.ident}</text>)} */}
        </>
    );
