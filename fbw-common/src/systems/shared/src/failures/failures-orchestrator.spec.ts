import { describe, test, expect, vitest } from 'vitest';
import { FailuresOrchestrator } from '.';
import { flushPromises } from './test-functions';

// mock enough of JS GenericDataListener to ensure the right calls are made for JS interop
const genericDataListenerSend = vitest.fn();
vitest.mock('../GenericDataListenerSync', () => ({
  GenericDataListenerSync: vitest.fn().mockImplementation(() => {
    return {
      sendEvent: genericDataListenerSend,
    };
  }),
}));

let sendRequestForFailures = undefined;

vitest.mock('../ViewListenerUtils', () => ({
  ViewListenerUtils: {
    getListener: () =>
      Promise.resolve({
        on: (topic, requestFailuresCallback) => (sendRequestForFailures = requestFailuresCallback),
      }),
  },
}));

// mock enough of COMM BUS to ensure the right calls are made for WASM interop
const failuresUpdateReceiver = vitest.fn();
(global as any).RegisterGenericDataListener = vitest.fn();
(global as any).Coherent = {
  call: (event, data0, data1) => {
    if (event === 'COMM_BUS_WASM_CALLBACK' && data0 === 'FBW_FAILURE_UPDATE') {
      failuresUpdateReceiver(data1);
    }
  },
};

describe('FailuresOrchestrator', () => {
  test('stores configured failures', async () => {
    const o = await orchestrator();

    const allFailures = o.getAllFailures();
    expect(allFailures).toHaveLength(1);
    expect(allFailures[0]).toMatchObject({
      ata: 0,
      identifier: 123,
      name: 'test',
    });
  });

  describe('indicates a failure is', () => {
    test('inactive when never activated', async () => {
      const o = await orchestrator();
      expect(o.isActive(identifier)).toBe(false);
    });

    test('active when activated', async () => {
      const o = await orchestrator();

      await activateFailure(o);

      expect(o.isActive(identifier)).toBe(true);
    });

    test('inactive when deactivated', async () => {
      const o = await orchestrator();
      // First activate the failure to ensure we're not just observing
      // the lack of any change.
      await activateFailure(o);

      await deactivateFailure(o);

      expect(o.isActive(identifier)).toBe(false);
    });
  });

  describe('sends failures over commbus', () => {
    test('sends failures when requested', async () => {
      const o = await orchestrator();

      o.update();

      failuresUpdateReceiver.mockReset();
      sendRequestForFailures();

      o.update();

      expect(failuresUpdateReceiver).toHaveBeenCalledTimes(1);
      expect(failuresUpdateReceiver.mock.lastCall[0]).toBe('[]');
    });

    test('sends failures when failures change', async () => {
      const o = await orchestrator();

      o.update();

      failuresUpdateReceiver.mockReset();

      activateFailure(o);

      o.update();

      expect(failuresUpdateReceiver).toHaveBeenCalledTimes(1);
      expect(failuresUpdateReceiver.mock.lastCall[0]).toBe('[123]');
    });
  });

  describe('sends failures over generic data listener sync', () => {
    test('sends failures when requested', async () => {
      const o = await orchestrator();

      o.update();

      genericDataListenerSend.mockReset();
      sendRequestForFailures();

      o.update();

      expect(genericDataListenerSend).toHaveBeenCalledTimes(1);
      expect(genericDataListenerSend.mock.lastCall[0]).toBe('FBW_FAILURE_UPDATE');
      expect(genericDataListenerSend.mock.lastCall[1]).toEqual([]);
    });

    test('sends failures when failures change', async () => {
      const o = await orchestrator();

      o.update();

      genericDataListenerSend.mockReset();

      activateFailure(o);

      o.update();

      expect(genericDataListenerSend).toHaveBeenCalledTimes(1);
      expect(genericDataListenerSend.mock.lastCall[0]).toBe('FBW_FAILURE_UPDATE');
      expect(genericDataListenerSend.mock.lastCall[1]).toEqual([123]);
    });
  });
});

const identifier = 123;
const name = 'test';

async function orchestrator() {
  const orch = new FailuresOrchestrator([[0, identifier, name]]);
  await flushPromises();
  return orch;
}

function activateFailure(o: FailuresOrchestrator) {
  return activateOrDeactivateFailure(o, true);
}

function deactivateFailure(o: FailuresOrchestrator) {
  return activateOrDeactivateFailure(o, false);
}

async function activateOrDeactivateFailure(o: FailuresOrchestrator, activate: boolean) {
  const promise = activate ? o.activate(identifier) : o.deactivate(identifier);
  await flushPromises();
  o.update();

  await promise;
}
