import { QueuedSimVarReader, SimVarReaderWriter, TransactionReader, QueuedSimVarWriter, TransactionWriter } from '..';
import { flushPromises } from '../../test-functions';

test('read/write', async () => {
    const failureIdentifier = 1;

    const w = writer(failuresToFailableActivateSimVarName);
    const writeCallback = jest.fn();
    w.write(failureIdentifier).then(writeCallback);
    w.update();

    const r = reader(failuresToFailableActivateSimVarName);
    const readCallback = jest.fn();
    r.register(failureIdentifier, readCallback);
    r.update();

    await flushPromises();
    expect(readCallback).toHaveBeenCalled();
    expect(SimVar.GetSimVarValue(failuresToFailableActivateSimVarName, 'number')).toBe(0);

    w.update();

    await flushPromises();
    expect(writeCallback).toHaveBeenCalled();
});

test('transaction read/write', async () => {
    const failureIdentifier = 1;

    const tw = transactionWriter(failuresToOrchestratorActivateSimVarName, failuresToOrchestratorTransactionSimVarName);
    const writeCallback = jest.fn();

    const tr = transactionReader(failuresToOrchestratorActivateSimVarName, failuresToOrchestratorTransactionSimVarName);
    const readCallback = jest.fn();
    tr.register(failureIdentifier, readCallback);

    tw.write(failureIdentifier).then(writeCallback);

    tr.update();
    expect(readCallback).toHaveBeenCalled();
    expect(SimVar.GetSimVarValue(failuresToOrchestratorActivateSimVarName, 'number')).toBe(0);

    await flushPromises();
    expect(SimVar.GetSimVarValue(failuresToOrchestratorTransactionSimVarName, 'number')).toBe(failureIdentifier);

    tw.update();
    await flushPromises();
    tw.update();

    expect(SimVar.GetSimVarValue(failuresToOrchestratorTransactionSimVarName, 'number')).toBe(0);
    await flushPromises();
    expect(writeCallback).toHaveBeenCalled();
});

const failuresToFailableActivateSimVarName = 'L:FAILURES_TO_FAILABLE_ACTIVATE';
const failuresToOrchestratorActivateSimVarName = 'L:FAILURES_TO_ORCHESTRATOR_ACTIVATE';
const failuresToOrchestratorTransactionSimVarName = 'L:FAILURES_ORCHESTRATOR_ACTIVATE_RECEIVED';

function writer(simVarName: string) {
    return new QueuedSimVarWriter(new SimVarReaderWriter(simVarName));
}

function reader(simVarName: string) {
    return new QueuedSimVarReader(new SimVarReaderWriter(simVarName));
}

function transactionReader(simVarName: string, transactionSimVarName: string) {
    return new TransactionReader(
        reader(simVarName),
        new QueuedSimVarWriter(
            new SimVarReaderWriter(transactionSimVarName),
        ),
    );
}

function transactionWriter(simVarName: string, transactionSimVarName: string) {
    return new TransactionWriter(
        new QueuedSimVarWriter(
            new SimVarReaderWriter(simVarName),
        ),
        new SimVarReaderWriter(transactionSimVarName),
    );
}
