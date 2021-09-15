import { useSimVarValue } from './simVars';

const arin429Words: Map<string, Arinc429Word> = new Map();

export class Arinc429Word {
    static SignStatusMatrix = Object.freeze({
        FailureWarning: 0,
        FunctionalTest: 1,
        NoComputedData: 2,
        NormalOperation: 3,
    });

    static f64View = new Float64Array(1);

    static u32View = new Uint32Array(Arinc429Word.f64View.buffer);

    static f32View = new Float32Array(Arinc429Word.f64View.buffer);

    ssm: number;

    value: number;

    constructor() {
        this.ssm = 0;
        this.value = 0;
    }

    isNormal() {
        return this.ssm === Arinc429Word.SignStatusMatrix.NormalOperation;
    }

    updateSimVarValue(value: any) {
        Arinc429Word.f64View[0] = value;

        // eslint-disable-next-line prefer-destructuring
        this.ssm = Arinc429Word.u32View[0];
        // eslint-disable-next-line prefer-destructuring
        this.value = Arinc429Word.f32View[1];
    }
}

Arinc429Word.f64View = new Float64Array(1);
Arinc429Word.u32View = new Uint32Array(Arinc429Word.f64View.buffer);
Arinc429Word.f32View = new Float32Array(Arinc429Word.f64View.buffer);

export const useArinc429Var = (
    name: string,
    maxStaleness = 0,
): Arinc429Word => {
    const value = useSimVarValue(name, 'number', maxStaleness);

    let word = arin429Words.get(name);
    if (!word) {
        word = new Arinc429Word();
        arin429Words.set(name, word);
    }
    word.updateSimVarValue(value);

    return word;
};
