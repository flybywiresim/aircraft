class Arinc429Word {
    constructor(value) {
        Arinc429Word.u32View[0] = (value & 0xffffffff) >>> 0;
        this.ssm = Math.trunc(value / 2 ** 32);
        this.value = Arinc429Word.f32View[0];
    }

    static empty() {
        return new Arinc429Word(0);
    }

    static fromSimVarValue(name) {
        return new Arinc429Word(SimVar.GetSimVarValue(name, "number"));
    }

    static async toSimVarValue(name, value, ssm = Arinc429Word.SignStatusMatrix.NormalOperation) {
        Arinc429Word.f32View[0] = value;
        const simVal = Arinc429Word.u32View[0] + Math.trunc(ssm) * 2 ** 32;
        return SimVar.SetSimVarValue(name, 'string', simVal.toString());
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
    valueOr(defaultValue) {
        return this.isNormalOperation() ? this.value : defaultValue;
    }

    bitValue(bit) {
        return ((this.value >> (bit - 1)) & 1) !== 0;
    }

    bitValueOr(bit, defaultValue) {
        return this.isNormalOperation() ? ((this.value >> (bit - 1)) & 1) !== 0 : defaultValue;
    }

    setBitValue(bit, value) {
        if (value) {
            this.value |= 1 << (bit - 1);
        } else {
            this.value &= ~(1 << (bit - 1));
        }
    }

    equals(other) {
        return this === other
            || (typeof other !== "undefined" && other !== null && this.value === other.value && this.ssm === other.ssm);
    }
}

Arinc429Word.u32View = new Uint32Array(1);
Arinc429Word.f32View = new Float32Array(Arinc429Word.u32View.buffer);

Arinc429Word.SignStatusMatrix = Object.freeze({
    FailureWarning: 0b00,
    NoComputedData: 0b01,
    FunctionalTest: 0b10,
    NormalOperation: 0b11,
});
