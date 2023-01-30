// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Wait {
  /**
   * Waits for a set amount of time.
   * @param delay The amount of time to wait in milliseconds.
   * @returns a Promise which is fulfilled after the delay.
   */
  // eslint-disable-next-line no-inner-declarations
  export function awaitDelay(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), delay));
  }

  /**
   * Waits for a condition to be satisfied.
   * @param predicate A function which evaluates whether the condition is satisfied.
   * @param interval The interval, in milliseconds, at which to evaluate the condition. A zero or negative value
   * causes the condition to be evaluated every frame. Defaults to 0.
   * @param timeout The amount of time, in milliseconds, before the returned Promise is rejected if the condition is
   * not satisfied. A zero or negative value causes the Promise to never be rejected and the condition to be
   * continually evaluated until it is satisfied. Defaults to 0.
   * @returns a Promise which is fulfilled when the condition is satisfied.
   */
  // eslint-disable-next-line no-inner-declarations
  export function awaitCondition(predicate: () => boolean, interval = 0, timeout = 0): Promise<void> {
    const t0 = Date.now();
    if (interval <= 0) {
      const loopFunc = (resolve: () => void, reject: (reason?: any) => void): void => {
        if (timeout > 0 && Date.now() - t0 >= timeout) {
          reject('Await condition timed out.');
        } else {
          predicate() ? resolve() : requestAnimationFrame(loopFunc.bind(undefined, resolve, reject));
        }
      };
      return new Promise((resolve, reject) => { loopFunc(resolve, reject); });
    } else {
      return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
          if (timeout > 0 && Date.now() - t0 > timeout) {
            clearInterval(timer);
            reject('Await condition timed out.');
          } else if (predicate()) {
            clearInterval(timer);
            resolve();
          }
        }, interval);
      });
    }
  }
}