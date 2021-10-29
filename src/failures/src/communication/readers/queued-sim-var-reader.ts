import { CallbackReader, Writer } from '..';

/**
 * Provides queued reading on top of another reader.
 *
 * Requires that the variable is written by a queued writer.
 *
 * Internally this reads values and writes 0 when it consumes the value.
 */
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
