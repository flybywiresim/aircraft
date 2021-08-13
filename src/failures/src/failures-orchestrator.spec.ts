import { FailuresOrchestrator } from '.';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';
import { flushPromises } from './test-functions';

describe('FailuresOrchestrator', () => {
    test('stores configured failures', () => {
        const o = orchestrator();

        const allFailures = o.getAllFailures();
        expect(allFailures).toHaveLength(1);
        expect(allFailures[0]).toMatchObject({
            identifier,
            name,
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

        describe('changing', () => {
            test('while failure is activating', async () => {
                const o = orchestrator();

                expect(o.isChanging(identifier)).toBe(false);

                const promise = o.activate(identifier);

                expect(o.isChanging(identifier)).toBe(true);

                await flushPromises();
                await SimVar.SetSimVarValue(activateSimVarName, 'number', 0);
                o.update();
                await promise;

                expect(o.isChanging(identifier)).toBe(false);
            });

            test('while failure is deactivating', async () => {
                const o = orchestrator();

                expect(o.isChanging(identifier)).toBe(false);

                const promise = o.deactivate(identifier);

                expect(o.isChanging(identifier)).toBe(true);

                await flushPromises();
                await SimVar.SetSimVarValue(deactivateSimVarName, 'number', 0);
                o.update();
                await promise;

                expect(o.isChanging(identifier)).toBe(false);
            });
        });
    });
});

const prefix = 'PREFIX';
const activateSimVarName = getActivateFailureSimVarName(prefix);
const deactivateSimVarName = getDeactivateFailureSimVarName(prefix);

const identifier = 123;
const name = 'test';

function orchestrator() {
    return new FailuresOrchestrator(prefix, [[identifier, name]]);
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
    await SimVar.SetSimVarValue(activate ? activateSimVarName : deactivateSimVarName, 'number', 0);
    o.update();

    await promise;
}
