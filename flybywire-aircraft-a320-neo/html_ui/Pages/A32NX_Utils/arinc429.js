class Arinc429Word {
    constructor(value) {
        Arinc429Word.f64View[0] = value;

        this.ssm = Arinc429Word.u32View[0];
        this.value = Arinc429Word.f32View[1];
    }

    static empty() {
        return new Arinc429Word(0);
    }

    static fromSimVarValue(name) {
        return new Arinc429Word(SimVar.GetSimVarValue(name, "number"));
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

    equals(other) {
        return this === other
            || (typeof other !== "undefined" && other !== null && this.value === other.value && this.ssm === other.ssm);
    }
}

Arinc429Word.f64View = new Float64Array(1);
Arinc429Word.u32View = new Uint32Array(Arinc429Word.f64View.buffer);
Arinc429Word.f32View = new Float32Array(Arinc429Word.f64View.buffer);

Arinc429Word.SignStatusMatrix = Object.freeze({
    FailureWarning: 0,
    FunctionalTest: 1,
    NoComputedData: 2,
    NormalOperation: 3,
});
