import { flushPromises } from '../../test-functions';
import { QueuedSimVarWriter } from '.';
import { SimVarReaderWriter } from '..';

describe('QueuedSimVarWriter', () => {
    test('writes values', async () => {
        const w = writer();
        w.write(1);

        expect(await consumeSimVarValueAndUpdate(w, 1)).toBe(true);
    });

    test('when empty immediately writes a value without requiring an update', async () => {
        const w = writer();
        w.write(1);

        expect(await consumeSimVarValue(1)).toBe(true);
    });

    test("doesn't overwrite a value waiting for consumption", async () => {
        const w = writer();
        w.write(1);
        w.write(2);

        // Try consuming 2, which isn't yet written and therefore will be unsuccessful.
        expect(await consumeSimVarValueAndUpdate(w, 2)).toBe(false);
    });

    test('writes the next value after consumption of the previous value', async () => {
        const w = writer();
        w.write(1);
        w.write(2);

        await consumeSimVarValueAndUpdate(w, 1);

        expect(await consumeSimVarValue(2)).toBe(true);
    });

    test('resolves the write as soon as the write and consumption are observed', async () => {
        const w = writer();
        const promise = w.write(1);

        // Performs the write from the queue.
        w.update();

        // Observe the write by letting any pending promise callbacks run.
        await flushPromises();

        await consumeSimVarValue(1);

        // Observes the value was consumed.
        w.update();

        await promise;
    });
});

const simVarName = 'L:SIMVAR';

function writer() {
    return new QueuedSimVarWriter(new SimVarReaderWriter(simVarName));
}

async function consumeSimVarValue(expected: number) {
    if (SimVar.GetSimVarValue(simVarName, 'number') === expected) {
        await SimVar.SetSimVarValue(simVarName, 'number', 0);
        return true;
    }

    return false;
}

async function consumeSimVarValueAndUpdate(q: QueuedSimVarWriter, expected: number) {
    return consumeSimVarValueAndUpdateInner(q, expected, 0);
}

async function consumeSimVarValueAndUpdateInner(q: QueuedSimVarWriter, expected: number, iteration: number): Promise<boolean> {
    let consumed = false;
    if (await consumeSimVarValue(expected)) {
        consumed = true;
    }

    q.update();
    // Observe the write by letting any pending promise callbacks run.
    await flushPromises();

    if (iteration < 10) {
        consumed = await consumeSimVarValueAndUpdateInner(q, expected, iteration + 1) || consumed;
    }

    return consumed;
}
