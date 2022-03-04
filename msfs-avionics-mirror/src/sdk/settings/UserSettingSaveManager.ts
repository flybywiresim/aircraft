import { Consumer } from '../data/Consumer';
import { DataStore } from '../data/DataStore';
import { EventBus } from '../data/EventBus';
import { UserSetting, UserSettingType } from './UserSetting';

/**
 * A UserSettingSaveManager entry for a setting.
 */
type UserSettingSaveManagerEntry<T extends UserSettingType> = {
  /** A setting. */
  setting: UserSetting<any, T>,

  /** An event bus consumer which consumes setting value change events. */
  consumer: Consumer<T>,

  /** A function which handles setting value change events. */
  eventHandler: (value: T) => void,

  /** The data store keys to which the setting's value should be automatically saved. */
  autoSaveDataStoreKeys: string[]
}

/**
 * A manager for user settings that are saved and persistent across flight sessions. The manager facilitates saving
 * and loading setting values to and from multiple keyed save slots and also supports auto-saving. Uses Data Store to
 * store saved setting values.
 */
export class UserSettingSaveManager {
  private static readonly DATASTORE_PREFIX = 'persistent-setting';

  private readonly entries: UserSettingSaveManagerEntry<UserSettingType>[];
  private readonly autoSaveKeys = new Set<string>();

  /**
   * Constructor.
   * @param settings This manager's managed settings.
   * @param bus The event bus.
   */
  constructor(settings: UserSetting<any, UserSettingType>[], bus: EventBus) {
    const subscriber = bus.getSubscriber<any>();

    this.entries = Array.from(settings, setting => {
      const autoSaveDataStoreKeys: string[] = [];
      return {
        setting,
        consumer: subscriber.on(setting.definition.name).whenChanged(),
        eventHandler: this.onSettingChanged.bind(this, autoSaveDataStoreKeys),
        autoSaveDataStoreKeys
      };
    });
  }

  /**
   * A callback which is called when a setting's value changes.
   * @param autoSaveDataStoreKeys The data store keys to which the setting's value should be automatically saved.
   * @param value The new value of the setting.
   */
  private onSettingChanged<T extends UserSettingType>(autoSaveDataStoreKeys: string[], value: T): void {
    const len = autoSaveDataStoreKeys.length;
    for (let i = 0; i < len; i++) {
      DataStore.set(autoSaveDataStoreKeys[i], value);
    }
  }

  /**
   * Loads the saved values of this manager's settings.
   * @param key The key from which to load the values.
   */
  public load(key: string): void {
    const len = this.entries.length;
    for (let i = 0; i < len; i++) {
      const entry = this.entries[i];
      const dataStoreKey = UserSettingSaveManager.getDataStoreKey(entry.setting, key);
      const storedValue = DataStore.get(dataStoreKey);
      if (storedValue !== undefined) {
        entry.setting.value = storedValue;
      }
    }
  }

  /**
   * Saves the current values of this manager's settings.
   * @param key The key to which to save the values.
   */
  public save(key: string): void {
    const len = this.entries.length;
    for (let i = 0; i < len; i++) {
      const entry = this.entries[i];
      const dataStoreKey = UserSettingSaveManager.getDataStoreKey(entry.setting, key);
      DataStore.set(dataStoreKey, entry.setting.value);
    }
  }

  /**
   * Starts automatically saving this manager's settings when their values change.
   * @param key The key to which to save the values.
   */
  public startAutoSave(key: string): void {
    if (this.autoSaveKeys.has(key)) {
      return;
    }

    const len = this.entries.length;
    for (let i = 0; i < len; i++) {
      const entry = this.entries[i];
      entry.autoSaveDataStoreKeys.push(UserSettingSaveManager.getDataStoreKey(entry.setting, key));
      if (entry.autoSaveDataStoreKeys.length === 1) {
        entry.consumer.handle(entry.eventHandler);
      }
    }
  }

  /**
   * Stops automatically saving this manager's settings when their values change.
   * @param key The key to which to stop saving the values.
   */
  public stopAutoSave(key: string): void {
    if (!this.autoSaveKeys.has(key)) {
      return;
    }

    const len = this.entries.length;
    for (let i = 0; i < len; i++) {
      const entry = this.entries[i];
      entry.autoSaveDataStoreKeys.splice(entry.autoSaveDataStoreKeys.indexOf(UserSettingSaveManager.getDataStoreKey(entry.setting, key)), 1);
      if (entry.autoSaveDataStoreKeys.length === 0) {
        entry.consumer.off(entry.eventHandler);
      }
    }
  }

  /**
   * Gets a data store key for a specific setting and save key.
   * @param setting A user setting.
   * @param saveKey The save key.
   * @returns the data store key for the setting and save key.
   */
  private static getDataStoreKey(setting: UserSetting<any, any>, saveKey: string): string {
    return `${UserSettingSaveManager.DATASTORE_PREFIX}.${saveKey}.${setting.definition.name}`;
  }
}