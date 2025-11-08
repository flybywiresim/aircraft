type SubscribeCallback = (key: string, value: string | undefined) => void;
type SubscribeCancellation = () => void;

/**
 * Allows interacting with the persistent storage
 */
export class NXDataStore {
  private static aircraftProjectPrefix: string = process.env.AIRCRAFT_PROJECT_PREFIX?.toUpperCase() ?? 'UNK';

  private static mListener: ViewListener.ViewListener;

  private static get listener() {
    if (this.mListener === undefined) {
      this.mListener = RegisterViewListener('JS_LISTENER_SIMVARS', undefined, true);
    }
    return this.mListener;
  }

  /**
   * Reads a value from persistent storage
   * @param key The property key
   * @param defaultVal The default value if the property is not set
   * @deprecated
   */
  public static getLegacy(key: string, defaultVal: string): string;
  /**
   * Reads a value from persistent storage
   * @param key The property key
   * @param defaultVal The default value if the property is not set
   * @deprecated
   */
  public static getLegacy(key: string, defaultVal?: string): string | undefined;
  /**
   * Reads a value from persistent storage
   * @param key The property key
   * @param defaultVal The default value if the property is not set
   * @deprecated
   */
  public static getLegacy(key: string, defaultVal?: string): any {
    const val = NXDataStore.getRaw(key);

    // GetStoredData returns null on error, or empty string for keys that don't exist (why isn't that an error??)
    // We could use SearchStoredData, but that spams the console with every key (somebody left their debug print in)
    if (val === null || val.length === 0) {
      return defaultVal;
    }

    return val;
  }

  /**
   * Gets a raw value from the sim DataStore
   * @param key the key
   * @returns a string, or the empty string if the value is not present
   */
  private static getRaw(key: string): string {
    return GetStoredData(`${this.aircraftProjectPrefix}_${key}`);
  }

  /**
   * Sets a value in persistent storage
   *
   * @param key The property key
   * @param val The value to assign to the property
   *
   * @deprecated
   */
  public static setLegacy(key: string, val: string): void {
    NXDataStore.setRaw(key, val);

    this.listener.triggerToAllSubscribers('FBW_NXDATASTORE_UPDATE', key, val);
  }

  /**
   * Sets raw value into the sim DataStore
   * @param key the key
   * @param val the value
   */
  private static setRaw(key: string, val: string): void {
    SetStoredData(`${this.aircraftProjectPrefix}_${key}`, val);
  }

  /**
   * @deprecated
   */
  public static subscribeLegacy(key: string, callback: SubscribeCallback): SubscribeCancellation {
    return Coherent.on('FBW_NXDATASTORE_UPDATE', (updatedKey: string, value: string) => {
      if (key === '*' || key === updatedKey) {
        callback(updatedKey, value);
      }
    }).clear;
  }

  /**
   * @deprecated
   */
  public static getAndSubscribeLegacy(
    key: string,
    callback: SubscribeCallback,
    defaultVal?: string,
  ): SubscribeCancellation {
    callback(key, NXDataStore.getLegacy(key, defaultVal));
    return NXDataStore.subscribeLegacy(key, callback);
  }
}
