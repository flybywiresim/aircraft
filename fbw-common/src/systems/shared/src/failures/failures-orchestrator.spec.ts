import { FailuresOrchestrator } from '.';
import { flushPromises } from './test-functions';

// mock enough of JS GenericDataListener to ensure the right calls are made for JS interop
const genericDataListenerSend = jest.fn();
jest.mock('../GenericDataListenerSync', () => ({
  GenericDataListenerSync: jest.fn().mockImplementation(() => {
    return {
      sendEvent: genericDataListenerSend,
    };
  }),
}));

let sendRequestForFailures = undefined;

global.RegisterViewListener = (name: string, callback?: any): ViewListener.ViewListener => {
  callback({
    on: (topic, requestFailuresCallback) => (sendRequestForFailures = requestFailuresCallback),
  });
  return undefined as any;
};

// mock enough of COMM BUS to ensure the right calls are made for WASM interop
const failuresUpdateReceiver = jest.fn();
(global as any).RegisterGenericDataListener = jest.fn();
(global as any).Coherent = {
  call: (event, data0, data1) => {
    if (event === 'COMM_BUS_WASM_CALLBACK' && data0 === 'FBW_FAILURE_UPDATE') {
      failuresUpdateReceiver(data1);
    }
  },
};

describe('FailuresOrchestrator', () => {
  test('stores configured failures', () => {
    const o = orchestrator();

    const allFailures = o.getAllFailures();
    expect(allFailures).toHaveLength(1);
    expect(allFailures[0]).toMatchObject({
      ata: 0,
      identifier: 123,
      name: 'test',
    });
  });

  describe('indicates a failure is', () => {
    test('inactive when never activated', () => {
      const o = orchestrator();
      expect(o.isActive(identifier)).toBe(false);
    });

    test('active when activated', async () => {
      const o = orchestrator();

      await activateFailure(o);

      expect(o.isActive(identifier)).toBe(true);
    });

    test('inactive when deactivated', async () => {
      const o = orchestrator();
      // First activate the failure to ensure we're not just observing
      // the lack of any change.
      await activateFailure(o);

      await deactivateFailure(o);

      expect(o.isActive(identifier)).toBe(false);
    });
  });

  describe('sends failures over commbus', () => {
    it('sends failures when requested', async () => {
      const o = orchestrator();

      o.update();

      failuresUpdateReceiver.mockReset();
      sendRequestForFailures();

      o.update();

      expect(failuresUpdateReceiver).toHaveBeenCalledTimes(1);
      expect(failuresUpdateReceiver.mock.lastCall[0]).toBe('[]');
    });

    it('sends failures when failures change', async () => {
      const o = orchestrator();

      o.update();

      failuresUpdateReceiver.mockReset();

      activateFailure(o);

      o.update();

      expect(failuresUpdateReceiver).toHaveBeenCalledTimes(1);
      expect(failuresUpdateReceiver.mock.lastCall[0]).toBe('[123]');
    });
  });

  describe('sends failures over generic data listener sync', () => {
    it('sends failures when requested', async () => {
      const o = orchestrator();

      o.update();

      genericDataListenerSend.mockReset();
      sendRequestForFailures();

      o.update();

      expect(genericDataListenerSend).toHaveBeenCalledTimes(1);
      expect(genericDataListenerSend.mock.lastCall[0]).toBe('FBW_FAILURE_UPDATE');
      expect(genericDataListenerSend.mock.lastCall[1]).toEqual([]);
    });

    it('sends failures when failures change', async () => {
      const o = orchestrator();

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

function orchestrator() {
  return new FailuresOrchestrator([[0, identifier, name]]);
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
