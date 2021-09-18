/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
/*
 * This file contains various nodes that can be used for logical processing. Systems like the FWC may use them to
 * accurately implement their functionality.
 */

/**
 * The following class represents a monostable circuit. It is inspired by the MTRIG nodes as described in the ESLD and
 * used by the FWC.
 * When it detects either a rising or a falling edge (depending on it's type) it will emit a signal for a certain time t
 * after the detection. It is not retriggerable, so a rising/falling edge within t will not reset the timer.
 */
export class NXLogic_TriggeredMonostableNode {
    t: any;

    risingEdge: boolean;

    _timer: number;

    _previousValue: any;

    constructor(t, risingEdge = true) {
        this.t = t;
        this.risingEdge = risingEdge;
        this._timer = 0;
        this._previousValue = null;
    }

    write(value, _deltaTime) {
        if (this._previousValue === null && SimVar.GetSimVarValue('L:A32NX_FWC_SKIP_STARTUP', 'Bool')) {
            this._previousValue = value;
        }
        if (this.risingEdge) {
            if (this._timer > 0) {
                this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
                this._previousValue = value;
                return true;
            } if (!this._previousValue && value) {
                this._timer = this.t;
                this._previousValue = value;
                return true;
            }
        } else {
            if (this._timer > 0) {
                this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
                this._previousValue = value;
                return true;
            } if (this._previousValue && !value) {
                this._timer = this.t;
                this._previousValue = value;
                return true;
            }
        }
        this._previousValue = value;
        return false;
    }
}

/**
 * The following class represents a "confirmation" circuit, which only passes a signal once it has been stable for a
 * certain amount of time. It is inspired by the CONF nodes as described in the ESLD and used by the FWC.
 * When it detects either a rising or falling edge (depending on it's type) it will wait for up to time t and emit the
 * incoming signal if it was stable throughout t. If at any point the signal reverts during t the state is fully reset,
 * and the original signal will be emitted again.
 */
export class NXLogic_ConfirmNode {
    t: any;

    risingEdge: boolean;

    _timer: number;

    _previousInput: any;

    _previousOutput: any;

    constructor(t, risingEdge = true) {
        this.t = t;
        this.risingEdge = risingEdge;
        this._timer = 0;
        this._previousInput = null;
        this._previousOutput = null;
    }

    write(value, _deltaTime?) {
        if (this._previousInput === null && SimVar.GetSimVarValue('L:A32NX_FWC_SKIP_STARTUP', 'Bool')) {
            this._previousInput = value;
            this._previousOutput = value;
        }
        if (this.risingEdge) {
            if (!value) {
                this._timer = 0;
            } else if (this._timer > 0) {
                this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
                this._previousInput = value;
                this._previousOutput = !value;
                return !value;
            } else if (!this._previousInput && value) {
                this._timer = this.t;
                this._previousInput = value;
                this._previousOutput = !value;
                return !value;
            }
        } else if (value) {
            this._timer = 0;
        } else if (this._timer > 0) {
            this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
            this._previousInput = value;
            this._previousOutput = !value;
            return !value;
        } else if (this._previousInput && !value) {
            this._timer = this.t;
            this._previousInput = value;
            this._previousOutput = !value;
            return !value;
        }
        this._previousInput = value;
        this._previousOutput = value;
        return value;
    }

    read() {
        return this._previousOutput;
    }
}

/**
 * The following class represents a flip-flop or memory circuit that can be used to store a single bit. It is inspired
 * by the S+R nodes as described in the ESLD.
 * It has two inputs: Set and Reset. At first it will always emit a falsy value, until it receives a signal on the set
 * input, at which point it will start emitting a truthy value. This will continue until a signal is received on the
 * reset input, at which point it reverts to the original falsy output. It a signal is sent on both set and reset at the
 * same time, the input with a star will have precedence.
 * The NVM flag is not implemented right now but can be used to indicate non-volatile memory storage, which means the
 * value will persist even when power is lost and subsequently restored.
 */
export class NXLogic_MemoryNode {
    setStar: boolean;

    nvm: boolean;

    _value: boolean;

    /**
     * @param setStar Whether set has precedence over reset if both are applied simultaneously.
     * @param nvm Whether the is non-volatile and will be kept even when power is lost.
     */
    constructor(setStar = true, nvm = false) {
        this.setStar = setStar;
        this.nvm = nvm; // TODO in future, reset non-nvm on power cycle
        this._value = false;
    }

    write(set, reset) {
        if (set && reset) {
            this._value = this.setStar;
        } else if (set && !this._value) {
            this._value = true;
        } else if (reset && this._value) {
            this._value = false;
        }
        return this._value;
    }

    read() {
        return this._value;
    }
}
