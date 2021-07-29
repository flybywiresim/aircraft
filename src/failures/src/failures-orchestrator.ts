import { QueuedSimVarWriter, SimVarReaderWriter } from './communication';

export class FailuresOrchestrator {
    private activeFailures: Record<number, boolean> = {};

    private activateFailureQueue: QueuedSimVarWriter;

    private deactivateFailureQueue: QueuedSimVarWriter;

    constructor(simVarPrefix: string) {
        const activateSimVar = `${simVarPrefix}FAILURE_ACTIVATE`;
        this.activateFailureQueue = new QueuedSimVarWriter(new SimVarReaderWriter(activateSimVar));
        const deactivateSimVar = `${simVarPrefix}FAILURE_DEACTIVATE`;
        this.deactivateFailureQueue = new QueuedSimVarWriter(new SimVarReaderWriter(deactivateSimVar));
    }

    update() {
        this.activateFailureQueue.update();
        this.deactivateFailureQueue.update();
    }

    /**
     * Activates the failure with the given identifier.
     */
    async activate(identifier: number): Promise<void> {
        await this.activateFailureQueue.write(identifier);
        this.activeFailures[identifier] = true;
    }

    /**
     * Deactivates the failure with the given identifier.
     */
    async deactivate(identifier: number): Promise<void> {
        await this.deactivateFailureQueue.write(identifier);
        this.activeFailures[identifier] = false;
    }

    isActive(identifier: number): boolean {
        return this.activeFailures[identifier] === true;
    }
}
