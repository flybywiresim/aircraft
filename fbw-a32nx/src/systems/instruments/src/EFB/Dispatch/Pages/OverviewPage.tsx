// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import React from 'react';
import { AircraftType, useSimVar } from '@flybywiresim/fbw-sdk';
import { A320Overview } from 'instruments/src/EFB/Dispatch/Pages/Overview/A320_251N/A320Overview';
import { A380Overview } from 'instruments/src/EFB/Dispatch/Pages/Overview/A380_842/A380Overview';

export const OverviewPage = () => {
    const [airframe] = useSimVar('L:A32NX_AIRCRAFT_TYPE', 'Enum');

    switch (airframe) {
    case AircraftType.A320_251N:
        return (
            <A320Overview />
        );
    case AircraftType.A380_842:
        return (
            <A380Overview />
        );
    default:
        return (
            <A320Overview />
        );
    }
};
