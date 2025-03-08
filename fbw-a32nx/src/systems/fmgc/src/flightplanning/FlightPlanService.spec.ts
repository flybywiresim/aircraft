// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { beforeEach, describe, it, expect, test } from 'vitest';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { loadSingleWaypoint } from '@fmgc/flightplanning/segments/enroute/WaypointLoading';
import { assertNotDiscontinuity } from '@fmgc/flightplanning/test/LegUtils';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { placeBearingDistance } from 'msfs-geo';
import { LegType } from '@flybywiresim/fbw-sdk';
import { EventBus } from '@microsoft/msfs-sdk';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

describe.skip('the flight plan service', () => {
  const fps = new FlightPlanService(new EventBus(), new A320FlightPlanPerformanceData());

  beforeEach(() => {
    fps.reset();
    setupTestDatabase();
  });

  it('deletes the temporary flight plan properly', async () => {
    await fps.newCityPair('CYUL', 'LOWI', 'LOWG');

    await fps.setOriginRunway('CYUL06R');

    await fps.temporaryDelete();

    expect(fps.hasTemporary).toBeFalsy();
    expect(fps.activeOrTemporary.originRunway).toBeUndefined();
  });

  it('inserts the temporary flight plan properly', async () => {
    await fps.newCityPair('CYUL', 'LOWI', 'LOWG');

    await fps.setOriginRunway('CYUL06R');

    await fps.temporaryInsert();

    expect(fps.hasTemporary).toBeFalsy();
    expect(fps.activeOrTemporary.originRunway).toEqual(expect.objectContaining({ ident: 'CYUL06R' }));
  });

  describe('performing revisions', () => {
    describe('next waypoint', () => {
      beforeEach(async () => {
        await fps.newCityPair('CYUL', 'CYYZ');

        await fps.setOriginRunway('CYUL06R');
        await fps.setDepartureProcedure('CYUL1');

        await fps.setDestinationRunway('CYYZ05');
        await fps.setApproach('I05');
      });

      it('with duplicate', async () => {
        await fps.setArrival('BOXUM5');

        const waypoint = await loadSingleWaypoint('ERBUS', 'WCYCYYZERBUS');

        await fps.nextWaypoint(3, waypoint);

        await fps.temporaryInsert();

        const leg4 = assertNotDiscontinuity(fps.active.allLegs[4]);

        expect(leg4.ident).toBe('ERBUS');

        const leg5 = assertNotDiscontinuity(fps.active.allLegs[5]);

        expect(leg5.ident).toBe('SELAP');
      });

      it('without duplicate', async () => {
        const waypoint = await loadSingleWaypoint('ERBUS', 'WCYCYYZERBUS');

        await fps.nextWaypoint(3, waypoint);

        await fps.temporaryInsert();

        const leg4 = assertNotDiscontinuity(fps.active.allLegs[4]);

        expect(leg4.ident).toBe('ERBUS');

        const leg5 = assertNotDiscontinuity(fps.active.allLegs[5]);

        expect(leg5.ident).toBe('DULPA');
      });
    });

    describe('direct to', () => {
      beforeEach(async () => {
        await fps.newCityPair('CYYZ', 'CYVR');

        await fps.setOriginRunway('CYYZ06R');
        await fps.setDepartureProcedure('AVSEP6');

        await fps.temporaryInsert();
      });

      test('a normal direct to', async () => {
        const runway = fps.active.originRunway;
        const runwayLeg = assertNotDiscontinuity(fps.active.originSegment.allLegs[0]);

        const ppos = placeBearingDistance(runwayLeg.definition.waypoint.location, runway.bearing, 0.5);

        const targetWaypoint = await loadSingleWaypoint('NUGOP', 'WCY    NUGOP');

        await fps.directToWaypoint(ppos, runway.bearing, targetWaypoint);

        await fps.temporaryInsert();

        const leg1 = assertNotDiscontinuity(fps.activeOrTemporary.legElementAt(1));

        expect(leg1.definition.type).toBe(LegType.IF);
        expect(leg1.ident).toBe('T-P');

        const leg2 = assertNotDiscontinuity(fps.activeOrTemporary.legElementAt(2));

        expect(leg2.definition.type).toBe(LegType.FD);

        const leg3 = assertNotDiscontinuity(fps.activeOrTemporary.legElementAt(3));

        expect(leg3.definition.type).toBe(LegType.DF);
        expect(leg3.definition.waypoint.ident).toBe('NUGOP');
      });
    });

    describe('set overfly', () => {
      beforeEach(async () => {
        await fps.newCityPair('CYYZ', 'CYVR');

        await fps.setOriginRunway('CYYZ06R');
        await fps.setDepartureProcedure('AVSEP6');

        await fps.temporaryInsert();
      });

      test('toggling an overfly on DUVKO', async () => {
        await fps.setOverfly(4, true);

        const leg = assertNotDiscontinuity(fps.active.elementAt(4));

        expect(leg.definition.overfly).toBeTruthy();

        await fps.setOverfly(4, false);

        expect(leg.definition.overfly).toBeFalsy();
      });
    });
  });

  describe('editing the active flight plan', () => {
    it('correctly accepts a city pair', async () => {
      await fps.newCityPair('CYUL', 'LOWI', 'LOWG');

      expect(fps.hasTemporary).toBeFalsy();

      expect(fps.activeOrTemporary.originAirport).toEqual(expect.objectContaining({ ident: 'CYUL' }));
      expect(fps.activeOrTemporary.destinationAirport).toEqual(expect.objectContaining({ ident: 'LOWI' }));
      expect(fps.activeOrTemporary.alternateDestinationAirport).toEqual(expect.objectContaining({ ident: 'LOWG' }));
    });

    it('does create a temporary flight plan when changing procedure details', async () => {
      await fps.newCityPair('CYYZ', 'LGKR', 'LGKO');

      await fps.setOriginRunway('CYYZ06R');
      expect(fps.hasTemporary).toBeTruthy();
      await fps.temporaryInsert();

      await fps.setDepartureProcedure('AVSEP6');
      expect(fps.hasTemporary).toBeTruthy();
      await fps.temporaryInsert();

      await fps.setDepartureEnrouteTransition('OTNIK');
      expect(fps.hasTemporary).toBeTruthy();
      await fps.temporaryInsert();

      await fps.setDestinationRunway('LGKR34');
      expect(fps.hasTemporary).toBeTruthy();
      await fps.temporaryInsert();

      await fps.setArrival('PARA1J');
      expect(fps.hasTemporary).toBeTruthy();
      await fps.temporaryInsert();

      await fps.setApproach('R34');
      expect(fps.hasTemporary).toBeTruthy();
      await fps.temporaryInsert();

      await fps.setApproachVia('BEDEX');
      expect(fps.hasTemporary).toBeTruthy();
      await fps.temporaryInsert();
    });
  });

  describe('editing a secondary flight plan', () => {
    it('correctly accepts a city pair', async () => {
      await fps.newCityPair('CYUL', 'LOWI', 'LOWG', FlightPlanIndex.FirstSecondary);

      expect(fps.secondary(1).originAirport).toEqual(expect.objectContaining({ ident: 'CYUL' }));
      expect(fps.secondary(1).destinationAirport).toEqual(expect.objectContaining({ ident: 'LOWI' }));
      expect(fps.secondary(1).alternateDestinationAirport).toEqual(expect.objectContaining({ ident: 'LOWG' }));
    });

    it('does not create a temporary flight plan when changing procedure details', async () => {
      await fps.newCityPair('CYYZ', 'LGKR', 'LGKO', FlightPlanIndex.FirstSecondary);

      await fps.setOriginRunway('CYYZ06R', FlightPlanIndex.FirstSecondary);
      expect(fps.hasTemporary).toBeFalsy();

      await fps.setDepartureProcedure('AVSEP6', FlightPlanIndex.FirstSecondary);
      expect(fps.hasTemporary).toBeFalsy();

      await fps.setDepartureEnrouteTransition('OTNIK', FlightPlanIndex.FirstSecondary);
      expect(fps.hasTemporary).toBeFalsy();

      await fps.setDestinationRunway('LGKR34', FlightPlanIndex.FirstSecondary);
      expect(fps.hasTemporary).toBeFalsy();

      await fps.setArrival('PARA1J', FlightPlanIndex.FirstSecondary);
      expect(fps.hasTemporary).toBeFalsy();

      await fps.setApproach('R34', FlightPlanIndex.FirstSecondary);
      expect(fps.hasTemporary).toBeFalsy();

      await fps.setApproachVia('BEDEX', FlightPlanIndex.FirstSecondary);
      expect(fps.hasTemporary).toBeFalsy();
    });
  });
});
