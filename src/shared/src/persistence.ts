export type StorageValue = string | number;

export type StorageContents<T> = T extends undefined ? StorageValue : T;

declare function GetStoredData<T extends StorageValue>(property: string, defaultValue?: StorageContents<T>);
declare function SetStoredData<T extends StorageValue>(property: string, newValue: StorageContents<T>);

type SubscribeCallback<T extends StorageValue> = (key: string, value: StorageContents<T>) => void;
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
     *
     * @param key The property key
     * @param defaultVal The default value if the property is not set
     */
    static get<T extends StorageValue>(key: string, defaultVal?: StorageContents<T>): StorageContents<T> {
        const val = GetStoredData(`A32NX_${key}`);
        if (!val) {
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
    static set<T extends StorageValue>(key: string, val: StorageContents<T>): void {
        SetStoredData(`A32NX_${key}`, val);
        this.listener.triggerToAllSubscribers('A32NX_NXDATASTORE_UPDATE', key, val);
    }

    static subscribe<T extends StorageValue>(key: string, callback: SubscribeCallback<T>): SubscribeCancellation {
        return Coherent.on('A32NX_NXDATASTORE_UPDATE', (updatedKey: string, value: StorageContents<T>) => {
            if (key === '*' || key === updatedKey) {
                callback(updatedKey, value);
            }
        }).clear;
    }

    static getAndSubscribe<T extends StorageValue>(key: string, callback: SubscribeCallback<T>, defaultVal?: StorageContents<T>): SubscribeCancellation {
        callback(key, NXDataStore.get<T>(key, defaultVal));
        return NXDataStore.subscribe<T>(key, callback);
    }
}
