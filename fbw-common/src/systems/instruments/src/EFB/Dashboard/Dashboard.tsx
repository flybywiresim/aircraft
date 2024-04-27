// Copyright (c) 2023-2024 FlyByWire Simulations
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
