import { Failure } from '@flybywiresim/failures';
import { FailuresProvider } from './failures-provider';
import { FailuresTriggers, PrefixedFailuresTriggers } from './triggers';

/**
 * Mirrors data from a remote {@link FailuresOrchestrator} using `Coherent` events
 */
export class RemoteFailuresProvider implements FailuresProvider {
    private failures: Failure[] = [];

    private activeFailures = new Set<number>();

    private changingFailures = new Set<number>();

    private changingFailuresCallbacks: Map<number, (identifier: number) => void> = new Map();

    private readonly listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

    private readonly triggers: FailuresTriggers;

    constructor(simVarPrefix: string, failures: [number, string][]) {
        failures.forEach((failure) => {
            this.failures.push({
                identifier: failure[0],
                name: failure[1],
            });
        });

        this.triggers = PrefixedFailuresTriggers(simVarPrefix);

        Coherent.on(this.triggers.NewFailuresState, (active: number[], changing: number[]) => {
            this.processNewState(active, changing);
        });

        Coherent.on(this.triggers.ConfirmActivateFailure, (identifier) => {
            this.processConfirmActivate(identifier);
        });

        Coherent.on(this.triggers.ConfirmDeactivateFailure, (identifier) => {
            this.processConfirmDeactivate(identifier);
        });

        this.listener.triggerToAllSubscribers(this.triggers.RequestFailuresState);
    }

    private processNewState(newActiveFailures: number[], newChangingFailures: number[]): void {
        this.activeFailures = new Set(newActiveFailures);
        this.changingFailures = new Set(newChangingFailures);
    }

    private processConfirmActivate(identifier: number): void {
        const cb = this.changingFailuresCallbacks.get(identifier);

        if (cb) {
            cb(identifier);
        }
    }

    private processConfirmDeactivate(identifier: number): void {
        const cb = this.changingFailuresCallbacks.get(identifier);

        if (cb) {
            cb(identifier);
        }
    }

    getAllFailures(): Readonly<Readonly<Failure>[]> {
        return this.failures;
    }

    getActiveFailures(): Set<number> {
        return this.activeFailures;
    }

    getChangingFailures(): Set<number> {
        return new Set(this.changingFailures.keys());
    }

    isActive(identifier: number): boolean {
        return this.activeFailures.has(identifier);
    }

    isChanging(identifier: number): boolean {
        return this.changingFailures.has(identifier);
    }

    async activate(identifier: number): Promise<void> {
        if (this.changingFailures.has(identifier)) {
            return Promise.reject(new Error('Tried activating changing failure'));
        }

        return new Promise((resolve, reject) => {
            try {
                this.changingFailures.add(identifier);
                this.changingFailuresCallbacks.set(identifier, () => {
                    this.changingFailures.delete(identifier);

                    resolve();
                });

                this.listener.triggerToAllSubscribers(this.triggers.ActivateFailure, identifier);
            } catch (e) {
                reject(e);
            }
        });
    }

    async deactivate(identifier: number): Promise<void> {
        if (this.changingFailures.has(identifier)) {
            return Promise.reject(new Error('Tried deactivating changing failure'));
        }

        return new Promise((resolve, reject) => {
            try {
                this.changingFailures.add(identifier);
                this.changingFailuresCallbacks.set(identifier, () => {
                    this.changingFailures.delete(identifier);

                    resolve();
                });

                this.listener.triggerToAllSubscribers(this.triggers.DeactivateFailure, identifier);
            } catch (e) {
                reject(e);
            }
        });
    }
}
