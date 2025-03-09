import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlightPlanRpcServer } from '@fmgc/flightplanning/rpc/FlightPlanRpcServer';
import { testEventBus, testFlightPlanService } from '@fmgc/flightplanning/test/TestFlightPlanService';
import { FlightPlanRpcClient } from '@fmgc/flightplanning/rpc/FlightPlanRpcClient';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { setupTestDatabase } from '@fmgc/flightplanning/test/Database';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

describe('rpc client', () => {
  const server = new FlightPlanRpcServer(testEventBus, testFlightPlanService);
  const client = new FlightPlanRpcClient(testEventBus, new A320FlightPlanPerformanceData());

  beforeAll(() => {
    setupTestDatabase();
  });

  beforeEach(() => {
    testFlightPlanService.reset();
  });

  it('receives plan deletion and creation events', async () => {
    await testFlightPlanService.deleteAll();

    expect(() => client.active).toThrow();
    expect(() => client.secondary(0)).toThrow();

    testFlightPlanService.createFlightPlans();

    expect(() => client.active).not.toThrow();
    expect(() => client.secondary(0)).not.toThrow();
  });

  it('correctly syncs plan initialization with from /to', async () => {
    await client.newCityPair('CYYZ', 'CYVR', undefined, FlightPlanIndex.Uplink);

    expect(testFlightPlanService.uplink.originAirport.ident).toBe('CYYZ');
    expect(testFlightPlanService.uplink.destinationAirport.ident).toBe('CYVR');
    expect(client.uplink.originAirport.ident).toBe('CYYZ');
    expect(client.uplink.destinationAirport.ident).toBe('CYVR');
  });

  it('correctly syncs runway changes', async () => {
    await client.newCityPair('CYYZ', 'CYVR', undefined, FlightPlanIndex.Uplink);
    await client.setOriginRunway('CYYZ06R', FlightPlanIndex.Uplink);

    expect(testFlightPlanService.uplink.originRunway.ident).toBe('CYYZ06R');
    expect(client.uplink.originRunway.ident).toBe('CYYZ06R');
  });
});
