import { useState } from 'react';
import { CachedSimVar } from './CachedSimVar.mjs';
import { RateScheduler } from './RateScheduler.mjs';

// Currently a global cache.
const globalRateScheduler = new RateScheduler();

export class StatefulSimVar extends CachedSimVar {
    constructor(options) {
        super(options);

        this.rateScheduler = options.rateScheduler || globalRateScheduler;

        const [state, setState] = useState(super.value);
        this.setState = setState;
        this.state = state;

        this.setRefreshRate(options.refreshRate);
    }

    /**
     * Get the stateful value.
     */
    get value() {
        return this.state;
    }

    /**
     * Set the stateful value.
     */
    set value(value) {
        super.value = value;
        this.setState(super.value);
    }

    /**
     * Force update the SimVar state.
     */
    refresh() {
        this.setState(super.value);
    }

    /**
     * Set the refresh rate for this simvar.
     * @param refreshRate The refresh delay in ms. False-y to stop refreshing.
     */
    setRefreshRate(refreshRate) {
        this.rateScheduler.unschedule(this.identifier);
        if (refreshRate) this.rateScheduler.schedule(this.identifier, this.refresh.bind(this), refreshRate);
    }
}
