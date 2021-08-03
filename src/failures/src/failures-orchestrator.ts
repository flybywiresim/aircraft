import { QueuedSimVarWriter, SimVarReaderWriter } from './communication';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';

export class FailuresOrchestrator {
    private failures: Record<number, Failure> = {};

    private activateFailureQueue: QueuedSimVarWriter;

    private deactivateFailureQueue: QueuedSimVarWriter;

    constructor(simVarPrefix: string) {
        this.activateFailureQueue = new QueuedSimVarWriter(new SimVarReaderWriter(getActivateFailureSimVarName(simVarPrefix)));
        this.deactivateFailureQueue = new QueuedSimVarWriter(new SimVarReaderWriter(getDeactivateFailureSimVarName(simVarPrefix)));
    }

    add(identifier: number, name: string) {
        this.failures[identifier] = {
            identifier,
            name,
            isActive: false,
            isChanging: false,
        };
    }

    update() {
        this.activateFailureQueue.update();
        this.deactivateFailureQueue.update();
    }

    /**
     * Activates the failure with the given identifier.
     */
    async activate(identifier: number): Promise<void> {
        const failure = this.getFailure(identifier);
        failure.isChanging = true;
        await this.activateFailureQueue.write(identifier);
        failure.isChanging = false;
        failure.isActive = true;
    }

    /**
     * Deactivates the failure with the given identifier.
     */
    async deactivate(identifier: number): Promise<void> {
        const failure = this.getFailure(identifier);
        failure.isChanging = true;
        await this.deactivateFailureQueue.write(identifier);
        failure.isChanging = false;
        failure.isActive = false;
    }

    isActive(identifier: number): boolean {
        return this.getFailure(identifier).isActive === true;
    }

    isChanging(identifier: number): boolean {
        return this.getFailure(identifier).isChanging === true;
    }

    getFailures(): Readonly<Failure>[] {
        return Object.values(this.failures);
    }

    private getFailure(identifier: number) {
        return this.failures[identifier];
    }
}

export interface Failure {
    identifier: number,
    name: string,
    isActive: boolean,
    isChanging: boolean,
}
