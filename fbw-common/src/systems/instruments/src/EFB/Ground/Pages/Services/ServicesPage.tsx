// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */
import React, { useState } from 'react';
import { getAirframeType } from '@flybywiresim/flypad';
import { A380Services } from './A380_842/A380Services';
import { A320Services } from './A320_251N/A320Services';

export const ServicesPage = () => {
    const [airframe] = useState(getAirframeType());

    switch (airframe) {
    case 'A380_842':
        return (
            <A380Services />
        );
    case 'A320_251N':
    default:
        return (
            <A320Services />
        );
    }
};
