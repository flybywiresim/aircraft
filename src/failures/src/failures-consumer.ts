import { QueuedSimVarReader, SimVarReaderWriter } from './communication';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';

export class FailuresConsumer {
    private activeFailures: Record<number, boolean> = {};

    private callbacks: Record<number, (isActive: boolean) => void> = {};

    private activateFailureReader: QueuedSimVarReader;

    private deactivateFailureReader: QueuedSimVarReader;

    constructor(simVarPrefix: string) {
        this.activateFailureReader = new QueuedSimVarReader(new SimVarReaderWriter(getActivateFailureSimVarName(simVarPrefix)));
        this.deactivateFailureReader = new QueuedSimVarReader(new SimVarReaderWriter(getDeactivateFailureSimVarName(simVarPrefix)));
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
