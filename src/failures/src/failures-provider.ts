import { Failure } from '@flybywiresim/failures';

export interface FailuresProvider {
    /**
     * Activates the failure with the given identifier.
     */
    activate(identifier: number): Promise<void>

    /**
     * Deactivates the failure with the given identifier.
     */
    deactivate(identifier: number): Promise<void>

    /**
     * Determines whether the failure with the given identifier is active.
     */
    isActive(identifier: number): boolean

    /**
     * Determines whether the failure with the given identifier is currently
     * changing its state between active and inactive.
     */
    isChanging(identifier: number): boolean

    /**
     * Returns all available failures
     */
    getAllFailures(): Readonly<Readonly<Failure>[]>

    /**
     * Returns all active failures
     */
    getActiveFailures(): Set<number>

    /**
     * Returns all changing failures
     */
    getChangingFailures(): Set<number>
}
