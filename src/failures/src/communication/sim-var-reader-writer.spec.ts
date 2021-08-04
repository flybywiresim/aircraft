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
        await expectToBeCalledTimes(0, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', notInCollectionIdentifier);
            r.update();
        });
    });

    test('reads values that are in the collection', async () => {
        await expectToBeCalledTimes(1, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
        });
    });

    test('reads the same value multiple times', async () => {
        await expectToBeCalledTimes(2, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
            r.update();
        });
    });
});

const simVarName = 'L:VARIABLE';
const inCollectionIdentifier = 1;
const notInCollectionIdentifier = 2;

function readerWriter(): SimVarReaderWriter {
    return new SimVarReaderWriter(simVarName);
}

async function expectToBeCalledTimes(length: number, act: (r: CallbackReader) => Promise<void>) {
    const callback = jest.fn();
    const r = readerWriter();
    r.register(inCollectionIdentifier, callback);

    await act(r);

    expect(callback).toHaveBeenCalledTimes(length);
}
