// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */
import React from 'react';
import { AircraftType, useSimVar } from '@flybywiresim/fbw-sdk';
import { A380Services } from './Services/A380_842/A380Services';
import { A320Services } from './Services/A320_251N/A320Services';

export const ServicesPage = () => {
    const [airframe] = useSimVar('L:A32NX_AIRCRAFT_TYPE', 'Enum');

    switch (airframe) {
    case AircraftType.A380_842:
        return (
            <A380Services />
        );
    case AircraftType.A320_251N:
    default:
        return (
            <A320Services />
        );
    }
};
