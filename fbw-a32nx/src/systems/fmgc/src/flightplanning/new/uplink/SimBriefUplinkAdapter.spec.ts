// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import fetch from 'node-fetch';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { setupNavigraphDatabase } from '@fmgc/flightplanning/new/test/Database';
import { SimBriefUplinkAdapter } from '@fmgc/flightplanning/new/uplink/SimBriefUplinkAdapter';
import { dumpFlightPlan } from '@fmgc/flightplanning/new/test/FlightPlan';

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

jest.setTimeout(120_000);

describe('simBrief uplink adapter', () => {
    beforeEach(() => {
        FlightPlanService.reset();
        setupNavigraphDatabase();
    });

    it('tracer test', async () => {
        await FlightPlanService.newCityPair('NZWN', 'NZQN', 'NZAA');

        await FlightPlanService.setDestinationRunway('RW23');
        await FlightPlanService.setArrival('ELRU4B');
        await FlightPlanService.setApproach('R23-Z');
        await FlightPlanService.setApproachVia('ATKIL');

        console.log(dumpFlightPlan(FlightPlanService.activeOrTemporary));
    });

    it('can download an OFP', async () => {
        const ofp = await SimBriefUplinkAdapter.downloadOfpForUserID('506130');

        expect(ofp).not.toBeFalsy();

        const route = SimBriefUplinkAdapter.getRouteFromOfp(ofp);

        console.log(route);
    });

    it('can uplink a flight plan from a downloaded ofp', async () => {
        await SimBriefUplinkAdapter.uplinkFlightPlanFromSimbrief('506130');

        console.log(dumpFlightPlan(FlightPlanService.uplink));
    });
});
