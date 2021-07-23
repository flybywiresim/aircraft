import { SimVarWriter } from '.';
import { Writer } from '..';

test('writes a value', async () => {
    const value = 1;
    await writer().write(value);

    expect(SimVar.GetSimVarValue(simVarName, 'number')).toBe(value);
});

const simVarName = 'L:VARIABLE';

function writer(): Writer {
    return new SimVarWriter(simVarName);
}
