class Arinc429Word {
    constructor(value) {
        const buffer = new ArrayBuffer(8);
        (new Float64Array(buffer))[0] = value;

        this._ssm = new Uint32Array(buffer)[0];
        this._value = new Float32Array(buffer)[1];
    }

    static empty() {
        return new Arinc429Word(0);
    }

    static fromSimVarValue(name) {
        return new Arinc429Word(SimVar.GetSimVarValue(name, "number"));
    }

    value() {
        return this._value;
    }

    ssm() {
        return this._ssm;
    }

    isNormal() {
        return this._ssm === Arinc429Word.SignStatusMatrix.NormalOperation;
    }
}

Arinc429Word.SignStatusMatrix = Object.freeze({
    FailureWarning: 0,
    FunctionalTest: 1,
    NoComputedData: 2,
    NormalOperation: 3,
});
