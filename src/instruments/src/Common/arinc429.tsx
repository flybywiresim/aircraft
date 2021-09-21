import { useSimVarValue } from './simVars';

export class Arinc429Word {
    static SignStatusMatrix = Object.freeze({
        FailureWarning: 0b00,
        NoComputedData: 0b01,
        FunctionalTest: 0b10,
        NormalOperation: 0b11,
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

    isFailureWarning() {
        return this.ssm === Arinc429Word.SignStatusMatrix.FailureWarning;
    }

    isNoComputedData() {
        return this.ssm === Arinc429Word.SignStatusMatrix.NoComputedData;
    }

    isFunctionalTest() {
        return this.ssm === Arinc429Word.SignStatusMatrix.FunctionalTest;
    }

    isNormalOperation() {
        return this.ssm === Arinc429Word.SignStatusMatrix.NormalOperation;
    }

    /**
     * Returns the value when normal operation, the supplied default value otherwise.
     */
    valueOr(defaultValue: number) {
        return this.isNormalOperation() ? this.value : defaultValue;
    }
}

export const useArinc429Var = (
    name: string,
    maxStaleness = 0,
): Arinc429Word => {
    const value = useSimVarValue(name, 'number', maxStaleness);
    return new Arinc429Word(value);
};
