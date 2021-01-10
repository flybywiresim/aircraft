export class RadioFrequency {
    constructor(GetSimVar, SetSimVar) {
        this.GetSimVar = GetSimVar;
        this.SetSimVar = SetSimVar;
    }

    get value() {
        if (this._value) {
            const value = this._value;
            this._value = undefined;
            return value;
        }

        return SimVar.GetSimVarValue(this.GetSimVar, "kHz");
    }

    set value(value) {
        SimVar.SetSimVarValue(this.SetSimVar, "Hz", value * 1000);
        this._value = value;
    }
}
