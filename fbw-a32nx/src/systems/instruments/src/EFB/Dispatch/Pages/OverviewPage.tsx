// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import React, { useState } from 'react';
import { A320Overview } from 'instruments/src/EFB/Dispatch/Pages/Overview/A320_251N/A320Overview';
import { A380Overview } from 'instruments/src/EFB/Dispatch/Pages/Overview/A380_842/A380Overview';
import { getAirframeType } from '../../Efb';

export const OverviewPage = () => {
    const [airframe] = useState(getAirframeType());
    switch ((airframe !== null ? airframe : 'A320_251N')) {
    case 'A320_251N':
        return (
            <A320Overview />
        );
    case 'A380_842':
        return (
            <A380Overview />
        );
    default:
        return (
            <A320Overview />
        );
    }
}
