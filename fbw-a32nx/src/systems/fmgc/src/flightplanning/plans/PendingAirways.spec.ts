// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
// import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
// import { loadSingleWaypoint } from '@fmgc/flightplanning/segments/enroute/WaypointLoading';
// import { dumpFlightPlan } from '@fmgc/flightplanning/test/FlightPlan';
import { beforeEach, describe } from 'vitest';
import { testFlightPlanService } from '../test/TestFlightPlanService';

describe.skip('pending airways entry', () => {
  beforeEach(() => {
    testFlightPlanService.reset();
    setupTestDatabase();
  });

  // FIXME fix when un-skipping
  // it('inserts an airway', async () => {
  //     const db = NavigationDatabaseService.activeDatabase;
  //
  //     await fps.newCityPair('CYUL', 'KBOS', 'KJFK');
  //     await fps.setOriginRunway('CYUL06R');
  //     await fps.setDepartureProcedure('CYUL1');
  //
  //     const wp = await loadSingleWaypoint('DUNUP', 'WCY    DUNUP');
  //
  //     await fps.nextWaypoint(3, wp);
  //
  //     await fps.temporaryInsert();
  //
  //     fps.active.startAirwayEntry(4);
  //
  //     const airway = (await db.searchAirway('Q903'))[0];
  //
  //     fps.active.pendingAirways.thenAirway(airway);
  //
  //     const endWp = await loadSingleWaypoint('NOSUT', 'WCY    NOSUT');
  //
  //     fps.active.pendingAirways.thenTo(endWp);
  //
  //     const airway2 = (await db.searchAirway('Q878'))[0];
  //
  //     fps.active.pendingAirways.thenAirway(airway2);
  //
  //     const endWp2 = await loadSingleWaypoint('UDBAM', 'WCY    UDBAM');
  //
  //     fps.active.pendingAirways.thenTo(endWp2);
  //
  //     fps.active.pendingAirways.finalize();
  //
  //     console.log(dumpFlightPlan(fps.active));
  // });

  // FIXME fix when un-skipping
  // it('inserts an airway 2', async () => {
  //     const db = NavigationDatabaseService.activeDatabase;
  //
  //     await fps.newCityPair('LPPR', 'EGCC', 'EGKK');
  //     await fps.setOriginRunway('LPPR35');
  //     await fps.setDepartureProcedure('TURO9E');
  //
  //     fps.temporaryInsert();
  //
  //     const wp1 = (await db.searchWaypoint('TURON'))[0];
  //
  //     await fps.nextWaypoint(3, wp1);
  //
  //     const a1 = (await db.searchAirway('UP600'))[0];
  //
  //     fps.startAirwayEntry(4);
  //     fps.activeOrTemporary.pendingAirways.thenAirway(a1);
  //
  //     const wp2 = (await db.searchWaypoint('ASDEB'))[0];
  //
  //     fps.activeOrTemporary.pendingAirways.thenTo(wp2);
  //     fps.activeOrTemporary.pendingAirways.finalize();
  //
  //     const wp3 = (await db.searchWaypoint('KORUL'))[0];
  //
  //     await fps.nextWaypoint(4, wp3);
  //
  //     const wp4 = (await db.searchWaypoint('TALIG'))[0];
  //
  //     await fps.nextWaypoint(5, wp4);
  //
  //     const a2 = (await db.searchAirway('UP620'))[0];
  //
  //     fps.startAirwayEntry(6);
  //     fps.activeOrTemporary.pendingAirways.thenAirway(a2);
  //
  //     const a3 = (await db.searchAirway('T7'))[2];
  //
  //     fps.activeOrTemporary.pendingAirways.thenAirway(a3);
  //
  //     const a4 = (await db.searchAirway('L180'))[0];
  //
  //     fps.activeOrTemporary.pendingAirways.thenAirway(a4);
  //
  //     const a5 = (await db.searchAirway('UN864'))[1];
  //
  //     fps.activeOrTemporary.pendingAirways.thenAirway(a5);
  //
  //     const wp5 = (await db.searchWaypoint('MONTY'))[2];
  //
  //     fps.activeOrTemporary.pendingAirways.thenTo(wp5);
  //     fps.activeOrTemporary.pendingAirways.finalize();
  //
  //     console.log(dumpFlightPlan(fps.activeOrTemporary));
  // });

  // FIXME fix when un-skipping
  // it('automatically connects two airways at a matching point', async () => {
  //     const db = NavigationDatabaseService.activeDatabase;
  //
  //     const fp = fps.active;
  //
  //     await fps.newCityPair('EGLL', 'OMDB', 'OMAA');
  //     await fps.setOriginRunway('EGLL27R');
  //     await fps.setDepartureProcedure('DET2F');
  //
  //     fps.temporaryInsert();
  //
  //     fps.active.startAirwayEntry(7);
  //
  //     const airway = (await db.searchAirway('L6'))[0];
  //
  //     fps.active.pendingAirways.thenAirway(airway);
  //
  //     const to = (await db.searchWaypoint('DVR'))[0];
  //
  //     fps.active.pendingAirways.thenTo(to);
  //
  //     const airway2 = (await db.searchAirway('UL9'))[0];
  //
  //     fps.active.pendingAirways.thenAirway(airway2);
  //
  //     const to2 = (await db.searchWaypoint('KONAN'))[1];
  //
  //     fps.active.pendingAirways.thenTo(to2);
  //
  //     const airway3 = (await db.searchAirway('UL607'))[1];
  //
  //     fps.active.pendingAirways.thenAirway(airway3);
  //
  //     const to3 = (await db.searchWaypoint('FERDI'))[0];
  //
  //     fps.active.pendingAirways.thenTo(to3);
  //
  //     const to5 = (await db.searchWaypoint('MATUG'))[0];
  //     const to6 = (await db.searchWaypoint('GUBAX'))[0];
  //     const to7 = (await db.searchWaypoint('BOREP'))[0];
  //     const to8 = (await db.searchWaypoint('ENITA'))[0];
  //     const to9 = (await db.searchWaypoint('PEPIK'))[0];
  //     const to10 = (await db.searchWaypoint('BALAP'))[0];
  //     const to11 = (await db.searchWaypoint('ARGES'))[0];
  //     const to12 = (await db.searchWaypoint('ARTAT'))[0];
  //
  //     fps.active.pendingAirways.thenTo(to5);
  //     fps.active.pendingAirways.thenTo(to6);
  //     fps.active.pendingAirways.thenTo(to7);
  //     fps.active.pendingAirways.thenTo(to8);
  //     fps.active.pendingAirways.thenTo(to9);
  //     fps.active.pendingAirways.thenTo(to10);
  //     fps.active.pendingAirways.thenTo(to11);
  //     fps.active.pendingAirways.thenTo(to12);
  //
  //     const airway4 = (await db.searchAirway('UP975'))[0];
  //
  //     fps.active.pendingAirways.thenAirway(airway4);
  //
  //     const to13 = (await db.searchWaypoint('ERGUN'))[0];
  //
  //     fps.active.pendingAirways.thenTo(to13);
  //
  //     debugger;
  // });
});
