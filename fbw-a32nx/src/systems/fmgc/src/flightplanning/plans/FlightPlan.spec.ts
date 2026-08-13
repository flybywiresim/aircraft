// Copyright (c) 2021-2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupTestDatabase } from '../test/Database';
import { assertDiscontinuity, assertNotDiscontinuity } from '../test/LegUtils';
import { AltitudeDescriptor, LegType, WaypointDescriptor } from '@flybywiresim/fbw-sdk';
import { loadAirwayLegs } from '../segments/enroute/AirwayLoading';
import { emptyFlightPlan } from '../test/FlightPlan';
import { testFlightPlanService } from '@fmgc/flightplanning/test/TestFlightPlanService';
import { FlightPlanEvents } from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';

describe('a base flight plan', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    testFlightPlanService.reset(true);
  });

  it('can insert a leg', async () => {
    const fp = emptyFlightPlan();

    await fp.setOriginAirport('CYVR');
    await fp.setDestinationAirport('CYYZ');

    const waypoint = await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS');

    await fp.insertWaypointBefore(1, waypoint[0]);

    const fpLeg = fp.legElementAt(1);

    expect(fpLeg.ident).toBe('NOSUS');
    expect(fp.allLegs[2].isDiscontinuity).toBeTruthy();

    expect(fp.allLegs).toHaveLength(4);
  });

  it('can insert an airway', async ({ onTestFinished }) => {
    const handlerFn = vi.fn(() => {});

    const sub = testEventBus.getSubscriber<FlightPlanEvents>().on('flightPlan.pendingAirwaysEdit').handle(handlerFn);
    onTestFinished(() => sub.destroy());

    const fp = emptyFlightPlan();
    await fp.setOriginAirport('CYYZ');
    await fp.setDestinationAirport('CYVR');

    const fix = await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS');

    await fp.nextWaypoint(1, fix[0]);

    await fp.startAirwayEntry(2);

    const airway = await NavigationDatabaseService.activeDatabase.searchAirway('A1', fix[0]);

    await fp.continueAirwayEntryViaAirway(airway[0]);

    const terminationFix = await NavigationDatabaseService.activeDatabase.searchWaypoint('DUTIL');

    await fp.continueAirwayEntryToFix(terminationFix[0]);

    await fp.finaliseAirwayEntry();

    expect(fp.legElementAt(2).terminationWaypoint().ident).toBe('NOSUS');
    expect(fp.legElementAt(3).terminationWaypoint().ident).toBe('DEBUS');
    expect(fp.legElementAt(4).terminationWaypoint().ident).toBe('DUTIL');
  });

  describe('deleting constraints at or above the cruise flight level', () => {
    const planWithNosus = async () => {
      const fp = emptyFlightPlan();

      await fp.setOriginAirport('CYVR');
      await fp.setDestinationAirport('CYYZ');

      const waypoint = await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS');
      await fp.insertWaypointBefore(1, waypoint[0]);

      return fp;
    };

    it('deletes a constraint above the cruise level', async () => {
      const fp = await planWithNosus();

      fp.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 25_000,
      });

      fp.setPerformanceData('cruiseFlightLevel', 240);
      fp.deleteConstraintsAboveCruiseLevel();

      expect(fp.legElementAt(1).altitudeConstraint).toBeUndefined();
    });

    it('deletes an AT constraint exactly equal to the cruise level', async () => {
      const fp = await planWithNosus();

      fp.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtAlt1,
        altitude1: 24_000,
      });

      fp.setPerformanceData('cruiseFlightLevel', 240);
      fp.deleteConstraintsAboveCruiseLevel();

      expect(fp.legElementAt(1).altitudeConstraint).toBeUndefined();
    });

    it('deletes an AT OR ABOVE alt2 constraint above the cruise level', async () => {
      const fp = await planWithNosus();

      fp.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt2,
        altitude2: 26_000,
      });

      fp.setPerformanceData('cruiseFlightLevel', 240);
      fp.deleteConstraintsAboveCruiseLevel();

      expect(fp.legElementAt(1).altitudeConstraint).toBeUndefined();
    });

    it('keeps a constraint below the cruise level', async () => {
      const fp = await planWithNosus();

      fp.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 5_000,
      });

      fp.setPerformanceData('cruiseFlightLevel', 240);
      fp.deleteConstraintsAboveCruiseLevel();

      expect(fp.legElementAt(1).altitudeConstraint).toEqual({
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 5_000,
      });
    });

    it('keeps an AT OR BELOW constraint whose value is above the cruise level', async () => {
      const fp = await planWithNosus();

      fp.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrBelowAlt1,
        altitude1: 25_000,
      });

      fp.setPerformanceData('cruiseFlightLevel', 240);
      fp.deleteConstraintsAboveCruiseLevel();

      expect(fp.legElementAt(1).altitudeConstraint).toEqual({
        altitudeDescriptor: AltitudeDescriptor.AtOrBelowAlt1,
        altitude1: 25_000,
      });
    });

    it('keeps a constraint on a leg behind the active leg', async () => {
      const fp = await planWithNosus();

      fp.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 25_000,
      });

      fp.sequence();
      fp.setPerformanceData('cruiseFlightLevel', 240);
      fp.deleteConstraintsAboveCruiseLevel();

      expect(fp.legElementAt(1).altitudeConstraint).toEqual({
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 25_000,
      });
    });

    it('does not delete constraints on the alternate flight plan', async () => {
      const fp = emptyFlightPlan();

      await fp.setOriginAirport('CYVR');
      await fp.setDestinationAirport('CYYZ');
      fp.setPerformanceData('cruiseFlightLevel', 240);

      await fp.setAlternateDestinationAirport('CYVR');
      const altn = fp.alternateFlightPlan;

      const waypoint = await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS');
      await altn.insertWaypointBefore(1, waypoint[0]);

      altn.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 25_000,
      });

      altn.deleteConstraintsAboveCruiseLevel();

      expect(altn.legElementAt(1).altitudeConstraint).toEqual({
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 25_000,
      });
    });

    it('deletes constraints above the cruise level when a step climb is inserted', async () => {
      const fp = await planWithNosus();
      const dutil = await NavigationDatabaseService.activeDatabase.searchWaypoint('DUTIL');
      await fp.insertWaypointBefore(2, dutil[0]);

      fp.setPerformanceData('cruiseFlightLevel', 240);
      fp.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 25_000,
      });

      fp.addOrUpdateCruiseStep(2, 30_000);

      expect(fp.legElementAt(1).altitudeConstraint).toBeUndefined();
      expect(fp.legElementAt(2).cruiseStep).toBeDefined();
    });

    it('does not delete constraints when an unrelated waypoint is inserted', async () => {
      const fp = await planWithNosus();

      fp.setPerformanceData('cruiseFlightLevel', 240);
      fp.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 25_000,
      });

      const dutil = await NavigationDatabaseService.activeDatabase.searchWaypoint('DUTIL');
      await fp.insertWaypointBefore(2, dutil[0]);

      expect(fp.legElementAt(1).altitudeConstraint).toEqual({
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 25_000,
      });
    });

    it('emits constraintsDeletedAboveCruiseLevel once when constraints are deleted', async ({ onTestFinished }) => {
      const handlerFn = vi.fn();
      const sub = testEventBus
        .getSubscriber<FlightPlanEvents>()
        .on('flightPlan.constraintsDeletedAboveCruiseLevel')
        .handle(handlerFn);
      onTestFinished(() => sub.destroy());

      await testFlightPlanService.newCityPair('CYVR', 'CYYZ');
      const plan = testFlightPlanService.active;

      const nosus = await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS');
      await plan.insertWaypointBefore(1, nosus[0]);
      const dutil = await NavigationDatabaseService.activeDatabase.searchWaypoint('DUTIL');
      await plan.insertWaypointBefore(2, dutil[0]);

      plan.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtAlt1,
        altitude1: 24_000,
      });
      plan.setPilotEnteredAltitudeConstraintAt(2, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 30_000,
      });

      plan.setPerformanceData('cruiseFlightLevel', 240);
      plan.deleteConstraintsAboveCruiseLevel();

      expect(handlerFn).toHaveBeenCalledTimes(1);
      expect(plan.legElementAt(1).altitudeConstraint).toBeUndefined();
      expect(plan.legElementAt(2).altitudeConstraint).toBeUndefined();
    });

    it('does not emit constraintsDeletedAboveCruiseLevel when nothing is deleted', async ({ onTestFinished }) => {
      const handlerFn = vi.fn();
      const sub = testEventBus
        .getSubscriber<FlightPlanEvents>()
        .on('flightPlan.constraintsDeletedAboveCruiseLevel')
        .handle(handlerFn);
      onTestFinished(() => sub.destroy());

      await testFlightPlanService.newCityPair('CYVR', 'CYYZ');
      const plan = testFlightPlanService.active;

      const nosus = await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS');
      await plan.insertWaypointBefore(1, nosus[0]);

      plan.setPilotEnteredAltitudeConstraintAt(1, false, {
        altitudeDescriptor: AltitudeDescriptor.AtOrAboveAlt1,
        altitude1: 5_000,
      });

      plan.setPerformanceData('cruiseFlightLevel', 240);
      plan.deleteConstraintsAboveCruiseLevel();

      expect(handlerFn).not.toHaveBeenCalled();
    });
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
});
