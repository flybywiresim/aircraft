import { CallbackReader, Writer } from '..';

export class QueuedSimVarReader implements CallbackReader {
    private reader: CallbackReader;

    private writer: Writer;

    private isResetting: boolean = false;

    constructor(reader: CallbackReader, writer: Writer) {
        this.reader = reader;
        this.writer = writer;
    }

    register(identifier: number, callback: () => void) {
        this.reader.register(identifier, () => {
            this.resetSimVar();
            callback();
        });
    }

    update() {
        if (!this.isResetting) {
            this.reader.update();
        }
    }

    private resetSimVar() {
        this.isResetting = true;
        this.writer.write(0).then(() => {
            this.isResetting = false;
        });
    }
}
