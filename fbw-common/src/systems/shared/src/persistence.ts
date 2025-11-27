// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MutableSubscribable, Subject } from '@microsoft/msfs-sdk';

export type DataStoreSettingKey = keyof NXDataStoreSettings & string;
type DataStoreSettingValue = string | number | boolean;

type SubscribeCallback = (key: string, value: string | undefined) => void;
type SubscribeCancellation = () => void;

export interface NXDataStoreSettings {
  EFB_UI_THEME: 'blue' | 'dark' | 'light';
}

export type LegacyDataStoreSettingKey<k extends string> = k & (k extends keyof NXDataStoreSettings ? never : k);

/**
 * Allows interacting with the persistent storage
 */
export class NXDataStore {
  private static readonly settingsDefaultValues: { [k in keyof NXDataStoreSettings]: NXDataStoreSettings[k] } = {
    EFB_UI_THEME: 'blue',
  };

  private static readonly aircraftProjectPrefix: string = process.env.AIRCRAFT_PROJECT_PREFIX?.toUpperCase() ?? 'UNK';

  private static mListener: ViewListener.ViewListener;

  private static get listener() {
    if (this.mListener === undefined) {
      this.mListener = RegisterViewListener('JS_LISTENER_SIMVARS', undefined, true);
    }
    return this.mListener;
  }

  private static get settingSubjectMap(): Map<string, Subject<any>> {
    // We store the subject map on the window rather than on a static property,
    // because there might be multiples instances of this class (multiple instruments in one VCockpit) and
    // triggerToAllSubscribers does not work across instruments on the same VCockpit.

    if (window.NXDATASTORE_SUBJECT_MAP !== undefined) {
      return window.NXDATASTORE_SUBJECT_MAP;
    }

    return (window.NXDATASTORE_SUBJECT_MAP = new Map());
  }

  /**
   * Gets a mutable subscribable setting given a key. This subscribable is updated whenever the setting is changed, and setting it
   * will change the setting.
   * @param key the key of the setting
   * @returns a mutable subscribable
   */
  public static getSetting<k extends DataStoreSettingKey>(key: k): MutableSubscribable<NXDataStoreSettings[k]> {
    let subject = NXDataStore.settingSubjectMap.get(key);

    if (subject === undefined) {
      subject = NXDataStore.createSettingSubject(key);

      this.settingSubjectMap.set(key, subject);
    }

    return subject;
  }

  /**
   * Creates a subject given a data store setting key
   * @param key the key of the setting
   * @returns a subject
   */
  private static createSettingSubject<k extends DataStoreSettingKey>(key: k): Subject<NXDataStoreSettings[k]> {
    const value = NXDataStore.getTypedSettingValue(key);

    const subject = Subject.create(value);

    // Don't need to keep track of those subscriptions, because the subjects are singletons
    NXDataStore.subscribeRaw((updatedKey) => {
      if (updatedKey === key) {
        subject.set(NXDataStore.getTypedSettingValue(key));
      }
    });
    subject.sub((value) => NXDataStore.setTypedSettingValue(key, value));

    return subject;
  }

  /**
   * Obtains a typed value given a setting key. If the setting was previously saved as a legacy setting, it is updated in the
   * data store to be compatible with modern settings.
   * @param key the key of the setting
   * @returns a typed value for the setting
   */
  private static getTypedSettingValue<k extends DataStoreSettingKey>(key: k): NXDataStoreSettings[k] {
    const rawValue = NXDataStore.getRaw(key);

    let parsed: DataStoreSettingValue;
    try {
      parsed = JSON.parse(rawValue);
    } catch (e) {
      let newValue: string;

      if (rawValue === '') {
        // Non-existent settings return an empty string
        newValue = NXDataStore.settingsDefaultValues[key];
      } else {
        // This will happen if the setting is a string, and it was previously saved as a legacy setting. Convert it to a JSON value.
        newValue = rawValue;
      }

      NXDataStore.setTypedSettingValue(key, newValue as NXDataStoreSettings[k]);
      parsed = newValue;
    }

    return parsed as NXDataStoreSettings[k];
  }

  /**
   * Sets a typed value for a setting key.
   * @param key the key of the setting
   * @param value a typed value for the setting
   */
  private static setTypedSettingValue<k extends DataStoreSettingKey>(key: k, value: NXDataStoreSettings[k]): void {
    const rawValue = JSON.stringify(value);

    NXDataStore.setRaw(key, rawValue);
  }

  /**
   * Reads a value from persistent storage
   * @param key The property key
   * @param defaultVal The default value if the property is not set
   * @deprecated
   */
  public static getLegacy<k extends string>(key: LegacyDataStoreSettingKey<k>, defaultVal: string): string;
  /**
   * Reads a value from persistent storage
   * @param key The property key
   * @param defaultVal The default value if the property is not set
   * @deprecated
   */
  public static getLegacy<k extends string>(key: LegacyDataStoreSettingKey<k>, defaultVal?: string): string | undefined;
  /**
   * Reads a value from persistent storage
   * @param key The property key
   * @param defaultVal The default value if the property is not set
   * @deprecated
   */
  public static getLegacy<k extends string>(key: LegacyDataStoreSettingKey<k>, defaultVal?: string): any {
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
  public static setLegacy<k extends string>(key: LegacyDataStoreSettingKey<k>, val: string): void {
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
  public static subscribeLegacy<k extends string>(
    key: LegacyDataStoreSettingKey<k>,
    callback: SubscribeCallback,
  ): SubscribeCancellation {
    return NXDataStore.subscribeRaw((updatedKey, value) => {
      if (key === '*' || key === updatedKey) {
        callback(updatedKey, value);
      }
    });
  }

  /**
   * Subscribes to raw DataStore update events
   * @param callback a callback for every update
   * @returns a function to cancel the subscription
   */
  private static subscribeRaw(callback: SubscribeCallback): SubscribeCancellation {
    return Coherent.on('FBW_NXDATASTORE_UPDATE', callback).clear;
  }

  /**
   * @deprecated
   */
  public static getAndSubscribeLegacy<k extends string>(
    key: LegacyDataStoreSettingKey<k>,
    callback: SubscribeCallback,
    defaultVal?: string,
  ): SubscribeCancellation {
    callback(key, NXDataStore.getLegacy(key, defaultVal));
    return NXDataStore.subscribeLegacy(key, callback);
  }
}
