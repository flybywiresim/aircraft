export class Arinc429WordSsmParseError extends Error {
    constructor(public ssm: number) {
        super();
    }
}

export enum Arinc429SignStatusMatrix {
    FailureWarning = 0b00,
    NoComputedData = 0b01,
    FunctionalTest = 0b10,
    NormalOperation = 0b11,
}

export interface Arinc429WordData {
    ssm: Arinc429SignStatusMatrix,

    value: number,

    isFailureWarning(): boolean,

    isNoComputedData(): boolean,

    isFunctionalTest(): boolean,

    isNormalOperation(): boolean,
}

export class Arinc429Word implements Arinc429WordData {
    static f64View = new Float64Array(1);

    static u32View = new Uint32Array(Arinc429Word.f64View.buffer);

    static f32View = new Float32Array(Arinc429Word.f64View.buffer);

    ssm: Arinc429SignStatusMatrix;

    value: number;

    constructor(word: number) {
        Arinc429Word.f64View[0] = word;

        const ssm = Arinc429Word.u32View[0];
        if (ssm >= 0b00 && ssm <= 0b11) {
            this.ssm = ssm as Arinc429SignStatusMatrix;
        } else {
            throw new Arinc429WordSsmParseError(ssm);
        }

        this.value = Arinc429Word.f32View[1];
    }

    static empty(): Arinc429Word {
        return new Arinc429Word(0);
    }

    static fromSimVarValue(name: string): Arinc429Word {
        return new Arinc429Word(SimVar.GetSimVarValue(name, 'number'));
    }

    isFailureWarning() {
        return this.ssm === Arinc429SignStatusMatrix.FailureWarning;
    }

    isNoComputedData() {
        return this.ssm === Arinc429SignStatusMatrix.NoComputedData;
    }

    isFunctionalTest() {
        return this.ssm === Arinc429SignStatusMatrix.FunctionalTest;
    }

    isNormalOperation() {
        return this.ssm === Arinc429SignStatusMatrix.NormalOperation;
    }

    /**
     * Returns the value when normal operation, the supplied default value otherwise.
     */
    valueOr(defaultValue: number) {
        return this.isNormalOperation() ? this.value : defaultValue;
    }

    getBitValue(bit: number): boolean {
        return ((this.value >> (bit - 1)) & 1) !== 0;
    }

    getBitValueOr(bit: number, defaultValue: boolean): boolean {
        return this.isNormalOperation() ? ((this.value >> (bit - 1)) & 1) !== 0 : defaultValue;
    }
}

export class Arinc429Register implements Arinc429WordData {
    f64View = new Float64Array(1);

    u32View = new Uint32Array(this.f64View.buffer);

    f32View = new Float32Array(this.f64View.buffer);

    ssm: Arinc429SignStatusMatrix;

    value: number;

    static empty() {
        return new Arinc429Register();
    }

    private constructor() {
        this.set(0);
    }

    set(word: number) {
        this.f64View[0] = word;

        const ssm = this.u32View[0];
        if (ssm >= 0b00 && ssm <= 0b11) {
            this.ssm = ssm as Arinc429SignStatusMatrix;
        } else {
            throw new Arinc429WordSsmParseError(ssm);
        }

        this.value = this.f32View[1];
    }

    isFailureWarning() {
        return this.ssm === Arinc429SignStatusMatrix.FailureWarning;
    }

    isNoComputedData() {
        return this.ssm === Arinc429SignStatusMatrix.NoComputedData;
    }

    isFunctionalTest() {
        return this.ssm === Arinc429SignStatusMatrix.FunctionalTest;
    }

    isNormalOperation() {
        return this.ssm === Arinc429SignStatusMatrix.NormalOperation;
    }
}
