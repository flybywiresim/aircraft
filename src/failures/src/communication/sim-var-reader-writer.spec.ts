import { CallbackReader, SimVarReaderWriter } from '.';

describe('SimVarReaderWriter', () => {
    test('reads values', async () => {
        const simVarValue = 1;
        await SimVar.SetSimVarValue(simVarName, 'number', simVarValue);

        expect(readerWriter().read()).toBe(simVarValue);
    });

    test('writes values', async () => {
        const value = 1;
        await readerWriter().write(value);

        expect(SimVar.GetSimVarValue(simVarName, 'number')).toBe(value);
    });

    test("does't read values which aren't in the collection", async () => {
        const callback = jest.fn();
        await registerAndExecute(callback, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', notInCollectionIdentifier);
            r.update();
        });

        expect(callback).not.toHaveBeenCalled();
    });

    test('reads values that are in the collection', async () => {
        const callback = jest.fn();
        await registerAndExecute(callback, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
        });

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('reads the same value multiple times', async () => {
        const callback = jest.fn();
        await registerAndExecute(callback, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
            r.update();
        });

        expect(callback).toHaveBeenCalledTimes(2);
    });
});

const simVarName = 'L:VARIABLE';
const inCollectionIdentifier = 1;
const notInCollectionIdentifier = 2;

function readerWriter(): SimVarReaderWriter {
    return new SimVarReaderWriter(simVarName);
}

async function registerAndExecute(callback: () => void, act: (r: CallbackReader) => Promise<void>) {
    const r = readerWriter();
    r.register(inCollectionIdentifier, callback);

    await act(r);
}
