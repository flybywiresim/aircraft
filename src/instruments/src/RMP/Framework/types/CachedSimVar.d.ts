export class CachedSimVar {
    constructor(options: any);
    timeout: NodeJS.Timeout;
    ttl: any;
    cache: any;
    simVarGetter: any;
    simVarUnit: any;
    identifier: any;
    simVarSetter: any;
    /**
     * Set a cached value for this simvar.
     */
    set cached(arg: any);
    /**
     * Get the cached value of this simvar.
     */
    get cached(): any;
    /**
     * Set the value of this simvar.
     * Also updates cached value.
     */
    set value(arg: any);
    /**
     * Get the value of this simvar.
     * Returns cached if exists.
     */
    get value(): any;
}
