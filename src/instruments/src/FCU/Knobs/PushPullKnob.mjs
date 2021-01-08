import { AcceleratedKnob } from './AcceleratedKnob.mjs';


export class PushPullKnob extends AcceleratedKnob {
    constructor() {
        super();
    }

    get value() {
        return SimVar.GetSimVarValue(this.valueSimvar, this.valueUnit);
    }

    get state() {
        return SimVar.GetSimVarValue(this.stateSimvar, 'Number');
    }

    set value(_value) {
        SimVar.SetSimVarValue(this.valueSimvar, this.valueUnit, _value);
        if (this.onValueUpdated) this.onValueUpdated(_value);
    }

    set state(_state) {
        SimVar.SetSimVarValue(this.stateSimvar, 'Number', _state);
        if (this.onStateUpdated) this.onStateUpdated(_state);
    }

    registerCallbacks(onValueUpdated = null, onStateUpdated = null) {
        this.onValueUpdated = onValueUpdated;
        this.onStateUpdated = onStateUpdated;
        this.registerInteractionHooks();
    }

    registerInteractionHooks() {
        throw new Error('You have to implement the registerInteractionHooks method!');
     }

    push() {
        this.state = 1;
    }

    pull() {
        if (this._previewTimeout) clearTimeout(this._previewTimeout);
        if (this.state === 1) this.value = this.getSelectedToManagedValue();
        this.state = 0;
    }

    getSelectedToManagedValue() {
        throw new Error('You have to implement the getSelectedToManagedValue method!');
     }

    updateValue(speed) {
        let _speed = speed;
        let _value = this.value;
        let _state = this.state;

        if (_state === 1) {
            _value = this.getSelectedToManagedValue();
            _state = 2;
            _speed = 0;
        }

        if (_state === 2) {
            if (this._previewTimeout) clearTimeout(this._previewTimeout);
            this._previewTimeout = setTimeout(() => {this.state = 1}, 5000);
        }

        this.value = this.calculateNextValue(_value, _speed);
        this.state = _state;
     }

     calculateNextValue() {
        throw new Error('You have to implement the calculateNextValue method!');
     }
}
