import { FailuresConsumer } from './failures-consumer';

test('can register identifier with callback', () => {
    const c = consumer();
    c.register(1, (_) => {});
});

test('can register identifier without callback', () => {
    const c = consumer();
    c.register(1);
});

test('cannot register identifier twice', () => {
    const c = consumer();
    c.register(1);

    expect(() => c.register(1)).toThrow();
});

test('callback is called when failure activated', async () => {
    const c = consumer();
    const callback = jest.fn();
    c.register(1, callback);

    await SimVar.SetSimVarValue(activateFailure, 'number', 1);
    c.update();

    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0][0]).toBe(true);
});

test('callback is called when failure deactivated', async () => {
    const c = consumer();
    const callback = jest.fn();
    c.register(1, callback);

    await SimVar.SetSimVarValue(deactivateFailure, 'number', 1);
    c.update();

    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0][0]).toBe(false);
});

test('failure is active when activated', async () => {
    const c = consumer();
    c.register(1, (_) => {});

    await SimVar.SetSimVarValue(activateFailure, 'number', 1);
    c.update();

    expect(c.isActive(1)).toBe(true);
});

test('failure is inactive when never activated', () => {
    const c = consumer();
    c.register(1, (_) => {});

    c.update();

    expect(c.isActive(1)).toBe(false);
});

test('failure is inactive when deactivated', async () => {
    const c = consumer();
    c.register(1, (_) => {});

    await SimVar.SetSimVarValue(activateFailure, 'number', 1);
    c.update();

    await SimVar.SetSimVarValue(deactivateFailure, 'number', 1);
    c.update();

    expect(c.isActive(1)).toBe(false);
});

const prefix = 'PREFIX_';
const activateFailure = `${prefix}FAILURE_ACTIVATE`;
const deactivateFailure = `${prefix}FAILURE_DEACTIVATE`;

function consumer() {
    return new FailuresConsumer(prefix);
}
