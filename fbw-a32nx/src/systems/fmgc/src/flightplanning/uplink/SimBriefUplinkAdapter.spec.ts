// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { SimBriefUplinkAdapter } from '@fmgc/flightplanning/uplink/SimBriefUplinkAdapter';
import { dumpFlightPlan } from '@fmgc/flightplanning/test/FlightPlan';
import { beforeEach, describe, expect, it } from 'vitest';
import { EventBus } from '@microsoft/msfs-sdk';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { testFms } from '@fmgc/flightplanning/test/TestFms';

describe('simBrief uplink adapter', () => {
  const eventBus = new EventBus();
  const fps = new FlightPlanService(eventBus, new A320FlightPlanPerformanceData());

  beforeEach(() => {
    fps.reset();
    setupTestDatabase();
  });

  it('tracer test', async ({ skip }) => {
    skip();
    await fps.newCityPair('NZWN', 'NZQN', 'NZAA');

    await fps.setDestinationRunway('NZQN23');
    await fps.setArrival('ELRU4B');
    await fps.setApproach('R23-Z');
    await fps.setApproachVia('ATKIL');

    console.log(dumpFlightPlan(fps.activeOrTemporary));
  });

  it('can download an OFP', async ({ skip }) => {
    skip();
    const ofp = await SimBriefUplinkAdapter.downloadOfpForUserID('506130');

    expect(ofp).not.toBeFalsy();

    const route = SimBriefUplinkAdapter.getRouteFromOfp(ofp);

    console.log(route);
  });

  it('can uplink a flight plan from a downloaded ofp', async ({ skip }) => {
    skip();
    const ofp = await SimBriefUplinkAdapter.downloadOfpForUserID('506130');
    await SimBriefUplinkAdapter.uplinkFlightPlanFromSimbrief(testFms, fps, ofp, {});

    console.log(dumpFlightPlan(fps.uplink));
  });
});
