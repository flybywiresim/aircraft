import { useSimVarValue } from './simVars';

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

    constructor(value: number) {
        Arinc429Word.f64View[0] = value;

        // eslint-disable-next-line prefer-destructuring
        this.ssm = Arinc429Word.u32View[0];
        // eslint-disable-next-line prefer-destructuring
        this.value = Arinc429Word.f32View[1];
    }

    isNormal() {
        return this.ssm === Arinc429Word.SignStatusMatrix.NormalOperation;
    }
}

export const useArinc429Var = (
    name: string,
    maxStaleness = 0,
): Arinc429Word => {
    const value = useSimVarValue(name, 'number', maxStaleness);
    return new Arinc429Word(value);
};
