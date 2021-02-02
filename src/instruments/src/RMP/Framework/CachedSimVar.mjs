// Currently a global cache.
// Holland said it's okay!
const globalCache = new Map();

export class CachedSimVar {
    constructor(options) {
        // Used to store setTimeout.
        this.timeout = undefined;
        // Cache time to live.
        this.ttl = options.ttl || 100;
        // Used to store the cached value.
        this.cache = options.cache || globalCache;
        // The simvar used to get the value.
        this.simVarGetter = options.simVarGetter;
        // The unit used for both getting and setting values.
        this.simVarUnit = options.simVarUnit || 'Number';
        // A string identifiter used to identify this simvar in the cache.
        this.identifier = options.identifier || this.simVarGetter;
        // The simvar used to set the value (defaults to same as get).
        this.simVarSetter = options.simVarSetter || this.simVarGetter;
    }

    /**
     * Get the cached value of this simvar.
     */
    get cached() {
        return this.cache.get(this.identifier);
    }

    /**
     * Set a cached value for this simvar.
     */
    set cached(value) {
        this.cache.set(this.identifier, value);
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.cache.delete(this.identifier), this.ttl);
    }

    /**
     * Get the value of this simvar.
     * Returns cached if exists.
     */
    get value() {
        if (!this.cached) this.cached = SimVar.GetSimVarValue(this.simVarGetter, this.simVarUnit);
        return this.cached;
    }

    /**
     * Set the value of this simvar.
     * Also updates cached value.
     */
    set value(value) {
        this.cached = value;
        SimVar.SetSimVarValue(this.simVarSetter, this.simVarUnit, value);
    }
}
