import { TransactionWriter } from './transaction-writer';
import { SimVarReaderWriter, Updatable, Writer, QueuedSimVarWriter } from '..';
import { flushPromises } from '../../test-functions';

describe('TransationWriter', () => {
    test('waits for receival confirmation', async () => {
        const failureIdentifier = 1;
        const w = writer();

        const write = await writeAndConsumeValue(w, failureIdentifier);
        const callback = jest.fn();
        write.innerPromise.then(callback);

        updateWriter(w, retryAfterNumberOfUpdates - 1);

        await flushPromises();
        expect(callback).not.toHaveBeenCalled();

        await confirmReceival(w, failureIdentifier);
        await flushPromises();

        expect(callback).toHaveBeenCalled();
    });

    test('clears the receival confirmation', async () => {
        const failureIdentifier = 1;
        const w = writer();

        const write = await writeAndConsumeValue(w, failureIdentifier);
        await confirmReceival(w, failureIdentifier);
        await write.innerPromise;

        expect(receivalConfirmationSimVar()).toBe(0);
    });

    test('retries when receival not confirmed', async () => {
        const failureIdentifier = 1;
        const w = writer();

        const write = await writeAndConsumeValue(w, failureIdentifier);
        const callback = jest.fn();
        const promise = write.innerPromise.then(callback);

        updateWriter(w, retryAfterNumberOfUpdates);

        await flushPromises();
        expect(callback).not.toHaveBeenCalled();
        expect(await waitForWriteAndConsumeValue(w, failureIdentifier)).toBe(true);

        await confirmReceival(w, failureIdentifier);
        await promise;

        expect(callback).toHaveBeenCalled();
    });
});

const simVarName = 'L:SIMVAR';
const transactionSimVarName = 'L:SIMVAR_CONFIRMATION';
const retryAfterNumberOfUpdates = 30;

function writer(): Writer & Updatable {
    return new TransactionWriter(
        new QueuedSimVarWriter(
            new SimVarReaderWriter(simVarName),
        ),
        new SimVarReaderWriter(transactionSimVarName),
        retryAfterNumberOfUpdates,
    );
}

async function writeAndConsumeValue(writer: Writer & Updatable, value: number): Promise<{ innerPromise: Promise<void> }> {
    const promise = writer.write(value);

    await waitForWriteAndConsumeValue(writer, value);

    return { innerPromise: promise };
}

async function waitForWriteAndConsumeValue(writer: Writer & Updatable, value: number) {
    // Performs the write from the queue.
    writer.update();

    // Observe the write by letting any pending promise callbacks run.
    await flushPromises();

    const consumed = await consumeSimVarValue(value);

    // Observes the value was consumed.
    writer.update();

    // Let any code execution by the write happen.
    await flushPromises();

    return consumed;
}

async function consumeSimVarValue(expected: number) {
    if (SimVar.GetSimVarValue(simVarName, 'number') === expected) {
        await SimVar.SetSimVarValue(simVarName, 'number', 0);
        return true;
    }

    return false;
}

async function confirmReceival(writer: Writer & Updatable, failureIdentifier: number) {
    await SimVar.SetSimVarValue(transactionSimVarName, 'number', failureIdentifier);
    writer.update();
}

function receivalConfirmationSimVar() {
    return SimVar.GetSimVarValue(transactionSimVarName, 'number');
}

function updateWriter(writer: Writer & Updatable, times: number) {
    for (let i = 0; i < times; i++) {
        writer.update();
    }
}
