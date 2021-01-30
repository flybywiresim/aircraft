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
        this.currentSpeed = 0;
        this.timeout = timeout;
        this.increment = increment;
        this.previousTimestamp = 0;
    }

    increase() {
        if (this.currentSpeed < 1 || (Date.now() - this.previousTimestamp) > this.timeout) {
            this.currentSpeed = 1;
        } else {
            this.currentSpeed += this.increment;
        }

        this.previousTimestamp = Date.now();
        this.updateValue(Math.floor(this.currentSpeed));
    }

    decrease() {
        if (this.currentSpeed > -1 || (Date.now() - this.previousTimestamp) > this.timeout) {
            this.currentSpeed = -1;
        } else {
            this.currentSpeed -= this.increment;
        }

        this.previousTimestamp = Date.now();
        this.updateValue(Math.ceil(this.currentSpeed));
    }

    updateValue() {
        throw new Error('You have to implement the updateValue method!');
    }
}
