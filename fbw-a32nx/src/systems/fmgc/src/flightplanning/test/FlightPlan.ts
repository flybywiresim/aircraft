// Copyright (c) 2021-2022, 2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/A320FlightPlanPerformanceData';
import { FpmConfig, FpmConfigs } from '@fmgc/flightplanning/FpmConfig';
import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';

export function emptyFlightPlan(fpmConfig: FpmConfig = FpmConfigs.A320_HONEYWELL_H3) {
  return FlightPlan.empty(
    { syncClientID: Math.round(Math.random() * 10_000_000), batchStack: [], fpmConfig },
    0,
    testEventBus,
    new A320FlightPlanPerformanceData(), // TODO make test-specific data or something
  );
}
