/**
 * A simple timer for handling debounce.
 */
export class DebounceTimer {
  private timer: NodeJS.Timeout | null = null;

  /**
   * Checks whether an action is pending on this timer.
   * @returns Whether an action is pending on this timer.
   */
  public isPending(): boolean {
    return this.timer !== null;
  }

  /**
   * Schedules an action. Waits for a specified amount of time, and executes the action only if no other action is
   * scheduled on this timer during the delay.
   * @param action The action to schedule.
   * @param delay The debounce delay, in milliseconds.
   */
  public schedule(action: () => void, delay: number): void {
    this.clear();
    this.timer = setTimeout(() => {
      this.timer = null;
      action();
    }, delay);
  }

  /**
   * Clears this timer of any pending actions. Actions that are cleared will not be executed.
   */
  public clear(): void {
    if (this.timer === null) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = null;
  }
}