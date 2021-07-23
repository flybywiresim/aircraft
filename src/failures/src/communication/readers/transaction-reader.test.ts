import { QueuedSimVarReader, SimVarReader, TransactionReader } from '.';
import { CallbackReader, QueuedSimVarWriter, SimVarWriter } from '..';
import { flushPromises } from '../../test-functions';

test('confirms receival', async () => {
    const failureIdentifier = 1;
    const r = reader();
    r.register(failureIdentifier, () => {});

    await SimVar.SetSimVarValue(failuresSimVar, 'number', failureIdentifier);
    r.update();

    await flushPromises();
    expect(SimVar.GetSimVarValue(transactionSimVar, 'number')).toBe(failureIdentifier);
});

test('when a value is read, the registered callback is called', async () => {
    const failureIdentifier = 1;
    const r = reader();
    const callback = jest.fn();
    r.register(failureIdentifier, callback);

    await SimVar.SetSimVarValue(failuresSimVar, 'number', failureIdentifier);
    r.update();

    await flushPromises();
    expect(callback).toBeCalled();
});

const failuresSimVar = 'L:FAILURES_TO_ORCHESTRATOR_ACTIVATE';
const transactionSimVar = 'L:FAILURES_ORCHESTRATOR_ACTIVATE_RECEIVED';

function reader(): CallbackReader {
    return new TransactionReader(
        new QueuedSimVarReader(
            new SimVarReader(failuresSimVar),
            new SimVarWriter(failuresSimVar),
        ),
        new QueuedSimVarWriter(
            new SimVarReader(transactionSimVar),
            new SimVarWriter(transactionSimVar),
        ),
    );
}
