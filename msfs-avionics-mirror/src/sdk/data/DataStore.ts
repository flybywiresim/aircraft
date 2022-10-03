/// <reference types="msfstypes/JS/dataStorage" />

/* eslint-disable no-inner-declarations */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DataStore {
  /**
   * Writes a keyed value to the data store.
   * @param key A key.
   * @param value The value to set.
   */
  export function set<T extends boolean | number | string>(key: string, value: T): void {
    SetStoredData(key, JSON.stringify(value));
  }

  /**
   * Retrieves a keyed value from the data store.
   * @param key A key.
   * @returns the value stored under the key, or undefined if one could not be retrieved.
   */
  export function get<T extends boolean | number | string>(key: string): T | undefined {
    try {
      const string = GetStoredData(key);
      return JSON.parse(string);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Removes a key from the data store.
   * @param key The key to remove.
   */
  export function remove(key: string): void {
    DeleteStoredData(key);
  }
}