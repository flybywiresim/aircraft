// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import React from 'react';
import { getAirframeType } from '@flybywiresim/flypad';
import { A320Overview } from './Overview/A320_251N/A320Overview';
import { A380Overview } from './Overview/A380_842/A380Overview';

export const OverviewPage = () => {
    switch (getAirframeType()) {
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
};
