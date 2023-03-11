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
    static u32View = new Uint32Array(1);

    static f32View = new Float32Array(Arinc429Word.u32View.buffer);

    ssm: Arinc429SignStatusMatrix;

    value: number;

    constructor(word: number) {
        Arinc429Word.u32View[0] = (word & 0xffffffff) >>> 0;
        this.ssm = (Math.trunc(word / 2 ** 32) & 0b11) as Arinc429SignStatusMatrix;
        this.value = Arinc429Word.f32View[0];
    }

    static empty(): Arinc429Word {
        return new Arinc429Word(0);
    }

    static fromSimVarValue(name: string): Arinc429Word {
        return new Arinc429Word(SimVar.GetSimVarValue(name, 'number'));
    }

    static async toSimVarValue(name: string, value: number, ssm: Arinc429SignStatusMatrix) {
        Arinc429Word.f32View[0] = value;
        const simVal = Arinc429Word.u32View[0] + Math.trunc(ssm) * 2 ** 32;
        return SimVar.SetSimVarValue(name, 'string', simVal.toString());
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
    valueOr(defaultValue: number | undefined | null) {
        return this.isNormalOperation() ? this.value : defaultValue;
    }

    getBitValue(bit: number): boolean {
        return ((this.value >> (bit - 1)) & 1) !== 0;
    }

    getBitValueOr(bit: number, defaultValue: boolean | undefined | null): boolean {
        return this.isNormalOperation() ? ((this.value >> (bit - 1)) & 1) !== 0 : defaultValue;
    }

    setBitValue(bit: number, value: boolean): void {
        if (value) {
            this.value |= 1 << (bit - 1);
        } else {
            this.value &= ~(1 << (bit - 1));
        }
    }
}

export class Arinc429Register implements Arinc429WordData {
    u32View = new Uint32Array(1);

    f32View = new Float32Array(this.u32View.buffer);

    ssm: Arinc429SignStatusMatrix;

    value: number;

    static empty() {
        return new Arinc429Register();
    }

    private constructor() {
        this.set(0);
    }

    set(word: number) {
        this.u32View[0] = (word & 0xffffffff) >>> 0;
        this.ssm = (Math.trunc(word / 2 ** 32) & 0b11) as Arinc429SignStatusMatrix;
        this.value = this.f32View[0];
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
