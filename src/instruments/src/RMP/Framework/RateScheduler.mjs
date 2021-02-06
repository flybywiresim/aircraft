/**
 * Allows to schedule multiple callbacks to be run at different rates.
 * If multiple callbacks are scheduled to run at the same rate a single setInterval is used!
 */
export class RateScheduler {
    constructor() {
        this.rates = new Map();
        this.callbacks = new Map();
    }

    /**
     * Schedule a new callback to be called at a set rate.
     * @param identifier The identifier for the callback
     * @param callback The callback to be scheduled
     * @param rate The rate that this callback should be called at.
     */
    schedule(identifier, callback, rate) {
        this.callbacks.set(identifier, callback);

        if (this.rates.has(rate)) {
            this.rates.get(rate).identifiers.push(identifier);
            return;
        }

        this.rates.set(rate, {
            interval: setInterval(() => this.tick(rate), rate),
            identifiers: [identifier],
        });
    }

    /**
     * Remove a given identifier (from all rates).
     * @param identifier The identifier to unschedule.
     */
    unschedule(identifier) {
        this.callbacks.delete(identifier);

        this.rates.forEach((value) => {
            value.identifiers = value.identifiers.filter((ident) => ident !== identifier);
        });

        this.cleanup();
    }

    /**
     * Clears intervals that have no intervals.
     */
    cleanup() {
        this.rates.forEach((value, key, map) => {
            if (value.identifiers.length === 0) {
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
        if (!this.rates.has(rate)) return;

        this.rates.get(rate).identifiers.forEach((identifier) => {
            const callback = this.callbacks.get(identifier);
            if (typeof callback === 'function') callback();
        });
    }
}
