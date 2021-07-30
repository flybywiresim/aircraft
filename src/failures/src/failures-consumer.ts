import { QueuedSimVarReader, SimVarReaderWriter } from './communication';

export class FailuresConsumer {
    private activeFailures: Record<number, boolean> = {};

    private callbacks: Record<number, (isActive: boolean) => void> = {};

    private activateFailureReader: QueuedSimVarReader;

    private deactivateFailureReader: QueuedSimVarReader;

    constructor(prefix: string) {
        this.activateFailureReader = new QueuedSimVarReader(new SimVarReaderWriter(`L:${prefix}_FAILURE_ACTIVATE`));
        this.deactivateFailureReader = new QueuedSimVarReader(new SimVarReaderWriter(`L:${prefix}_FAILURE_DEACTIVATE`));
    }

    register(identifier: number, callback?: (isActive: boolean) => void) {
        if (this.callbacks[identifier] !== undefined) {
            throw new Error(`Cannot register the same failure identifier (${identifier}) multiple times.`);
        }

        this.callbacks[identifier] = callback || ((_) => {});
        this.activateFailureReader.register(identifier, () => {
            this.onReadCallback(identifier, true);
        });
        this.deactivateFailureReader.register(identifier, () => {
            this.onReadCallback(identifier, false);
        });
    }

    update() {
        this.activateFailureReader.update();
        this.deactivateFailureReader.update();
    }

    isActive(identifier: number): boolean {
        return this.activeFailures[identifier] === true;
    }

    private onReadCallback(identifier: number, value: boolean) {
        this.callbacks[identifier](value);
        this.activeFailures[identifier] = value;
    }
}
