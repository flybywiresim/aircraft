// import { FailuresOrchestrator } from './failures-orchestrator';

import { FailuresOrchestrator } from '.';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';
import { flushPromises } from './test-functions';

test('added failures can be retrieved', () => {
    const o = orchestrator();

    expect(o.getFailures().size).toBe(1);
    expect(o.getFailures().values().next().value).toMatchObject({
        identifier,
        name,
    });
});

test('failure which hasn\'t been activated is inactive', async () => {
    const o = orchestrator();
    expect(o.isActive(identifier)).toBe(false);
});

test('activates failures', async () => {
    const o = orchestrator();

    await activateFailure(o);

    expect(o.isActive(identifier)).toBe(true);
});

test('deactivates failures', async () => {
    const o = orchestrator();
    // First activate the failure to ensure we're not just observing
    // the lack of any change.
    await activateFailure(o);

    await deactivateFailure(o);

    expect(o.isActive(identifier)).toBe(false);
});

test('is changing while failure is activating', async () => {
    isChangingOn((o) => o.activate(identifier));
});

test('is changing while failure is deactivating', async () => {
    isChangingOn((o) => o.deactivate(identifier));
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

async function isChangingOn(actionFn: (o: FailuresOrchestrator) => Promise<void>) {
    const o = orchestrator();
    expect(o.isChanging(identifier)).toBe(false);

    const promise = actionFn(o);
    expect(o.isChanging(identifier)).toBe(true);
    await flushPromises();
    await SimVar.SetSimVarValue(deactivateSimVarName, 'number', 0);
    o.update();

    await promise;
    expect(o.isChanging(identifier)).toBe(false);
}
