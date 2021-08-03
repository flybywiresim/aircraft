import { FailuresConsumer } from './failures-consumer';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';

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

    await SimVar.SetSimVarValue(activateSimVarName, 'number', 1);
    c.update();

    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0][0]).toBe(true);
});

test('callback is called when failure deactivated', async () => {
    const c = consumer();
    const callback = jest.fn();
    c.register(1, callback);

    await SimVar.SetSimVarValue(deactivateSimVarName, 'number', 1);
    c.update();

    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0][0]).toBe(false);
});

test('failure is active when activated', async () => {
    const c = consumer();
    c.register(1, (_) => {});

    await SimVar.SetSimVarValue(activateSimVarName, 'number', 1);
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

    await SimVar.SetSimVarValue(activateSimVarName, 'number', 1);
    c.update();

    await SimVar.SetSimVarValue(deactivateSimVarName, 'number', 1);
    c.update();

    expect(c.isActive(1)).toBe(false);
});

const prefix = 'PREFIX';
const activateSimVarName = getActivateFailureSimVarName(prefix);
const deactivateSimVarName = getDeactivateFailureSimVarName(prefix);

function consumer() {
    return new FailuresConsumer(prefix);
}
