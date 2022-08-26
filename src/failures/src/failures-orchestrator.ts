import { AtaChapterNumber } from '@shared/ata';
import { QueuedSimVarWriter, SimVarReaderWriter } from './communication';
import { getActivateFailureSimVarName, getDeactivateFailureSimVarName } from './sim-vars';

export interface Failure {
    ata: AtaChapterNumber,
    identifier: number,
    name: string,
}

/**
 * Orchestrates the activation and deactivation of failures.
 *
 * Only a single instance of the orchestrator should exist within the whole application.
 */
export class FailuresOrchestrator {
    private failures: Failure[] = [];

    private activeFailures = new Set<number>();

    private changingFailures = new Set<number>();

    private activateFailureQueue: QueuedSimVarWriter;

    private deactivateFailureQueue: QueuedSimVarWriter;

    constructor(simVarPrefix: string, failures: [AtaChapterNumber, number, string][]) {
        this.activateFailureQueue = new QueuedSimVarWriter(new SimVarReaderWriter(getActivateFailureSimVarName(simVarPrefix)));
        this.deactivateFailureQueue = new QueuedSimVarWriter(new SimVarReaderWriter(getDeactivateFailureSimVarName(simVarPrefix)));
        failures.forEach((failure) => {
            this.failures.push({
                ata: failure[0],
                identifier: failure[1],
                name: failure[2],
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
        this.changingFailures.add(identifier);
        await this.activateFailureQueue.write(identifier);
        this.changingFailures.delete(identifier);
        this.activeFailures.add(identifier);
    }

    /**
     * Deactivates the failure with the given identifier.
     */
    async deactivate(identifier: number): Promise<void> {
        this.changingFailures.add(identifier);
        await this.deactivateFailureQueue.write(identifier);
        this.changingFailures.delete(identifier);
        this.activeFailures.delete(identifier);
    }

    /**
     * Determines whether or not the failure with the given identifier is active.
     */
    isActive(identifier: number): boolean {
        return this.activeFailures.has(identifier);
    }

    /**
     * Determines whether or not the failure with the given identifier is currently
     * changing its state between active and inactive.
     */
    isChanging(identifier: number): boolean {
        return this.changingFailures.has(identifier);
    }

    getAllFailures(): Readonly<Readonly<Failure>[]> {
        return this.failures;
    }

    getActiveFailures(): Set<number> {
        return new Set(this.activeFailures);
    }

    getChangingFailures(): Set<number> {
        return new Set(this.changingFailures);
    }
}
