import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { testFlightPlanService } from './test/TestFlightPlanService';
import { NavigationDatabaseService } from './NavigationDatabaseService';
import { FlightPlanIndex } from './FlightPlanManager';
import { FlightPlanRpcClient } from '@fmgc/flightplanning/rpc/FlightPlanRpcClient';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/A320FlightPlanPerformanceData';
import { FlightPlanRpcServer } from '@fmgc/flightplanning/rpc/FlightPlanRpcServer';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';

describe('FlightPlanInterface', () => {
  const server = new FlightPlanRpcServer(testEventBus, testFlightPlanService);
  const client = new FlightPlanRpcClient(testEventBus, new A320FlightPlanPerformanceData());

  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(async () => {
    await testFlightPlanService.reset();
  });

  afterAll(() => {
    client.destroy();
    server.destroy();
  });

  describe.each([
    { name: 'service', interface: testFlightPlanService },
    { name: 'rpc client', interface: client },
  ])('integration test of $name', ({ interface: flightPlanInterface }) => {
    it('correctly syncs plan initialization with from/to', async () => {
      await flightPlanInterface.newCityPair('CYYZ', 'CYVR', undefined, FlightPlanIndex.Uplink);

      expect(flightPlanInterface.uplink.originAirport.ident).toBe('CYYZ');
      expect(flightPlanInterface.uplink.destinationAirport.ident).toBe('CYVR');
    });

    it('correctly syncs runway changes', async () => {
      await flightPlanInterface.newCityPair('CYYZ', 'CYVR', undefined, FlightPlanIndex.Uplink);
      await flightPlanInterface.setOriginRunway('CYYZ06R', FlightPlanIndex.Uplink);

      expect(flightPlanInterface.uplink.originRunway.ident).toBe('CYYZ06R');
    });

    it('correctly syncs airway entries', async () => {
      await flightPlanInterface.newCityPair('CYYZ', 'CYVR', undefined, FlightPlanIndex.Uplink);

      const fix = await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS');
      await flightPlanInterface.nextWaypoint(0, fix[0], FlightPlanIndex.Uplink);

      await flightPlanInterface.startAirwayEntry(1, FlightPlanIndex.Uplink);
      expect(flightPlanInterface.uplink.pendingAirways).not.toBeUndefined();
    });

    it('can insert an airway ', async () => {
      await flightPlanInterface.newCityPair('CYYZ', 'CYVR', undefined, FlightPlanIndex.Uplink);

      const fix = await NavigationDatabaseService.activeDatabase.searchWaypoint('NOSUS');

      await flightPlanInterface.nextWaypoint(1, fix[0], FlightPlanIndex.Uplink);

      await flightPlanInterface.startAirwayEntry(2, FlightPlanIndex.Uplink);

      const airway = await NavigationDatabaseService.activeDatabase.searchAirway('A1', fix[0]);

      await flightPlanInterface.continueAirwayEntryViaAirway(airway[0], FlightPlanIndex.Uplink);

      const terminationFix = await NavigationDatabaseService.activeDatabase.searchWaypoint('DUTIL');

      await flightPlanInterface.continueAirwayEntryToFix(terminationFix[0], false, FlightPlanIndex.Uplink);

      await flightPlanInterface.finaliseAirwayEntry(FlightPlanIndex.Uplink);

      expect(flightPlanInterface.uplink.legElementAt(2).terminationWaypoint()?.ident).toBe('NOSUS');
      expect(flightPlanInterface.uplink.legElementAt(3).terminationWaypoint()?.ident).toBe('DEBUS');
      expect(flightPlanInterface.uplink.legElementAt(4).terminationWaypoint()?.ident).toBe('DUTIL');
    });
  });
});
