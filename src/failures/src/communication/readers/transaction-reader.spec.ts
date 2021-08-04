import { QueuedSimVarReader, TransactionReader } from '.';
import { CallbackReader, SimVarReaderWriter, QueuedSimVarWriter } from '..';
import { flushPromises } from '../../test-functions';

describe('TransactionReader', () => {
    test('confirms receival', async () => {
        const failureIdentifier = 1;
        const r = reader();
        r.register(failureIdentifier, () => {});

        await SimVar.SetSimVarValue(failuresSimVar, 'number', failureIdentifier);
        r.update();
        await flushPromises();

        expect(SimVar.GetSimVarValue(transactionSimVar, 'number')).toBe(failureIdentifier);
    });

    test('calls the registered callback when a value is read', async () => {
        const failureIdentifier = 1;
        const r = reader();
        const callback = jest.fn();
        r.register(failureIdentifier, callback);

        await SimVar.SetSimVarValue(failuresSimVar, 'number', failureIdentifier);
        r.update();
        await flushPromises();

        expect(callback).toHaveBeenCalled();
    });
});

const failuresSimVar = 'L:FAILURES_TO_ORCHESTRATOR_ACTIVATE';
const transactionSimVar = 'L:FAILURES_ORCHESTRATOR_ACTIVATE_RECEIVED';

function reader(): CallbackReader {
    return new TransactionReader(
        new QueuedSimVarReader(
            new SimVarReaderWriter(failuresSimVar),
        ),
        new QueuedSimVarWriter(
            new SimVarReaderWriter(transactionSimVar),
        ),
    );
}
