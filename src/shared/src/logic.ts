export interface LogicNode {

    update(deltaTime: number): void

}

export class ConfirmationNode implements LogicNode {
    constructor(
        public triggerTime: number,
    ) {
    }

    private lastInput = false;

    public input = false;

    public output = false;

    timer = 0.0;

    update(deltaTime: number): void {
        // State change - reset timer
        if (this.lastInput !== this.input) {
            this.lastInput = this.input;
            this.output = false;

            this.timer = 0.0;

            return;
        }

        this.lastInput = this.input;

        if (this.input) {
            this.timer += deltaTime;
        }

        if (this.timer > this.triggerTime) {
            this.output = true;
        }
    }
}

export class Trigger implements LogicNode {
    constructor(
        public risingEdge: boolean,
    ) {
    }

    private lastInput = false;

    public input = false;

    public output = false;

    update(_deltaTime: number): void {
        // State change - set output
        if (this.lastInput !== this.input) {
            if (this.risingEdge && this.input) {
                this.output = true;
            } else if (!this.risingEdge && this.input) {
                this.output = false;
            }
        } else {
            this.output = false;
        }

        this.lastInput = this.input;
    }
}
