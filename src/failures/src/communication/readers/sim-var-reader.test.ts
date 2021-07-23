import { SimVarReader } from '.';
import { CallbackReader } from '..';

test('does not read a value that is not in the collection', async () => {
    await expectToBeCalledTimes(0, async (r) => {
        await SimVar.SetSimVarValue(simVarName, 'number', notInCollectionIdentifier);
        r.update();
    });
});

test('reads a value that is in the collection', async () => {
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

const simVarName = 'L:VARIABLE';
const inCollectionIdentifier = 1;
const notInCollectionIdentifier = 2;

function reader(): CallbackReader {
    return new SimVarReader(simVarName);
}

async function expectToBeCalledTimes(length: number, act: (r: CallbackReader) => Promise<void>) {
    const callback = jest.fn();
    const r = reader();
    r.register(inCollectionIdentifier, callback);

    await act(r);

    expect(callback).toHaveBeenCalledTimes(length);
}
