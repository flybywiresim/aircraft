type StorageValue = string | number

type StorageContents<T> = T extends undefined ? StorageValue : T

declare function GetStoredData<T extends StorageValue>(property: string, defaultValue?: StorageContents<T>);
declare function SetStoredData<T extends StorageValue>(property: string, newValue: StorageContents<T>);

/**
 * Allows interacting with the persistent storage
 */
export class NXDataStore {
    /**
     * Reads a value from persistent storage
     *
     * @param key The property key
     * @param defaultVal The default value if the property is not set
     */
    static get<T extends StorageValue>(key: string, defaultVal?: StorageContents<T>): StorageContents<T> {
        const val = GetStoredData(`A32NX_${key}`);
        if (val === undefined || val === null) {
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
    }
}
