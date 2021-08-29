declare function GetStoredData(property: string, defaultValue?: string);
declare function SetStoredData(property: string, newValue: string);

type SubscribeCallback = (key: string, value: string) => void;
type SubscribeCancellation = () => void;

/**
 * Allows interacting with the persistent storage
 */
export class NXDataStore {
    private static mListener: ViewListener.ViewListener;

    private static get listener() {
        if (this.mListener === undefined) {
            this.mListener = RegisterViewListener('JS_LISTENER_SIMVARS');
        }
        return this.mListener;
    }

    /**
     * Reads a value from persistent storage
     * @param key The property key
     * @param defaultVal The default value if the property is not set
     */
    static get(key: string, defaultVal: string): string;
    static get(key: string, defaultVal?: string): string | undefined;
    static get(key: string, defaultVal?: string): any {
        const val = GetStoredData(`A32NX_${key}`);
        // GetStoredData returns null on error, or empty string for keys that don't exist (why isn't that an error??)
        // We could use SearchStoredData, but that spams the console with every key (somebody left their debug print in)
        if (val === null || val.length === 0) {
            return defaultVal;
        }
        return val;
    }

    /**
     * Sets a value in persistent storage
     *
     * @param key The property key
     * @param val The value to assign to the property
     */
    static set(key: string, val: string): void {
        SetStoredData(`A32NX_${key}`, val);
        this.listener.triggerToAllSubscribers('A32NX_NXDATASTORE_UPDATE', key, val);
    }

    static subscribe(key: string, callback: SubscribeCallback): SubscribeCancellation {
        return Coherent.on('A32NX_NXDATASTORE_UPDATE', (updatedKey: string, value: string) => {
            if (key === '*' || key === updatedKey) {
                callback(updatedKey, value);
            }
        }).clear;
    }

    static getAndSubscribe(key: string, callback: SubscribeCallback, defaultVal?: string): SubscribeCancellation {
        callback(key, NXDataStore.get(key, defaultVal));
        return NXDataStore.subscribe(key, callback);
    }
}
