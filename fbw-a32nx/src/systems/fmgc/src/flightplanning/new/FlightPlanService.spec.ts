// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { jest } from '@jest/globals';
import fetch from 'node-fetch';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { loadSingleWaypoint } from '@fmgc/flightplanning/new/segments/enroute/WaypointLoading';
import { assertNotDiscontinuity } from '@fmgc/flightplanning/new/test/LegUtils';
import { setupNavigraphDatabase } from '@fmgc/flightplanning/new/test/Database';
import { placeBearingDistance } from 'msfs-geo';
import { LegType } from 'msfs-navdata';

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

jest.setTimeout(120_000);

describe('the flight plan service', () => {
    beforeEach(() => {
        FlightPlanService.reset();
        setupNavigraphDatabase();
    });

    it('deletes the temporary flight plan properly', async () => {
        await FlightPlanService.newCityPair('CYUL', 'LOWI', 'LOWG');

        await FlightPlanService.setOriginRunway('RW06R');

        FlightPlanService.temporaryDelete();

        expect(FlightPlanService.hasTemporary).toBeFalsy();
        expect(FlightPlanService.activeOrTemporary.originRunway).toBeUndefined();
    });

    it('inserts the temporary flight plan properly', async () => {
        await FlightPlanService.newCityPair('CYUL', 'LOWI', 'LOWG');

        await FlightPlanService.setOriginRunway('RW06R');

        FlightPlanService.temporaryInsert();

        expect(FlightPlanService.hasTemporary).toBeFalsy();
        expect(FlightPlanService.activeOrTemporary.originRunway).toEqual(expect.objectContaining({ ident: 'RW06R' }));
    });

    describe('performing revisions', () => {
        describe('next waypoint', () => {
            beforeEach(async () => {
                await FlightPlanService.newCityPair('CYUL', 'CYYZ');

                await FlightPlanService.setOriginRunway('RW06R');
                await FlightPlanService.setDepartureProcedure('CYUL1');

                await FlightPlanService.setDestinationRunway('RW05');
                await FlightPlanService.setApproach('I05');
            });

            it('with duplicate', async () => {
                await FlightPlanService.setArrival('BOXUM5');

                const waypoint = await loadSingleWaypoint('ERBUS', 'WCYCYYZERBUS');

                await FlightPlanService.nextWaypoint(3, waypoint);

                FlightPlanService.temporaryInsert();

                const leg4 = assertNotDiscontinuity(FlightPlanService.active.allLegs[4]);

                expect(leg4.ident).toEqual('ERBUS');

                const leg5 = assertNotDiscontinuity(FlightPlanService.active.allLegs[5]);

                expect(leg5.ident).toEqual('SELAP');
            });

            it('without duplicate', async () => {
                const waypoint = await loadSingleWaypoint('ERBUS', 'WCYCYYZERBUS');

                await FlightPlanService.nextWaypoint(3, waypoint);

                FlightPlanService.temporaryInsert();

                const leg4 = assertNotDiscontinuity(FlightPlanService.active.allLegs[4]);

                expect(leg4.ident).toEqual('ERBUS');

                const leg5 = assertNotDiscontinuity(FlightPlanService.active.allLegs[5]);

                expect(leg5.ident).toEqual('DULPA');
            });
        });

        describe('direct to', () => {
            beforeEach(async () => {
                await FlightPlanService.newCityPair('CYYZ', 'CYVR');

                await FlightPlanService.setOriginRunway('RW06R');
                await FlightPlanService.setDepartureProcedure('AVSEP6');

                FlightPlanService.temporaryInsert();
            });

            test('a normal direct to', async () => {
                const runway = FlightPlanService.active.originRunway;
                const runwayLeg = assertNotDiscontinuity(FlightPlanService.active.originSegment.allLegs[0]);

                const ppos = placeBearingDistance(runwayLeg.definition.waypoint.location, runway.bearing, 0.5);

                const targetWaypoint = await loadSingleWaypoint('NUGOP', 'WCY    NUGOP');

                FlightPlanService.directTo(ppos, runway.bearing, targetWaypoint);

                FlightPlanService.temporaryInsert();

                const leg1 = assertNotDiscontinuity(FlightPlanService.activeOrTemporary.legElementAt(1));

                expect(leg1.definition.type).toBe(LegType.IF);
                expect(leg1.ident).toBe('T-P');

                const leg2 = assertNotDiscontinuity(FlightPlanService.activeOrTemporary.legElementAt(2));

                expect(leg2.definition.type).toBe(LegType.FD);

                const leg3 = assertNotDiscontinuity(FlightPlanService.activeOrTemporary.legElementAt(3));

                expect(leg3.definition.type).toBe(LegType.DF);
                expect(leg3.definition.waypoint.ident).toBe('NUGOP');
            });
        });

        describe('set overfly', () => {
            beforeEach(async () => {
                await FlightPlanService.newCityPair('CYYZ', 'CYVR');

                await FlightPlanService.setOriginRunway('RW06R');
                await FlightPlanService.setDepartureProcedure('AVSEP6');

                FlightPlanService.temporaryInsert();
            });

            test('toggling an overfly on DUVKO', async () => {
                FlightPlanService.setOverfly(4, true);

                const leg = assertNotDiscontinuity(FlightPlanService.active.elementAt(4));

                expect(leg.definition.overfly).toBeTruthy();

                FlightPlanService.setOverfly(4, false);

                expect(leg.definition.overfly).toBeFalsy();
            });
        });
    });

    describe('editing the active flight plan', () => {
        it('correctly accepts a city pair', async () => {
            await FlightPlanService.newCityPair('CYUL', 'LOWI', 'LOWG');

            expect(FlightPlanService.hasTemporary).toBeFalsy();

            expect(FlightPlanService.activeOrTemporary.originAirport).toEqual(expect.objectContaining({ ident: 'CYUL' }));
            expect(FlightPlanService.activeOrTemporary.destinationAirport).toEqual(expect.objectContaining({ ident: 'LOWI' }));
            expect(FlightPlanService.activeOrTemporary.alternateDestinationAirport).toEqual(expect.objectContaining({ ident: 'LOWG' }));
        });

        it('does create a temporary flight plan when changing procedure details', async () => {
            await FlightPlanService.newCityPair('CYYZ', 'LGKR', 'LGKO');

            await FlightPlanService.setOriginRunway('RW06R');
            expect(FlightPlanService.hasTemporary).toBeTruthy();
            FlightPlanService.temporaryInsert();

            await FlightPlanService.setDepartureProcedure('AVSEP6');
            expect(FlightPlanService.hasTemporary).toBeTruthy();
            FlightPlanService.temporaryInsert();

            await FlightPlanService.setDepartureEnrouteTransition('OTNIK');
            expect(FlightPlanService.hasTemporary).toBeTruthy();
            FlightPlanService.temporaryInsert();

            await FlightPlanService.setDestinationRunway('RW34');
            expect(FlightPlanService.hasTemporary).toBeTruthy();
            FlightPlanService.temporaryInsert();

            await FlightPlanService.setArrival('PARA1J');
            expect(FlightPlanService.hasTemporary).toBeTruthy();
            FlightPlanService.temporaryInsert();

            await FlightPlanService.setApproach('R34');
            expect(FlightPlanService.hasTemporary).toBeTruthy();
            FlightPlanService.temporaryInsert();

            await FlightPlanService.setApproachVia('BEDEX');
            expect(FlightPlanService.hasTemporary).toBeTruthy();
            FlightPlanService.temporaryInsert();
        });
    });

    describe('editing a secondary flight plan', () => {
        it('correctly accepts a city pair', async () => {
            await FlightPlanService.newCityPair('CYUL', 'LOWI', 'LOWG', FlightPlanIndex.FirstSecondary);

            expect(FlightPlanService.secondary(1).originAirport).toEqual(expect.objectContaining({ ident: 'CYUL' }));
            expect(FlightPlanService.secondary(1).destinationAirport).toEqual(expect.objectContaining({ ident: 'LOWI' }));
            expect(FlightPlanService.secondary(1).alternateDestinationAirport).toEqual(expect.objectContaining({ ident: 'LOWG' }));
        });

        it('does not create a temporary flight plan when changing procedure details', async () => {
            await FlightPlanService.newCityPair('CYYZ', 'LGKR', 'LGKO', FlightPlanIndex.FirstSecondary);

            await FlightPlanService.setOriginRunway('RW06R', FlightPlanIndex.FirstSecondary);
            expect(FlightPlanService.hasTemporary).toBeFalsy();

            await FlightPlanService.setDepartureProcedure('AVSEP6', FlightPlanIndex.FirstSecondary);
            expect(FlightPlanService.hasTemporary).toBeFalsy();

            await FlightPlanService.setDepartureEnrouteTransition('OTNIK', FlightPlanIndex.FirstSecondary);
            expect(FlightPlanService.hasTemporary).toBeFalsy();

            await FlightPlanService.setDestinationRunway('RW34', FlightPlanIndex.FirstSecondary);
            expect(FlightPlanService.hasTemporary).toBeFalsy();

            await FlightPlanService.setArrival('PARA1J', FlightPlanIndex.FirstSecondary);
            expect(FlightPlanService.hasTemporary).toBeFalsy();

            await FlightPlanService.setApproach('R34', FlightPlanIndex.FirstSecondary);
            expect(FlightPlanService.hasTemporary).toBeFalsy();

            await FlightPlanService.setApproachVia('BEDEX', FlightPlanIndex.FirstSecondary);
            expect(FlightPlanService.hasTemporary).toBeFalsy();
        });
    });
});
