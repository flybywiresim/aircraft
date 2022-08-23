/*
 * This file contains various nodes that can be used for logical processing. Systems like the FWC may use them to
 * accurately implement their functionality.
 */

/**
 * The following class represents a monostable circuit. When it detects either a rising or a falling edge (depending on
 * its type) it will emit a signal for a certain time after the detection. It is not retriggerable, so a rising/falling
 * edge within t will not reset the timer.
 */
export class NXLogicTriggeredMonostableNode {
        private timer = 0;

        private previousValue: null | boolean = null;

        private previousOutput = false;

        /**
         * Constructors a new Monostable Trigger Node
         * @param t The time constant in seconds
         * @param risingEdge Whether to detect a rising edge, or falling edge
         */
        constructor(private readonly t: number, private readonly risingEdge = true) {}

        private setOutput(output: boolean): boolean {
            this.previousOutput = output;
            return output;
        }

        write(value: boolean, _deltaTime: number) {
            if (this.previousValue === null && SimVar.GetSimVarValue('L:A32NX_START_STATE', 'Enum') > 2) {
                this.previousValue = value;
            }
            if (this.risingEdge) {
                if (this.timer > 0) {
                    this.timer = Math.max(this.timer - _deltaTime / 1000, 0);
                    this.previousValue = value;
                    return this.setOutput(true);
                } if (!this.previousValue && value) {
                    this.timer = this.t;
                    this.previousValue = value;
                    return this.setOutput(true);
                }
            } else {
                if (this.timer > 0) {
                    this.timer = Math.max(this.timer - _deltaTime / 1000, 0);
                    this.previousValue = value;
                    return this.setOutput(true);
                } if (this.previousValue && !value) {
                    this.timer = this.t;
                    this.previousValue = value;
                    return this.setOutput(true);
                }
            }
            this.previousValue = value;
            return this.setOutput(false);
        }

        read(): boolean {
            return this.previousOutput;
        }
}

/**
 * The following class represents a "confirmation" circuit, which only passes a signal once it has been stable for a
 * certain amount of time. When it detects either a rising or falling edge (depending on its type) it will wait for up
 * to time t and emit the incoming signal if it was stable throughout t. If at any point the signal reverts during t the
 * state is fully reset, and the original signal will be emitted again.
 */
export class NXLogicConfirmNode {
    t: number;

    risingEdge: boolean;

    timer: number;

    previousInput: any;

    previousOutput: any;

    constructor(t, risingEdge = true) {
        this.t = t;
        this.risingEdge = risingEdge;
        this.timer = 0;
        this.previousInput = null;
        this.previousOutput = null;
    }

    write(value, deltaTime) {
        if (this.previousInput === null && SimVar.GetSimVarValue('L:A32NX_START_STATE', 'Enum') > 2) {
            this.previousInput = value;
            this.previousOutput = value;
        }
        if (this.risingEdge) {
            if (!value) {
                this.timer = 0;
            } else if (this.timer > 0) {
                this.timer = Math.max(this.timer - deltaTime / 1000, 0);
                this.previousInput = value;
                this.previousOutput = !value;
                return !value;
            } else if (!this.previousInput && value) {
                this.timer = this.t;
                this.previousInput = value;
                this.previousOutput = !value;
                return !value;
            }
        } else if (value) {
            this.timer = 0;
        } else if (this.timer > 0) {
            this.timer = Math.max(this.timer - deltaTime / 1000, 0);
            this.previousInput = value;
            this.previousOutput = !value;
            return !value;
        } else if (this.previousInput && !value) {
            this.timer = this.t;
            this.previousInput = value;
            this.previousOutput = !value;
            return !value;
        }
        this.previousInput = value;
        this.previousOutput = value;
        return value;
    }

    read() {
        return this.previousOutput;
    }
}

/**
 * The following class represents a flip-flop or memory circuit that can be used to store a single bit.
 * It has two inputs: Set and Reset. At first it will always emit a falsy value, until it receives a signal on the set
 * input, at which point it will start emitting a truthy value. This will continue until a signal is received on the
 * reset input, at which point it reverts to the original falsy output. It a signal is sent on both set and reset at the
 * same time, the input with a star will have precedence.
 */
export class NXLogicMemoryNode {
    /**
     * @param setStar Whether set has precedence over reset if both are applied simultaneously.
     */

    setStar: boolean;

    value:boolean;

    constructor(setStar = true) {
        this.setStar = setStar;
        this.value = false;
    }

    write(set, reset) {
        if (set && reset) {
            this.value = this.setStar;
        } else if (set && !this.value) {
            this.value = true;
        } else if (reset && this.value) {
            this.value = false;
        }
        return this.value;
    }

    read() {
        return this.value;
    }
}

/**
 * The following class outputs state S1 until the clock has reached the 'TO' time
 * at which point it wil output state S2.
 */
export class NXLogicClockNode {
    /**
     * @param from Starting time (in seconds)
     * @param to End time (in seconds)
     * @param inc Increment time (in seconds)
     * @param dir Direction of increment (UP/DOWN)
     */

    from: number;

    to: number;

    inc:number;

    dir: string;

    timer: number;

    flag: boolean;

    output: number;

    constructor(from, to, inc = 1, dir = 'DN') {
        this.from = from;
        this.to = to;
        this.inc = inc;
        this.dir = dir;
        this.output = 0;
        this.flag = false;
    }

    write(value, deltaTime) {
        if (!value) {
            this.timer = 0;
            this.flag = false;
            this.output = 0;
        } if (!this.flag) {
            this.flag = true;
            this.timer = this.from;
        } else if (this.flag) {
            this.timer = this.dir === 'DN' ? Math.max(this.timer - deltaTime / 1000, 0) : Math.max(this.timer + deltaTime / 1000, 0);
            this.output = this.timer === this.to ? 2 : 1;
        }
        return this.output;
    }

    read() {
        return this.output;
    }
}

export class NXLogicPulseNode {
    private output = false;

    private lastInput = false;

    private remainingTime = 0;

    constructor(private risingEdge = true, private time = 0.1) {}

    write(input: boolean, deltaTime: number): boolean {
        if (this.output) {
            this.remainingTime -= deltaTime / 1000;
            if (this.remainingTime <= 0) {
                this.output = false;
            }
        }

        if ((this.risingEdge && input && !this.lastInput) || (!this.risingEdge && !input && this.lastInput)) {
            this.remainingTime = this.time;
            this.output = true;
        }

        this.lastInput = input;
        return this.output;
    }

    read(): boolean {
        return this.output;
    }
}
