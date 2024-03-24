import { QueuedSimVarReader } from '.';
import { SimVarReaderWriter } from '..';

describe('QueuedSimVarReader', () => {
    test("doesn't read values not found in its collection", async () => {
        const callback = jest.fn();
        await registerAndExecute(callback, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', notInCollectionIdentifier);
            r.update();
        });

        expect(callback).not.toHaveBeenCalled();
    });

    test('reads values found in its collection', async () => {
        const callback = jest.fn();
        await registerAndExecute(callback, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
        });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test("doesn't read the same value multiple times", async () => {
        const callback = jest.fn();
        await registerAndExecute(callback, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
            r.update();
        });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('does read the same value multiple times when set again', async () => {
        const callback = jest.fn();
        await registerAndExecute(callback, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();

            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
        });

        expect(callback).toHaveBeenCalledTimes(2);
    });
});

const inCollectionIdentifier = 1;
const notInCollectionIdentifier = 2;

async function registerAndExecute(callback: () => void, act: (r: QueuedSimVarReader) => Promise<void>) {
    const r = reader();
    r.register(inCollectionIdentifier, callback);

    await act(r);
}

const simVarName = 'L:SIMVAR';

function reader() {
    return new QueuedSimVarReader(new SimVarReaderWriter(simVarName));
}
