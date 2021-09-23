/* eslint-disable max-classes-per-file */
import { useSimVar } from './simVars';

type SignStatusMatrixRange = (typeof Arinc429Word.SignStatusMatrix)[keyof typeof Arinc429Word.SignStatusMatrix];

class Arinc429WordSsmParseError extends Error {
    constructor(public ssm: number) {
        super();
    }
}

export class Arinc429Word {
    static SignStatusMatrix = Object.freeze({
        FailureWarning: 0b00,
        NoComputedData: 0b01,
        FunctionalTest: 0b10,
        NormalOperation: 0b11,
    } as const);

    static f64View = new Float64Array(1);

    static u32View = new Uint32Array(Arinc429Word.f64View.buffer);

    static f32View = new Float32Array(Arinc429Word.f64View.buffer);

    ssm: SignStatusMatrixRange;

    value: number;

    constructor(word: number) {
        Arinc429Word.f64View[0] = word;

        // eslint-disable-next-line prefer-destructuring
        const ssm = Arinc429Word.u32View[0];
        if (ssm >= 0b00 && ssm <= 0b11) {
            this.ssm = ssm as SignStatusMatrixRange;
        } else {
            throw new Arinc429WordSsmParseError(ssm);
        }

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
    const [value] = useSimVar(name, 'number', maxStaleness);
    try {
        return new Arinc429Word(value);
    } catch (e) {
        if (e instanceof Arinc429WordSsmParseError) {
            throw new Error(`SimVar "${name}" has an ARINC 429 SSM value ${e.ssm}, which is outside of the valid range.`);
        }

        throw e;
    }
};
