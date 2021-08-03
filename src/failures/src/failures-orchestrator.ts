import { QueuedSimVarWriter, SimVarReaderWriter } from './communication';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';

/**
 * Orchestrates the activation and deactivation of failures.
 *
 * Only a single instance of the orchestrator should exist within the whole application.
 */
export class FailuresOrchestrator {
    private failures = new Map<number, Failure>();

    private activateFailureQueue: QueuedSimVarWriter;

    private deactivateFailureQueue: QueuedSimVarWriter;

    constructor(simVarPrefix: string, failures: [number, string][]) {
        this.activateFailureQueue = new QueuedSimVarWriter(new SimVarReaderWriter(getActivateFailureSimVarName(simVarPrefix)));
        this.deactivateFailureQueue = new QueuedSimVarWriter(new SimVarReaderWriter(getDeactivateFailureSimVarName(simVarPrefix)));
        failures.forEach((failure) => {
            this.failures.set(failure[0], {
                identifier: failure[0],
                name: failure[1],
                isActive: false,
                isChanging: false,
            });
        });
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

    /**
     * Determines whether or not the failure with the given identifier is active.
     */
    isActive(identifier: number): boolean {
        return this.getFailure(identifier).isActive === true;
    }

    /**
     * Determines whether or not the failure with the given identifier is currently
     * changing its state between active and inactive.
     */
    isChanging(identifier: number): boolean {
        return this.getFailure(identifier).isChanging === true;
    }

    getFailures(): Readonly<Map<number, Failure>> {
        return this.failures;
    }

    private getFailure(identifier: number) {
        return this.failures.get(identifier);
    }
}

export interface Failure {
    identifier: number,
    name: string,
    isActive: boolean,
    isChanging: boolean,
}
