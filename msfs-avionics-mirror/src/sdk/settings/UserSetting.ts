import { Consumer } from '../data';
import { EventBus, Publisher } from '../data/EventBus';
import { EventSubscriber } from '../data/EventSubscriber';
import { Subject } from '../utils/Subject';

/** The supported data types for a user setting. */
export type UserSettingType = boolean | number | string;

/**
 * A definition for a user setting.
 */
export interface UserSettingDefinition<K, T extends UserSettingType> {
  /** The name of this setting. */
  readonly name: K;

  /** The default value of this setting. */
  readonly defaultValue: T;
}

/**
 * A user setting.
 */
export interface UserSetting<K, T extends UserSettingType> {
  /** This setting's definition. */
  readonly definition: UserSettingDefinition<K, T>;

  /** This setting's current value. */
  value: T;
}

/**
 * Filters a record of user settings to just those settings whose values extend a certain type.
 */
export type UserSettingValueFilter<T extends Record<any, UserSettingType>, V> = {
  [Property in keyof T as (T[Property] extends V ? Property : never)]: T[Property]
}

/**
 * An entry for a user setting in UserSettingManager.
 */
export type UserSettingManagerEntry<K, T extends UserSettingType> = {
  /** A user setting. */
  setting: SyncableUserSetting<K, T>,

  /** The event topic used to sync the setting. */
  syncTopic: string,

  /** The timestamp of the most recent sync event. */
  syncTime: number
}

/**
 * Data provided for a setting sync event.
 */
export type UserSettingManagerSyncData<T extends UserSettingType> = {
  /** The synced value of the setting. */
  value: T;

  /** The timestamp of this sync event. */
  syncTime: number;
}

/**
 * An entry that maps one set of setting definitions to another.
 */
type MappedUserSettingDefinition<K, V> = {
  [Property in keyof K]: keyof V | undefined;
}

/**
 * A manager for user settings. Provides settings using their names as keys, publishes value change events on the
 * event bus, and keeps setting values up to date when receiving change events across the bus.
 */
export interface UserSettingManager<T extends Record<any, UserSettingType>> {
  /**
   * Gets a setting from this manager.
   * @param name The name of the setting to get.
   * @returns a setting.
   * @throws Error if no setting with the specified name exists.
   */
  getSetting<K extends keyof T>(name: K): UserSetting<K, T[K]>;

  /**
   * Gets a consumer which notifies handlers when the value of a setting changes.
   * @param name The name of a setting.
   * @returns a consumer which notifies handlers when the value of the setting changes.
   * @throws Error if no setting with the specified name exists.
   */
  whenSettingChanged<K extends keyof T>(name: K): Consumer<T[K]>;
}

/**
 * A manager for user settings. Provides settings using their names as keys, publishes value change events on the
 * event bus, and keeps setting values up to date when receiving change events across the bus.
 */
export class DefaultUserSettingManager<T extends Record<any, UserSettingType>> implements UserSettingManager<T> {
  private static readonly SYNC_TOPIC_PREFIX = 'usersetting.';

  protected readonly settings: Map<keyof T, UserSettingManagerEntry<keyof T, T[keyof T]>>;
  protected readonly publisher: Publisher<any>;
  protected readonly subscriber: EventSubscriber<any>;

  /**
   * Constructor.
   * @param bus The bus used by this manager to publish setting change events.
   * @param settingDefs The setting definitions used to initialize this manager's settings.
   */
  constructor(
    protected readonly bus: EventBus,
    settingDefs: UserSettingDefinition<keyof T, T[keyof T]>[]
  ) {
    this.publisher = bus.getPublisher();
    this.subscriber = bus.getSubscriber<T>();

    this.settings = new Map(settingDefs.map(def => {
      const syncTopic = `${DefaultUserSettingManager.SYNC_TOPIC_PREFIX}${def.name}`;
      const entry: any = {
        syncTopic,
        syncTime: 0
      };
      entry.setting = new SyncableUserSetting(def, this.onSettingValueChanged.bind(this, entry));
      this.subscriber.on(syncTopic).handle(this.onSettingValueSynced.bind(this, entry));
      this.onSettingValueChanged(entry, entry.setting.value);
      return [def.name, entry];
    }));
  }

  /**
   * Gets a setting from this manager.
   * @param name The name of the setting to get.
   * @returns a setting.
   * @throws Error if no setting with the specified name exists.
   */
  public getSetting<K extends keyof T>(name: K): UserSetting<K, T[K]> {
    const entry = this.settings.get(name);
    if (!entry) {
      throw new Error(`Could not find setting with name ${name}`);
    }

    return entry.setting as unknown as UserSetting<K, T[K]>;
  }

  /**
   * Gets an array of all settings of this manager.
   * @returns an array of all settings of this manager.
   */
  public getAllSettings(): UserSetting<keyof T, T[keyof T]>[] {
    return Array.from(this.settings.values(), entry => entry.setting);
  }

  /**
   * Gets a consumer which notifies handlers when the value of a setting changes.
   * @param name The name of a setting.
   * @returns a consumer which notifies handlers when the value of the setting changes.
   * @throws Error if no setting with the specified name exists.
   */
  public whenSettingChanged<K extends keyof T>(name: K): Consumer<T[K]> {
    const setting = this.settings.get(name);
    if (!setting) {
      throw new Error(`Could not find setting with name ${name}`);
    }

    return this.subscriber.on(name).whenChanged();
  }

  /**
   * Maps a user setting manager to abstracted settings keys.
   * @param map The map of key abstractions to apply.
   * @returns A new mapped user setting manager.
   */
  public mapTo<M extends Record<any, boolean | number | string>>(map: MappedUserSettingDefinition<M, T>): MappedUserSettingManager<T, M> {
    return new MappedUserSettingManager(this, map);
  }

  /**
   * A callback which is called when one of this manager's settings has its value changed locally.
   * @param entry The entry for the setting that was changed.
   * @param value The new value of the setting.
   */
  protected onSettingValueChanged<K extends keyof T>(entry: UserSettingManagerEntry<K, T[K]>, value: T[K]): void {
    entry.syncTime = Date.now();
    this.publisher.pub(entry.syncTopic, { value, syncTime: entry.syncTime }, true, true);
  }

  /**
   * A callback which is called when a setting changed event is received over the event bus.
   * @param entry The entry for the setting that was changed.
   * @param data The sync data.
   */
  protected onSettingValueSynced<K extends keyof T>(entry: UserSettingManagerEntry<K, T[K]>, data: UserSettingManagerSyncData<T[K]>): void {
    // protect against race conditions by not responding to sync events older than the last time this manager synced
    // the setting
    if (data.syncTime < entry.syncTime) {
      return;
    }

    entry.syncTime = data.syncTime;
    entry.setting.syncValue(data.value);

    // publish the public setting change event. Do NOT sync across the bus because doing so can result in older events
    // being received after newer events.
    this.publisher.pub(entry.setting.definition.name, data.value, false, true);
  }
}

/**
 * A manager for user settings. Provides settings using their names as keys, publishes value change events on the
 * event bus, and keeps setting values up to date when receiving change events across the bus, using a mapping from
 * abstracted settings keys to true underlying settings keys.
 */
export class MappedUserSettingManager<T extends Record<any, boolean | number | string>, M extends Record<any, boolean | number | string>> implements UserSettingManager<T & M> {

  /**
   * Creates an instance of a MappedUserSettingManager.
   * @param parent The parent setting manager.
   * @param map The map of abstracted keys to true underlying keys.
   */
  constructor(private readonly parent: UserSettingManager<T>, private readonly map: MappedUserSettingDefinition<M, T>) { }

  /** @inheritdoc */
  getSetting<K extends keyof M | keyof T>(name: K): UserSetting<K, (T & M)[K]> {
    const mappedName = (this.map[name] ?? name) as keyof T;
    return this.parent.getSetting(mappedName) as UserSetting<K, (T & M)[K]>;
  }

  /** @inheritdoc */
  whenSettingChanged<K extends keyof M | keyof T>(name: K): Consumer<(T & M)[K]> {
    const mappedName = (this.map[name] ?? name) as keyof T;
    return this.parent.whenSettingChanged(mappedName) as unknown as Consumer<(T & M)[K]>;
  }
}

/**
 * An implementation of a user setting which can be synced across multiple instances.
 */
class SyncableUserSetting<K, T extends boolean | number | string> implements UserSetting<K, T> {
  /**
   * A subject which provides this setting's current value.
   */
  private readonly valueSub: Subject<T>;

  // eslint-disable-next-line jsdoc/require-returns
  /** This setting's current value. */
  public get value(): T {
    return this.valueSub.get();
  }
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set value(v: T) {
    this.valueSub.set(v);
  }

  private isSyncing = false;

  /**
   * Constructor.
   * @param definition This setting's definition.
   * @param valueChangedCallback A function to be called whenever the value of this setting changes.
   */
  constructor(
    public readonly definition: UserSettingDefinition<K, T>,
    private readonly valueChangedCallback: (value: T) => void
  ) {
    this.valueSub = Subject.create(definition.defaultValue);
    this.valueSub.sub(v => {
      !this.isSyncing && valueChangedCallback(v);
    });
  }

  /**
   * Syncs this setting to a value. This will not trigger a call to valueChangedCallback.
   * @param value The value to which to sync.
   */
  public syncValue(value: T): void {
    this.isSyncing = true;
    this.valueSub.set(value);
    this.isSyncing = false;
  }
}