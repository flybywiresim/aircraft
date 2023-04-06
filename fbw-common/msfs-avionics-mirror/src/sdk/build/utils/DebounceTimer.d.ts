/**
 * A simple timer for handling debounce.
 */
export declare class DebounceTimer {
    private timer;
    /**
     * Checks whether an action is pending on this timer.
     * @returns Whether an action is pending on this timer.
     */
    isPending(): boolean;
    /**
     * Schedules an action. Waits for a specified amount of time, and executes the action only if no other action is
     * scheduled on this timer during the delay.
     * @param action The action to schedule.
     * @param delay The debounce delay, in milliseconds.
     */
    schedule(action: () => void, delay: number): void;
    /**
     * Clears this timer of any pending actions. Actions that are cleared will not be executed.
     */
    clear(): void;
}
//# sourceMappingURL=DebounceTimer.d.ts.map