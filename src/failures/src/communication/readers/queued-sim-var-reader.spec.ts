import { QueuedSimVarReader } from '.';
import { SimVarReaderWriter } from '..';

describe('QueuedSimVarReader', () => {
    test("doesn't read values not found in its collection", async () => {
        await expectToBeCalledTimes(0, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', notInCollectionIdentifier);
            r.update();
        });
    });

    test('reads values found in its collection', async () => {
        await expectToBeCalledTimes(1, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
        });
    });

    test("doesn't read the same value multiple times", async () => {
        await expectToBeCalledTimes(1, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
            r.update();
        });
    });

    test('does read the same value multiple times when set again', async () => {
        await expectToBeCalledTimes(2, async (r) => {
            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();

            await SimVar.SetSimVarValue(simVarName, 'number', inCollectionIdentifier);
            r.update();
        });
    });
});

const inCollectionIdentifier = 1;
const notInCollectionIdentifier = 2;

async function expectToBeCalledTimes(length: number, act: (r: QueuedSimVarReader) => Promise<void>) {
    const callback = jest.fn();
    const r = reader();
    r.register(inCollectionIdentifier, callback);

    await act(r);

    expect(callback).toHaveBeenCalledTimes(length);
}

const simVarName = 'L:SIMVAR';

function reader() {
    return new QueuedSimVarReader(new SimVarReaderWriter(simVarName));
}
