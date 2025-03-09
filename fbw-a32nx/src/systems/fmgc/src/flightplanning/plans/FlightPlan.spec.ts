// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { beforeAll, describe, it, expect, vi, beforeEach } from 'vitest';
import { setupTestDatabase } from '../test/Database';
import { assertDiscontinuity, assertNotDiscontinuity } from '../test/LegUtils';
import { LegType, WaypointDescriptor } from '@flybywiresim/fbw-sdk';
import { loadAirwayLegs } from '../segments/enroute/AirwayLoading';
import { emptyFlightPlan } from '../test/FlightPlan';
import { testEventBus, testFlightPlanService } from '@fmgc/flightplanning/test/TestFlightPlanService';
import { FlightPlanBatch } from '@fmgc/flightplanning/plans/FlightPlanBatch';
import {
  FlightPlanBatchChangeEvent,
  FlightPlanEvents,
  FlightPlanSetFixInfoEntryEvent,
} from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';

describe('a base flight plan', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    testFlightPlanService.reset();
  });

  it.skip('can insert a leg', async () => {
    const fp = emptyFlightPlan();

    await fp.setOriginAirport('CYUL');
    await fp.setOriginRunway('CYYZ06R');
    await fp.setDeparture('CYUL1');

    await fp.setDestinationAirport('CYYZ');
    await fp.setDestinationRunway('CYYZ05');
    await fp.setApproach('I05');
    await fp.setArrival('BOXUM5');

    // const waypoint = await loadSingleWaypoint('NOSUS', 'WCYCYULNOSUS');

    // const leg = FlightPlanLeg.fromEnrouteFix(fp.enrouteSegment, waypoint);

    // FIXME fix when un-skipping
    // await fp.insertElementAfter(3, leg, true);

    const fpLeg = assertNotDiscontinuity(fp.allLegs[4]);

    expect(fpLeg.ident).toBe('NOSUS');
    expect(fp.allLegs[5].isDiscontinuity).toBeTruthy();

    expect(fp.allLegs).toHaveLength(23);
  });

  describe.skip('deleting legs', () => {
    it('without inserting a discontinuity', async () => {
      const fp = emptyFlightPlan();

      await fp.setOriginAirport('CYYZ');
      await fp.setOriginRunway('CYYZ06R');
      await fp.setDeparture('AVSEP6');

      fp.removeElementAt(5, false);

      expect(assertNotDiscontinuity(fp.elementAt(5)).ident).toBe('AVSEP');
    });

    it('inserting a discontinuity', async () => {
      const fp = emptyFlightPlan();

      await fp.setOriginAirport('CYYZ');
      await fp.setOriginRunway('CYYZ06R');
      await fp.setDeparture('AVSEP6');

      fp.removeElementAt(5, true);

      assertDiscontinuity(fp.elementAt(5));
      expect(assertNotDiscontinuity(fp.elementAt(6)).ident).toBe('AVSEP');
    });

    it('not duplicating a discontinuity', async () => {
      const fp = emptyFlightPlan();

      await fp.setOriginAirport('CYYZ');
      await fp.setOriginRunway('CYYZ06R');
      await fp.setDeparture('AVSEP6');

      fp.removeElementAt(4, true);

      expect(assertNotDiscontinuity(fp.elementAt(4)).ident).toBe('DUVKO');
    });
  });

  describe.skip('editing the departure or arrival', () => {
    it('should truncate departure segment after it is edited', async () => {
      const flightPlan = emptyFlightPlan();

      await flightPlan.setOriginAirport('CYYZ');
      await flightPlan.setOriginRunway('CYYZ06R');
      await flightPlan.setDeparture('AVSEP6');

      flightPlan.removeElementAt(4);

      expect(flightPlan.departureRunwayTransitionSegment.allLegs).toHaveLength(4);

      const lastLegOfTruncatedDeparture = assertNotDiscontinuity(
        flightPlan.departureRunwayTransitionSegment.allLegs[3],
      );
      expect(lastLegOfTruncatedDeparture.ident).toBe('DUVKO');

      expect(flightPlan.departureSegment.allLegs).toHaveLength(0);

      expect(flightPlan.departureEnrouteTransitionSegment.allLegs).toHaveLength(0);

      expect(flightPlan.enrouteSegment.allLegs).toHaveLength(2);

      const firstLegOfEnroute = assertNotDiscontinuity(flightPlan.enrouteSegment.allLegs[0]);
      expect(firstLegOfEnroute.ident).toBe('AVSEP');
    });

    it('should insert a discontinuity when deleting a leg', async () => {
      const flightPlan = emptyFlightPlan();

      await flightPlan.setOriginAirport('CYYZ');
      await flightPlan.setOriginRunway('CYYZ06R');
      await flightPlan.setDeparture('AVSEP6');

      flightPlan.removeElementAt(5, true);

      expect(assertNotDiscontinuity(flightPlan.elementAt(4)).ident).toBe('KEDSI');
      assertDiscontinuity(flightPlan.elementAt(5));
      expect(assertNotDiscontinuity(flightPlan.elementAt(6)).ident).toBe('AVSEP');
    });
  });

  describe.skip('collapsing waypoints', () => {
    it('should collapse waypoints within one segment', async () => {
      const flightPlan = emptyFlightPlan();
      // const segment = flightPlan.enrouteSegment;
      //
      // const w1 = await loadSingleWaypoint('NOSUS', 'WCYCYULNOSUS');
      // const w2 = await loadSingleWaypoint('NAPEE', 'WCY    NAPEE');
      // const w3 = await loadSingleWaypoint('PBERG', 'WK6    PBERG');
      // const w4 = await loadSingleWaypoint('HOVOB', 'WK6    HOVOB');

      // FIXME fix when un-skipping
      // flightPlan.insertElementAfter(flightPlan.lastIndex, FlightPlanLeg.fromEnrouteFix(segment, w1));
      // flightPlan.insertElementAfter(flightPlan.lastIndex, FlightPlanLeg.fromEnrouteFix(segment, w2));
      // flightPlan.insertElementAfter(flightPlan.lastIndex, FlightPlanLeg.fromEnrouteFix(segment, w3));
      // flightPlan.insertElementAfter(flightPlan.lastIndex, FlightPlanLeg.fromEnrouteFix(segment, w4));

      const l1 = assertNotDiscontinuity(flightPlan.allLegs[0]);
      const l2 = assertNotDiscontinuity(flightPlan.allLegs[1]);
      const l3 = assertNotDiscontinuity(flightPlan.allLegs[2]);
      const l4 = assertNotDiscontinuity(flightPlan.allLegs[3]);

      expect(l1.ident).toBe('NOSUS');
      expect(l2.ident).toBe('NAPEE');
      expect(l3.ident).toBe('PBERG');
      expect(l4.ident).toBe('HOVOB');

      // FIXME fix when un-skipping
      // flightPlan.insertElementAfter(0, FlightPlanLeg.fromEnrouteFix(segment, w4));

      expect(flightPlan.allLegs).toHaveLength(2);
      expect(assertNotDiscontinuity(flightPlan.allLegs[1]).ident).toBe('HOVOB');
    });

    it('should collapse waypoints across segments', async () => {
      const flightPlan = emptyFlightPlan();
      const departure = flightPlan.departureSegment;

      await flightPlan.setOriginAirport('NZQN');
      await flightPlan.setOriginRunway('CYYZ05');
      await departure.setProcedure('ANPO3A');

      await flightPlan.setDepartureEnrouteTransition('SAVLA');

      const enroute = flightPlan.enrouteSegment;

      const airwayLegs = await loadAirwayLegs(enroute, 'Y569', 'ENZ    Y569', 'WNZ    SAVLA', 'WNZ   PEDPO');

      enroute.insertLegs(...airwayLegs);

      expect(flightPlan.allLegs).toHaveLength(14);

      // const w1 = await loadSingleWaypoint('PEDPO', 'WNZ    PEDPO');

      // FIXME fix when un-skipping
      // flightPlan.insertElementAfter(4, FlightPlanLeg.fromEnrouteFix(enroute, w1));

      expect(flightPlan.allLegs).toHaveLength(6);
      expect(assertNotDiscontinuity(flightPlan.allLegs[4]).ident).toBe('QN852');
      expect(assertNotDiscontinuity(flightPlan.allLegs[5]).ident).toBe('PEDPO');
    });
  });

  it.skip('connects segments by merging TF -> FX legs with the same waypoint', async () => {
    const fp = emptyFlightPlan();

    await fp.setDestinationAirport('EGLL');
    await fp.setDestinationRunway('EGLL27R');
    await fp.setApproach('I27R');
    await fp.setApproachVia('LAM');
    await fp.setArrival('LOGA2H');

    const leg4 = fp.allLegs[4];
    const leg5 = fp.allLegs[5];

    expect(assertNotDiscontinuity(leg4).ident).toBe('LAM');
    expect(assertNotDiscontinuity(leg4).type).toBe(LegType.TF);
    expect(assertNotDiscontinuity(leg5).ident).toBe('LAM/11');
    expect(assertNotDiscontinuity(leg5).type).toBe(LegType.FD);
  });

  it.skip('does not connect segments by merging TF -> FX legs with a different waypoint', async () => {
    const fp = emptyFlightPlan();

    await fp.setOriginAirport('EGLL');
    await fp.setOriginRunway('EGLL09L');
    await fp.setDeparture('CPT4K');

    await fp.setDestinationAirport('EGCC');
    await fp.setDestinationRunway('EGLL23R');
    await fp.setApproach('D23R');

    await fp.setApproachVia('MCT');

    const leg5 = fp.allLegs[5];
    const leg6 = fp.allLegs[6];
    const leg7 = fp.allLegs[7];

    // This approach has an FC leg on MCT - we must not connect TF(CPT) to it

    expect(assertNotDiscontinuity(leg5).ident).toBe('CPT');
    expect(assertNotDiscontinuity(leg5).type).toBe(LegType.TF);
    assertDiscontinuity(leg6);
    expect(assertNotDiscontinuity(leg7).ident).toBe('MCT');
    expect(assertNotDiscontinuity(leg7).type).toBe(LegType.IF);
  });

  describe.skip('plan info', () => {
    describe('destination leg', () => {
      it('returns the right leg for an approach ending at the runway', async () => {
        const fp = emptyFlightPlan();

        await fp.setDestinationAirport('CYYZ');
        await fp.setDestinationRunway('CYYZ05');
        await fp.setApproach('I05');

        const destinationLeg = assertNotDiscontinuity(fp.destinationLeg);

        expect(destinationLeg.ident).toBe('CYYZ05');
        expect(destinationLeg.definition.waypointDescriptor).toEqual(WaypointDescriptor.Runway);
      });

      it('returns the right leg for an approach not ending at the runway', async () => {
        const fp = emptyFlightPlan();

        await fp.setDestinationAirport('NZQN');
        await fp.setDestinationRunway('CYYZ05');
        await fp.setApproach('D05-B');

        const destinationLeg = assertNotDiscontinuity(fp.destinationLeg);

        expect(destinationLeg.ident).toBe('MA260');
        expect(destinationLeg.definition.waypointDescriptor).not.toEqual(WaypointDescriptor.Runway);
      });
    });
  });

  describe('batches', () => {
    it('can open a flight plan batch', async ({ onTestFinished }) => {
      const handlerFn = vi.fn(() => {});

      const sub = testEventBus.getSubscriber<FlightPlanEvents>().on('flightPlanService.batchChange').handle(handlerFn);
      onTestFinished(() => sub.destroy());

      const batch = await testFlightPlanService.openBatch('test_batch');

      expect(batch).toBeTruthy();
      expect(handlerFn).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          type: 'open',
          batchStack: [expect.objectContaining<Partial<FlightPlanBatch>>({ id: batch.id, name: 'test_batch' })],
          batch: expect.objectContaining<Partial<FlightPlanBatch>>({ id: batch.id, name: 'test_batch' }),
        } satisfies Partial<FlightPlanBatchChangeEvent>),
      );

      await testFlightPlanService.closeBatch(batch.id);
    });

    it('can open a flight plan batch and then close it', async ({ onTestFinished }) => {
      const handlerFn = vi.fn(() => {});

      const batch = await testFlightPlanService.openBatch('test_batch');

      const sub = testEventBus.getSubscriber<FlightPlanEvents>().on('flightPlanService.batchChange').handle(handlerFn);
      onTestFinished(() => sub.destroy());

      const closedBatch = await testFlightPlanService.closeBatch(batch.id);

      expect(closedBatch.id).toBe(batch.id);
      expect(closedBatch.name).toBe(batch.name);
      expect(handlerFn).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ type: 'close' } satisfies Partial<FlightPlanBatchChangeEvent>),
      );
    });

    it('cannot close a batch that is not the innermost one', async () => {
      const batch1 = await testFlightPlanService.openBatch('test_batch_1');
      const batch2 = await testFlightPlanService.openBatch('test_batch_2');

      await expect(testFlightPlanService.closeBatch(batch1.id)).rejects.toThrow();

      await testFlightPlanService.closeBatch(batch2.id);
      await testFlightPlanService.closeBatch(batch1.id);
    });

    it('contains currently open batches in flight plan events', async ({ onTestFinished }) => {
      const handlerFn = vi.fn(() => {});

      const fp = testFlightPlanService.active;

      const sub = testEventBus.getSubscriber<FlightPlanEvents>().on('flightPlan.setFixInfoEntry').handle(handlerFn);
      onTestFinished(() => sub.destroy());

      const batch1 = await testFlightPlanService.openBatch('test_batch_1');
      const batch2 = await testFlightPlanService.openBatch('test_batch_2');

      const fix = (await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS'))[0];
      fp.setFixInfoEntry(1, { fix });

      expect(handlerFn).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          batchStack: [
            expect.objectContaining<FlightPlanBatch>({ id: batch1.id, name: batch1.name }),
            expect.objectContaining<FlightPlanBatch>({ id: batch2.id, name: batch2.name }),
          ],
          index: 1,
        } satisfies Partial<FlightPlanSetFixInfoEntryEvent>),
      );
    });
  });
});
