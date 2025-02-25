import { FailuresConsumer } from './failures-consumer';

let sendGenericDataEvent = undefined;

jest.mock('../GenericDataListenerSync', () => ({
  GenericDataListenerSync: jest.fn().mockImplementation((recvEventCb?: (topic: string, data: any) => void) => {
    sendGenericDataEvent = recvEventCb;
    return {};
  }),
}));

jest.mock('../GenericDataListenerSync');

describe('FailuresConsumer', () => {
  describe('registers an identifier', () => {
    test('with callback', () => {
      const c = consumer();
      c.register(1, (_) => {});
    });

    test('without callback', () => {
      const c = consumer();
      c.register(1);
    });

    test('unless registered multiple times', () => {
      const c = consumer();
      c.register(1, () => undefined);

      expect(() => c.register(1, () => undefined)).toThrow();
    });
  });

  describe('calls the callback', () => {
    test('when the failure is activated', async () => {
      const c = consumer();
      const callback = jest.fn();
      c.register(1, callback);

      sendGenericDataEvent('FBW_FAILURE_UPDATE', [1]);

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0]).toBe(true);
    });

    test('when the failure is deactivated', async () => {
      const c = consumer();

      sendGenericDataEvent('FBW_FAILURE_UPDATE', [1]);

      const callback = jest.fn();
      c.register(1, callback);

      sendGenericDataEvent('FBW_FAILURE_UPDATE', []);

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0]).toBe(false);
    });
  });

  describe('indicates a failure is', () => {
    test('inactive when never activated', () => {
      const c = consumer();
      c.register(1, (_) => {});

      expect(c.isActive(1)).toBe(false);
    });

    test('active when activated', async () => {
      const c = consumer();
      c.register(1, (_) => {});

      sendGenericDataEvent('FBW_FAILURE_UPDATE', [1]);

      expect(c.isActive(1)).toBe(true);
    });

    test('inactive when deactivated', async () => {
      const c = consumer();
      c.register(1, (_) => {});

      sendGenericDataEvent('FBW_FAILURE_UPDATE', [1]);

      sendGenericDataEvent('FBW_FAILURE_UPDATE', [0]);

      expect(c.isActive(1)).toBe(false);
    });
  });
});

function consumer() {
  return new FailuresConsumer();
}
