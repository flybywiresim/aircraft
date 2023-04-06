export declare namespace DataStore {
    /**
     * Writes a keyed value to the data store.
     * @param key A key.
     * @param value The value to set.
     */
    function set<T extends boolean | number | string>(key: string, value: T): void;
    /**
     * Retrieves a keyed value from the data store.
     * @param key A key.
     * @returns the value stored under the key, or undefined if one could not be retrieved.
     */
    function get<T extends boolean | number | string>(key: string): T | undefined;
    /**
     * Removes a key from the data store.
     * @param key The key to remove.
     */
    function remove(key: string): void;
}
//# sourceMappingURL=DataStore.d.ts.map