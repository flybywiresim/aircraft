import {
    orchestrator,
    remoteProvider,
    activateFailure,
    deactivateFailure,
    activateSimVarName,
    deactivateSimVarName,
    flushPromises,
    identifier, remoteActivateFailure, remoteDeactivateFailure,
} from './test-values';

describe('RemoteFailuresProvider', () => {
    it('is made aware after instantiation of the existing state', async () => {
        const o = orchestrator();

        await activateFailure(o);

        // We rely here on the fact that Coherent triggers are instant in the mocks. In sim, this might
        // take a frame or two to actually be correct - this is good enough for our use
        const rfp = remoteProvider();

        expect(rfp.isActive(identifier)).toBe(true);
    });

    it('is notified about an activated failure', async () => {
        const o = orchestrator();
        const rfp = remoteProvider();

        await activateFailure(o);

        expect(rfp.isActive(identifier)).toBe(true);
    });

    it('is notified about a deactivated failure', async () => {
        const o = orchestrator();
        const rfp = remoteProvider();

        await deactivateFailure(o);

        expect(rfp.isActive(identifier)).toBe(false);
    });

    it('is notified about a changing failure after activation', async () => {
        const o = orchestrator();
        const rfp = remoteProvider();

        const promise = o.activate(identifier);

        expect(rfp.isChanging(identifier)).toBe(true);

        await flushPromises();
        await SimVar.SetSimVarValue(activateSimVarName, 'number', 0);
        o.update();
        await promise;
    });

    it('is notified about a changing failure after deactivation', async () => {
        const o = orchestrator();
        const rfp = remoteProvider();

        await activateFailure(o);

        const promise = o.deactivate(identifier);

        expect(rfp.isChanging(identifier)).toBe(true);

        await flushPromises();
        await SimVar.SetSimVarValue(deactivateSimVarName, 'number', 0);
        o.update();
        await promise;
    });

    it('can remotely activate a failure', async () => {
        const o = orchestrator();
        const rfp = remoteProvider();

        await remoteActivateFailure(o, rfp);

        expect(o.isActive(identifier)).toBe(true);
    });

    it('can remotely deactivate a failure', async () => {
        const o = orchestrator();
        const rfp = remoteProvider();

        await remoteDeactivateFailure(o, rfp);

        expect(o.isActive(identifier)).toBe(false);
    });
});
