// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { SimBriefUplinkAdapter } from '@fmgc/flightplanning/uplink/SimBriefUplinkAdapter';
import { beforeEach, describe, expect, it } from 'vitest';
import { testFms } from '@fmgc/flightplanning/test/TestFms';
import { testFlightPlanService } from '@fmgc/flightplanning/test/TestFlightPlanService';

describe('simBrief uplink adapter', () => {
  beforeEach(() => {
    testFlightPlanService.reset();
    setupTestDatabase();
  });

  it('tracer test', async ({ skip }) => {
    skip();
    await testFlightPlanService.newCityPair('NZWN', 'NZQN', 'NZAA');

    await testFlightPlanService.setDestinationRunway('NZQN23');
    await testFlightPlanService.setArrival('ELRU4B');
    await testFlightPlanService.setApproach('R23-Z');
    await testFlightPlanService.setApproachVia('ATKIL');
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
    await SimBriefUplinkAdapter.uplinkFlightPlanFromSimbrief(testFms, testFlightPlanService, ofp, {});
  });
});
