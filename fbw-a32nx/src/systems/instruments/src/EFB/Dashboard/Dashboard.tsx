// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { FlightWidget } from './Widgets/FlightWidget';
import { RemindersWidget } from './Widgets/RemindersWidget';

export const Dashboard = () => (
    <div className="flex w-full space-x-8">
        <FlightWidget />
        <RemindersWidget />
    </div>
);
