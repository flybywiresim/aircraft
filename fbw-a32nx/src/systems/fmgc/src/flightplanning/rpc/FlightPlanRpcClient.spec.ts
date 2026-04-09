import { afterAll, describe, expect, it, vi } from 'vitest';
import { FlightPlanRemoteClientRpcEvents, FlightPlanRpcClient } from '@fmgc/flightplanning/rpc/FlightPlanRpcClient';
import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';
import { A320FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/A320FlightPlanPerformanceData';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanServerRpcEvents } from '@fmgc/flightplanning/rpc/FlightPlanRpcServer';

describe('FlightPlanRpcClient', () => {
  const client = new FlightPlanRpcClient(testEventBus, new A320FlightPlanPerformanceData(), false);

  afterAll(() => {
    client.destroy();
  });

  it('sends a command to the server correctly', async ({ onTestFinished }) => {
    const handlerFn = vi.fn(
      ([, id]: FlightPlanRemoteClientRpcEvents<A320FlightPlanPerformanceData>['flightPlanRemoteClient_rpcCommand']) => {
        testEventBus.getPublisher<FlightPlanServerRpcEvents>().pub('flightPlanServer_rpcCommandResponse', [id, void 0]);
      },
    );

    const sub = testEventBus
      .getSubscriber<FlightPlanRemoteClientRpcEvents<A320FlightPlanPerformanceData>>()
      .on('flightPlanRemoteClient_rpcCommand')
      .handle(handlerFn);
    onTestFinished(() => sub.destroy());

    await client.newCityPair('ABCD', 'EFGH', undefined, FlightPlanIndex.Active);

    expect(handlerFn).toHaveBeenCalledExactlyOnceWith([
      'newCityPair',
      expect.stringMatching(/\w+/),
      'ABCD',
      'EFGH',
      undefined,
      0,
    ]);
  });

  it('rejects if an error is thrown', async ({ onTestFinished }) => {
    const handlerFn = vi.fn(
      ([, id]: FlightPlanRemoteClientRpcEvents<A320FlightPlanPerformanceData>['flightPlanRemoteClient_rpcCommand']) => {
        testEventBus
          .getPublisher<FlightPlanServerRpcEvents>()
          .pub('flightPlanServer_rpcCommandErrorResponse', [id, 'error']);
      },
    );

    const sub = testEventBus
      .getSubscriber<FlightPlanRemoteClientRpcEvents<A320FlightPlanPerformanceData>>()
      .on('flightPlanRemoteClient_rpcCommand')
      .handle(handlerFn);
    onTestFinished(() => sub.destroy());

    await expect(client.newCityPair('ABCD', 'EFGH', undefined, FlightPlanIndex.Active)).rejects.toThrow('error');

    expect(handlerFn).toHaveBeenCalledExactlyOnceWith([
      'newCityPair',
      expect.stringMatching(/\w+/),
      'ABCD',
      'EFGH',
      undefined,
      0,
    ]);
  });
});
