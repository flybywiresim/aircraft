/**
 * Allows to schedule multiple callbacks to be run at different rates.
 * If multiple callbacks are scheduled to run at the same rate a single setInterval is used!
 */
export class RateScheduler {
    constructor() {
        this.map = new Map();
    }

    /**
     * Schedule a new callback to be called at a set rate.
     * @param callback The callback to be scheduled
     * @param rate The rate that this callback should be called at.
     */
    schedule(callback, rate) {
        if (this.map.has(rate)) {
            this.map.get(rate).callbacks.push(callback);
            return;
        }

        this.map.set(rate, {
            interval: setInterval(() => this.tick(rate), rate),
            callbacks: [callback],
        });
    }

    /**
     * Remove a given callback (from all rates).
     * @param callback The callback to unschedule.
     */
    unschedule(callback) {
        this.map.forEach((value) => {
            value.callbacks = value.callbacks.filter((cb) => cb != callback);
        });

        this.cleanup();
    }

    /**
     * Clears intervals that have no callbacks.
     */
    cleanup() {
        this.map.forEach((value, key, map) => {
            if (value.callbacks.length === 0) {
                clearInterval(value.interval);
                map.delete(key);
            }
        });
    }

    /**
     * Called by all intervals with the particular rate.
     * @param rate The rate of the interval that called.
     */
    tick(rate) {
        if (!this.map.has(rate)) {
            return;
        }
        this.map.get(rate).callbacks.forEach((cb) => cb());
    }
}
