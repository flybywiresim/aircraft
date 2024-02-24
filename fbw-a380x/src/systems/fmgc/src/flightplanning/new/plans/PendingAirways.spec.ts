import fetch from "node-fetch";
import { FlightPlanService } from "@fmgc/flightplanning/new/FlightPlanService";
import { setupNavigraphDatabase } from "@fmgc/flightplanning/new/test/Database";
import { NavigationDatabaseService } from "@fmgc/flightplanning/new/NavigationDatabaseService";
import { loadSingleFix, loadSingleWaypoint } from "@fmgc/flightplanning/new/segments/enroute/WaypointLoading";
import { FlightPlanPerformanceData } from "@fmgc/flightplanning/new/plans/performance/FlightPlanPerformanceData";
import { dumpFlightPlan } from "@fmgc/flightplanning/new/test/FlightPlan";

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

        const fp = FlightPlanService.active;

        await FlightPlanService.newCityPair('CYUL', 'KBOS', 'KJFK');
        await FlightPlanService.setOriginRunway('RW06R');
        await FlightPlanService.setDepartureProcedure('CYUL1');

        const wp = await loadSingleWaypoint('DUNUP', 'WCY    DUNUP');

        FlightPlanService.nextWaypoint(2, wp);

        FlightPlanService.temporaryInsert();

        FlightPlanService.active.startAirwayEntry(3);

        const airway = (await db.searchAirway('Q903'))[0];

        FlightPlanService.active.pendingAirways.thenAirway(airway);

        const endWp = await loadSingleWaypoint('NOSUT', 'WCY    NOSUT');

        FlightPlanService.active.pendingAirways.thenTo(endWp);

        const airway2 = (await db.searchAirway('Q878'))[0];

        FlightPlanService.active.pendingAirways.thenAirway(airway2);

        const endWp2 = await loadSingleWaypoint('UDBAM', 'WCY    UDBAM');

        FlightPlanService.active.pendingAirways.thenTo(endWp2);

        console.log(dumpFlightPlan(FlightPlanService.active));
        console.log(FlightPlanService.active.pendingAirways.elements);
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
    })
});
