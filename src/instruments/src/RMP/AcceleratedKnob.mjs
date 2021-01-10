/**
 * A generic rotary encoder knob which handles acceleration.
 * If the knob is turned quickly the speed given to the callback increases.
 * When the knob is not used for longer than the timeout, the speed goes back to 1.
 *
 * E.g. this can be used to increase the delta heading for a heading knob
 * as a user turns faster as opposed to always changing the heading by 1 degree.
 */
export class AcceleratedKnob {
    constructor(timeout = 300, increment = 0.20) {
        this._currentSpeed = 0;
        this._timeout = timeout;
        this._increment = increment;
        this._previousTimestamp = 0;
    }

    increase() {
        if (this._currentSpeed < 1 || (Date.now() - this._previousTimestamp) > this._timeout) this._currentSpeed = 1;
        else this._currentSpeed += this._increment;
        this._previousTimestamp = Date.now();
        this.updateValue(Math.floor(this._currentSpeed));
    }

    decrease() {
        if (this._currentSpeed > -1 || (Date.now() - this._previousTimestamp) > this._timeout) this._currentSpeed = -1;
        else this._currentSpeed -= this._increment;
        this._previousTimestamp = Date.now();
        this.updateValue(Math.ceil(this._currentSpeed));
    }

    updateValue() {
        throw new Error('You have to implement the updateValue method!');
     }
}
