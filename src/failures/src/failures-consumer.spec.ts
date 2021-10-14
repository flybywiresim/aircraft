import { FailuresConsumer } from './failures-consumer';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';

describe('FailuresConsumer', () => {
    describe('registers an identifier', () => {
        test('with callback', () => {
            const c = consumer();
            expect(() => c.register(1, (_) => {})).not.toThrow();
        });

        test('without callback', () => {
            const c = consumer();
            expect(() => c.register(1)).not.toThrow();
        });

        test('unless registered multiple times', () => {
            const c = consumer();
            c.register(1);

            expect(() => c.register(1)).toThrow();
        });
    });

    describe('calls the callback', () => {
        test('when the failure is activated', async () => {
            const c = consumer();
            const callback = jest.fn();
            c.register(1, callback);

            await SimVar.SetSimVarValue(activateSimVarName, 'number', 1);
            c.update();

            expect(callback).toHaveBeenCalled();
            expect(callback.mock.calls[0][0]).toBe(true);
        });

        test('when the failure is deactivated', async () => {
            const c = consumer();
            const callback = jest.fn();
            c.register(1, callback);

            await SimVar.SetSimVarValue(deactivateSimVarName, 'number', 1);
            c.update();

            expect(callback).toHaveBeenCalled();
            expect(callback.mock.calls[0][0]).toBe(false);
        });
    });

    describe('indicates a failure is', () => {
        test('inactive when never activated', () => {
            const c = consumer();
            c.register(1, (_) => {});

            c.update();

            expect(c.isActive(1)).toBe(false);
        });

        test('active when activated', async () => {
            const c = consumer();
            c.register(1, (_) => {});

            await SimVar.SetSimVarValue(activateSimVarName, 'number', 1);
            c.update();

            expect(c.isActive(1)).toBe(true);
        });

        test('inactive when deactivated', async () => {
            const c = consumer();
            c.register(1, (_) => {});

            await SimVar.SetSimVarValue(activateSimVarName, 'number', 1);
            c.update();

            await SimVar.SetSimVarValue(deactivateSimVarName, 'number', 1);
            c.update();

            expect(c.isActive(1)).toBe(false);
        });
    });
});

const prefix = 'PREFIX';
const activateSimVarName = getActivateFailureSimVarName(prefix);
const deactivateSimVarName = getDeactivateFailureSimVarName(prefix);

function consumer() {
    return new FailuresConsumer(prefix);
}
