// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import fetch from 'node-fetch';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { setupNavigraphDatabase } from '@fmgc/flightplanning/new/test/Database';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { loadSingleWaypoint } from '@fmgc/flightplanning/new/segments/enroute/WaypointLoading';
import { dumpFlightPlan } from '@fmgc/flightplanning/new/test/FlightPlan';

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

describe('pending airways entry', () => {
    beforeEach(() => {
        FlightPlanService.reset();
        setupNavigraphDatabase();
    });

    it('inserts an airway', async () => {
        const db = NavigationDatabaseService.activeDatabase;

        await FlightPlanService.newCityPair('CYUL', 'KBOS', 'KJFK');
        await FlightPlanService.setOriginRunway('RW06R');
        await FlightPlanService.setDepartureProcedure('CYUL1');

        const wp = await loadSingleWaypoint('DUNUP', 'WCY    DUNUP');

        await FlightPlanService.nextWaypoint(3, wp);

        FlightPlanService.temporaryInsert();

        FlightPlanService.active.startAirwayEntry(4);

        const airway = (await db.searchAirway('Q903'))[0];

        FlightPlanService.active.pendingAirways.thenAirway(airway);

        const endWp = await loadSingleWaypoint('NOSUT', 'WCY    NOSUT');

        FlightPlanService.active.pendingAirways.thenTo(endWp);

        const airway2 = (await db.searchAirway('Q878'))[0];

        FlightPlanService.active.pendingAirways.thenAirway(airway2);

        const endWp2 = await loadSingleWaypoint('UDBAM', 'WCY    UDBAM');

        FlightPlanService.active.pendingAirways.thenTo(endWp2);

        FlightPlanService.active.pendingAirways.finalize();

        console.log(dumpFlightPlan(FlightPlanService.active));
        // console.log(FlightPlanService.active.pendingAirways.elements);
    });

    it('inserts an airway 2', async () => {
        const db = NavigationDatabaseService.activeDatabase;

        await FlightPlanService.newCityPair('LPPR', 'EGCC', 'EGKK');
        await FlightPlanService.setOriginRunway('RW35');
        await FlightPlanService.setDepartureProcedure('TURO9E');

        FlightPlanService.temporaryInsert();

        const wp1 = (await db.searchFix('TURON'))[0];

        await FlightPlanService.nextWaypoint(3, wp1);

        const a1 = (await db.searchAirway('UP600'))[0];

        FlightPlanService.startAirwayEntry(4);
        FlightPlanService.activeOrTemporary.pendingAirways.thenAirway(a1);

        const wp2 = (await db.searchFix('ASDEB'))[0];

        FlightPlanService.activeOrTemporary.pendingAirways.thenTo(wp2);
        FlightPlanService.activeOrTemporary.pendingAirways.finalize();

        const wp3 = (await db.searchFix('KORUL'))[0];

        await FlightPlanService.nextWaypoint(4, wp3);

        const wp4 = (await db.searchFix('TALIG'))[0];

        await FlightPlanService.nextWaypoint(5, wp4);

        const a2 = (await db.searchAirway('UP620'))[0];

        FlightPlanService.startAirwayEntry(6);
        FlightPlanService.activeOrTemporary.pendingAirways.thenAirway(a2);

        const a3 = (await db.searchAirway('T7'))[2];

        FlightPlanService.activeOrTemporary.pendingAirways.thenAirway(a3);

        const a4 = (await db.searchAirway('L180'))[0];

        FlightPlanService.activeOrTemporary.pendingAirways.thenAirway(a4);

        const a5 = (await db.searchAirway('UN864'))[1];

        FlightPlanService.activeOrTemporary.pendingAirways.thenAirway(a5);

        const wp5 = (await db.searchFix('MONTY'))[2];

        FlightPlanService.activeOrTemporary.pendingAirways.thenTo(wp5);
        FlightPlanService.activeOrTemporary.pendingAirways.finalize();

        console.log(dumpFlightPlan(FlightPlanService.activeOrTemporary));
    });

    it('automatically connects two airways at a matching point', async () => {
        const db = NavigationDatabaseService.activeDatabase;

        const fp = FlightPlanService.active;

        await FlightPlanService.newCityPair('EGLL', 'OMDB', 'OMAA');
        await FlightPlanService.setOriginRunway('RW27R');
        await FlightPlanService.setDepartureProcedure('DET2F');

        FlightPlanService.temporaryInsert();

        FlightPlanService.active.startAirwayEntry(7);

        const airway = (await db.searchAirway('L6'))[0];

        FlightPlanService.active.pendingAirways.thenAirway(airway);

        const to = (await db.searchFix('DVR'))[0];

        FlightPlanService.active.pendingAirways.thenTo(to);

        const airway2 = (await db.searchAirway('UL9'))[0];

        FlightPlanService.active.pendingAirways.thenAirway(airway2);

        const to2 = (await db.searchFix('KONAN'))[1];

        FlightPlanService.active.pendingAirways.thenTo(to2);

        const airway3 = (await db.searchAirway('UL607'))[1];

        FlightPlanService.active.pendingAirways.thenAirway(airway3);

        const to3 = (await db.searchFix('FERDI'))[0];

        FlightPlanService.active.pendingAirways.thenTo(to3);

        const to5 = (await db.searchFix('MATUG'))[0];
        const to6 = (await db.searchFix('GUBAX'))[0];
        const to7 = (await db.searchFix('BOREP'))[0];
        const to8 = (await db.searchFix('ENITA'))[0];
        const to9 = (await db.searchFix('PEPIK'))[0];
        const to10 = (await db.searchFix('BALAP'))[0];
        const to11 = (await db.searchFix('ARGES'))[0];
        const to12 = (await db.searchFix('ARTAT'))[0];

        FlightPlanService.active.pendingAirways.thenTo(to5);
        FlightPlanService.active.pendingAirways.thenTo(to6);
        FlightPlanService.active.pendingAirways.thenTo(to7);
        FlightPlanService.active.pendingAirways.thenTo(to8);
        FlightPlanService.active.pendingAirways.thenTo(to9);
        FlightPlanService.active.pendingAirways.thenTo(to10);
        FlightPlanService.active.pendingAirways.thenTo(to11);
        FlightPlanService.active.pendingAirways.thenTo(to12);

        const airway4 = (await db.searchAirway('UP975'))[0];

        FlightPlanService.active.pendingAirways.thenAirway(airway4);

        const to13 = (await db.searchFix('ERGUN'))[0];

        FlightPlanService.active.pendingAirways.thenTo(to13);

        debugger;
    });
});
