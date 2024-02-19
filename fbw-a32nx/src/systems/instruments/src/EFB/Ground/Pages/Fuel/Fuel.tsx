// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useState } from 'react';
import { AircraftType, Units, useSimVar } from '@flybywiresim/fbw-sdk';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { A320Fuel } from './A320_251N/A320Fuel';
import { A380Fuel } from './A380_842/A380Fuel';
import { useAppSelector } from '../../../Store/store';

export const Fuel = () => {
    const [airframe] = useSimVar('L:A32NX_AIRCRAFT_TYPE', 'Enum');
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 8_059);
    const simbriefUnits = useAppSelector((state) => state.simbrief.data.units);
    const simbriefPlanRamp = useAppSelector((state) => state.simbrief.data.fuels.planRamp);

    const simbriefDataLoaded = isSimbriefDataLoaded();

    const [massUnitForDisplay] = useState(Units.usingMetric ? 'KGS' : 'LBS');
    const [convertUnit] = useState(Units.usingMetric ? 1 : (1 / 0.4535934));

    switch (airframe) {
    case AircraftType.A380_842:
        return (
            <A380Fuel
                simbriefDataLoaded={simbriefDataLoaded}
                simbriefUnits={simbriefUnits}
                simbriefPlanRamp={simbriefPlanRamp}
                massUnitForDisplay={massUnitForDisplay}
                isOnGround={isOnGround}
            />
        );
    case AircraftType.A320_251N:
    default:
        return (
            <A320Fuel
                simbriefDataLoaded={simbriefDataLoaded}
                simbriefUnits={simbriefUnits}
                simbriefPlanRamp={simbriefPlanRamp}
                massUnitForDisplay={massUnitForDisplay}
                convertUnit={convertUnit}
                isOnGround={isOnGround}
            />
        );
    }
};
