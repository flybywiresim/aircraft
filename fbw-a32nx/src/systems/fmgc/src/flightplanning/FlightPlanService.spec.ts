// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { beforeEach, describe, it, expect, test } from 'vitest';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { loadSingleWaypoint } from '@fmgc/flightplanning/segments/enroute/WaypointLoading';
import { assertNotDiscontinuity } from '@fmgc/flightplanning/test/LegUtils';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { placeBearingDistance } from 'msfs-geo';
import { LegType } from '@flybywiresim/fbw-sdk';
import { testFlightPlanService } from '@fmgc/flightplanning/test/TestFlightPlanService';

describe.skip('the flight plan service', () => {
  beforeEach(() => {
    testFlightPlanService.reset();
    setupTestDatabase();
  });

  it('deletes the temporary flight plan properly', async () => {
    await testFlightPlanService.newCityPair('CYUL', 'LOWI', 'LOWG');

    await testFlightPlanService.setOriginRunway('CYUL06R');

    await testFlightPlanService.temporaryDelete();

    expect(testFlightPlanService.hasTemporary).toBeFalsy();
    expect(testFlightPlanService.activeOrTemporary.originRunway).toBeUndefined();
  });

  it('inserts the temporary flight plan properly', async () => {
    await testFlightPlanService.newCityPair('CYUL', 'LOWI', 'LOWG');

    await testFlightPlanService.setOriginRunway('CYUL06R');

    await testFlightPlanService.temporaryInsert();

    expect(testFlightPlanService.hasTemporary).toBeFalsy();
    expect(testFlightPlanService.activeOrTemporary.originRunway).toEqual(expect.objectContaining({ ident: 'CYUL06R' }));
  });

  describe('performing revisions', () => {
    describe('next waypoint', () => {
      beforeEach(async () => {
        await testFlightPlanService.newCityPair('CYUL', 'CYYZ');

        await testFlightPlanService.setOriginRunway('CYUL06R');
        await testFlightPlanService.setDepartureProcedure('CYUL1');

        await testFlightPlanService.setDestinationRunway('CYYZ05');
        await testFlightPlanService.setApproach('I05');
      });

      it('with duplicate', async () => {
        await testFlightPlanService.setArrival('BOXUM5');

        const waypoint = await loadSingleWaypoint('ERBUS', 'WCYCYYZERBUS');

        await testFlightPlanService.nextWaypoint(3, waypoint);

        await testFlightPlanService.temporaryInsert();

        const leg4 = assertNotDiscontinuity(testFlightPlanService.active.allLegs[4]);

        expect(leg4.ident).toBe('ERBUS');

        const leg5 = assertNotDiscontinuity(testFlightPlanService.active.allLegs[5]);

        expect(leg5.ident).toBe('SELAP');
      });

      it('without duplicate', async () => {
        const waypoint = await loadSingleWaypoint('ERBUS', 'WCYCYYZERBUS');

        await testFlightPlanService.nextWaypoint(3, waypoint);

        await testFlightPlanService.temporaryInsert();

        const leg4 = assertNotDiscontinuity(testFlightPlanService.active.allLegs[4]);

        expect(leg4.ident).toBe('ERBUS');

        const leg5 = assertNotDiscontinuity(testFlightPlanService.active.allLegs[5]);

        expect(leg5.ident).toBe('DULPA');
      });
    });

    describe('direct to', () => {
      beforeEach(async () => {
        await testFlightPlanService.newCityPair('CYYZ', 'CYVR');

        await testFlightPlanService.setOriginRunway('CYYZ06R');
        await testFlightPlanService.setDepartureProcedure('AVSEP6');

        await testFlightPlanService.temporaryInsert();
      });

      test('a normal direct to', async () => {
        const runway = testFlightPlanService.active.originRunway;
        const runwayLeg = assertNotDiscontinuity(testFlightPlanService.active.originSegment.allLegs[0]);

        const ppos = placeBearingDistance(runwayLeg.definition.waypoint.location, runway.bearing, 0.5);

        const targetWaypoint = await loadSingleWaypoint('NUGOP', 'WCY    NUGOP');

        await testFlightPlanService.directToWaypoint(ppos, runway.bearing, targetWaypoint);

        await testFlightPlanService.temporaryInsert();

        const leg1 = assertNotDiscontinuity(testFlightPlanService.activeOrTemporary.legElementAt(1));

        expect(leg1.definition.type).toBe(LegType.IF);
        expect(leg1.ident).toBe('T-P');

        const leg2 = assertNotDiscontinuity(testFlightPlanService.activeOrTemporary.legElementAt(2));

        expect(leg2.definition.type).toBe(LegType.FD);

        const leg3 = assertNotDiscontinuity(testFlightPlanService.activeOrTemporary.legElementAt(3));

        expect(leg3.definition.type).toBe(LegType.DF);
        expect(leg3.definition.waypoint.ident).toBe('NUGOP');
      });
    });

    describe('set overfly', () => {
      beforeEach(async () => {
        await testFlightPlanService.newCityPair('CYYZ', 'CYVR');

        await testFlightPlanService.setOriginRunway('CYYZ06R');
        await testFlightPlanService.setDepartureProcedure('AVSEP6');

        await testFlightPlanService.temporaryInsert();
      });

      test('toggling an overfly on DUVKO', async () => {
        await testFlightPlanService.setOverfly(4, true);

        const leg = assertNotDiscontinuity(testFlightPlanService.active.elementAt(4));

        expect(leg.definition.overfly).toBeTruthy();

        await testFlightPlanService.setOverfly(4, false);

        expect(leg.definition.overfly).toBeFalsy();
      });
    });
  });

  describe('editing the active flight plan', () => {
    it('correctly accepts a city pair', async () => {
      await testFlightPlanService.newCityPair('CYUL', 'LOWI', 'LOWG');

      expect(testFlightPlanService.hasTemporary).toBeFalsy();

      expect(testFlightPlanService.activeOrTemporary.originAirport).toEqual(expect.objectContaining({ ident: 'CYUL' }));
      expect(testFlightPlanService.activeOrTemporary.destinationAirport).toEqual(
        expect.objectContaining({ ident: 'LOWI' }),
      );
      expect(testFlightPlanService.activeOrTemporary.alternateDestinationAirport).toEqual(
        expect.objectContaining({ ident: 'LOWG' }),
      );
    });

    it('does create a temporary flight plan when changing procedure details', async () => {
      await testFlightPlanService.newCityPair('CYYZ', 'LGKR', 'LGKO');

      await testFlightPlanService.setOriginRunway('CYYZ06R');
      expect(testFlightPlanService.hasTemporary).toBeTruthy();
      await testFlightPlanService.temporaryInsert();

      await testFlightPlanService.setDepartureProcedure('AVSEP6');
      expect(testFlightPlanService.hasTemporary).toBeTruthy();
      await testFlightPlanService.temporaryInsert();

      await testFlightPlanService.setDepartureEnrouteTransition('OTNIK');
      expect(testFlightPlanService.hasTemporary).toBeTruthy();
      await testFlightPlanService.temporaryInsert();

      await testFlightPlanService.setDestinationRunway('LGKR34');
      expect(testFlightPlanService.hasTemporary).toBeTruthy();
      await testFlightPlanService.temporaryInsert();

      await testFlightPlanService.setArrival('PARA1J');
      expect(testFlightPlanService.hasTemporary).toBeTruthy();
      await testFlightPlanService.temporaryInsert();

      await testFlightPlanService.setApproach('R34');
      expect(testFlightPlanService.hasTemporary).toBeTruthy();
      await testFlightPlanService.temporaryInsert();

      await testFlightPlanService.setApproachVia('BEDEX');
      expect(testFlightPlanService.hasTemporary).toBeTruthy();
      await testFlightPlanService.temporaryInsert();
    });
  });

  describe('editing a secondary flight plan', () => {
    it('correctly accepts a city pair', async () => {
      await testFlightPlanService.newCityPair('CYUL', 'LOWI', 'LOWG', FlightPlanIndex.FirstSecondary);

      expect(testFlightPlanService.secondary(1).originAirport).toEqual(expect.objectContaining({ ident: 'CYUL' }));
      expect(testFlightPlanService.secondary(1).destinationAirport).toEqual(expect.objectContaining({ ident: 'LOWI' }));
      expect(testFlightPlanService.secondary(1).alternateDestinationAirport).toEqual(
        expect.objectContaining({ ident: 'LOWG' }),
      );
    });

    it('does not create a temporary flight plan when changing procedure details', async () => {
      await testFlightPlanService.newCityPair('CYYZ', 'LGKR', 'LGKO', FlightPlanIndex.FirstSecondary);

      await testFlightPlanService.setOriginRunway('CYYZ06R', FlightPlanIndex.FirstSecondary);
      expect(testFlightPlanService.hasTemporary).toBeFalsy();

      await testFlightPlanService.setDepartureProcedure('AVSEP6', FlightPlanIndex.FirstSecondary);
      expect(testFlightPlanService.hasTemporary).toBeFalsy();

      await testFlightPlanService.setDepartureEnrouteTransition('OTNIK', FlightPlanIndex.FirstSecondary);
      expect(testFlightPlanService.hasTemporary).toBeFalsy();

      await testFlightPlanService.setDestinationRunway('LGKR34', FlightPlanIndex.FirstSecondary);
      expect(testFlightPlanService.hasTemporary).toBeFalsy();

      await testFlightPlanService.setArrival('PARA1J', FlightPlanIndex.FirstSecondary);
      expect(testFlightPlanService.hasTemporary).toBeFalsy();

      await testFlightPlanService.setApproach('R34', FlightPlanIndex.FirstSecondary);
      expect(testFlightPlanService.hasTemporary).toBeFalsy();

      await testFlightPlanService.setApproachVia('BEDEX', FlightPlanIndex.FirstSecondary);
      expect(testFlightPlanService.hasTemporary).toBeFalsy();
    });
  });
});
