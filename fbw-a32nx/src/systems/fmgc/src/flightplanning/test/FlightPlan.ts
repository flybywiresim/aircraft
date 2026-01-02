// Copyright (c) 2021-2022, 2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/A320FlightPlanPerformanceData';

const bus = new EventBus();

export function emptyFlightPlan() {
  return FlightPlan.empty(
    { syncClientID: Math.round(Math.random() * 10_000_000), batchStack: [] },
    0,
    bus,
    new A320FlightPlanPerformanceData(), // TODO make test-specific data or something
  );
}
