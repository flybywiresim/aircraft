import { FailuresOrchestrator, RemoteFailuresProvider } from '.';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';
import { FailuresProvider } from './failures-provider';

export function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

const prefix = 'PREFIX';
export const activateSimVarName = getActivateFailureSimVarName(prefix);
export const deactivateSimVarName = getDeactivateFailureSimVarName(prefix);

export const identifier = 123;
const name = 'test';

export function orchestrator() {
    return new FailuresOrchestrator(prefix, [[identifier, name]]);
}

export function remoteProvider() {
    return new RemoteFailuresProvider(prefix, [[identifier, name]]);
}

export function activateFailure(o: FailuresProvider) {
    return activateOrDeactivateFailure(o, true);
}

export function deactivateFailure(o: FailuresProvider) {
    return activateOrDeactivateFailure(o, false);
}

async function activateOrDeactivateFailure(o: FailuresProvider, activate: boolean) {
    const promise = activate ? o.activate(identifier) : o.deactivate(identifier);
    await flushPromises();
    await SimVar.SetSimVarValue(activate ? activateSimVarName : deactivateSimVarName, 'number', 0);

    if (o instanceof FailuresOrchestrator) {
        o.update();
    }

    await promise;
}

export function remoteActivateFailure(o: FailuresOrchestrator, rfp: RemoteFailuresProvider) {
    return remoteActivateOrDeactivateFailure(o, rfp, true);
}

export function remoteDeactivateFailure(o: FailuresOrchestrator, rfp: RemoteFailuresProvider) {
    return remoteActivateOrDeactivateFailure(o, rfp, false);
}

async function remoteActivateOrDeactivateFailure(o: FailuresOrchestrator, rfp: RemoteFailuresProvider, activate: boolean) {
    const promise = activate ? rfp.activate(identifier) : rfp.deactivate(identifier);
    await flushPromises();
    await SimVar.SetSimVarValue(activate ? activateSimVarName : deactivateSimVarName, 'number', 0);

    o.update();

    await promise;
}
