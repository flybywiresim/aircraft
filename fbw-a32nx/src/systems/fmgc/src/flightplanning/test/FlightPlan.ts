// Copyright (c) 2021-2022, 2025-2026 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/A320FlightPlanPerformanceData';

export function emptyFlightPlan() {
  return FlightPlan.empty(
    { syncClientID: Math.round(Math.random() * 10_000_000), batchStack: [] },
    0,
    testEventBus,
    new A320FlightPlanPerformanceData(), // TODO make test-specific data or something
  );
}
