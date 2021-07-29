import { CallbackReader, Writer } from '..';

export class QueuedSimVarReader implements CallbackReader {
    private simVar: CallbackReader & Writer;

    private isResetting: boolean = false;

    constructor(simVar: CallbackReader & Writer) {
        this.simVar = simVar;
    }

    register(identifier: number, callback: () => void) {
        this.simVar.register(identifier, () => {
            this.resetSimVar();
            callback();
        });
    }

    update() {
        if (!this.isResetting) {
            this.simVar.update();
        }
    }

    private resetSimVar() {
        this.isResetting = true;
        this.simVar.write(0).then(() => {
            this.isResetting = false;
        });
    }
}
