import { BasicConsumer, Consumer, EventBus } from '../data';
import { AbstractSubscribable } from '../sub/AbstractSubscribable';
import { Subscription } from '../sub/Subscription';
import {
  MappedUserSettingManager, UserSetting, UserSettingDefinition, UserSettingManager, UserSettingMap, UserSettingRecord, UserSettingValue
} from './UserSetting';

/**
 * An aliased user setting manager which can dynamically (re)define the settings from which its aliased settings are
 * sourced.
 */
export class AliasedUserSettingManager<T extends UserSettingRecord> implements UserSettingManager<T> {
  private readonly aliasedSettings: Map<string, AliasedUserSetting<UserSettingValue>>;

  private manager?: UserSettingManager<T>;

  /**
   * Constructor.
   * @param bus The bus used by this manager to publish setting change events.
   * @param settingDefs The setting definitions used to initialize this manager's settings. The definitions should
   * define the settings' aliased names.
   */
  constructor(
    private readonly bus: EventBus,
    settingDefs: readonly UserSettingDefinition<T[keyof T & string]>[]
  ) {
    this.aliasedSettings = new Map(settingDefs.map(def => [def.name, new AliasedUserSetting(def) as unknown as AliasedUserSetting<UserSettingValue>]));
  }

  /**
   * Defines the mappings from this manager's aliased settings to their source settings. Once the mappings are defined,
   * each aliased setting will take the value of its source setting, and setting the value of the aliased setting will
   * also set the value of the source setting. If a source setting cannot be defined for an aliased setting, the
   * aliased setting's value will be fixed to its default value and cannot be changed.
   * @param masterManager The manager hosting the settings from which this manager's aliased settings will be sourced.
   * @param map The mappings for this manager's aliased settings, as a set of key-value pairs where the keys are the
   * aliased setting names and the values are the source setting names. For any aliased setting whose name does not
   * appear as a key in the mapping, its source setting is assumed to have the same name.
   */
  public useAliases<O extends UserSettingRecord>(masterManager: UserSettingManager<O>, map: UserSettingMap<T, O>): void {
    this.manager = masterManager.mapTo(map) as unknown as UserSettingManager<T>;

    for (const aliasedSetting of this.aliasedSettings.values()) {
      aliasedSetting.useSource(this.manager.tryGetSetting(aliasedSetting.definition.name));
    }
  }

  /** @inheritdoc */
  public tryGetSetting<K extends string>(name: K): UserSetting<NonNullable<T[K]>> | undefined {
    return this.aliasedSettings.get(name) as UserSetting<NonNullable<T[K]>> | undefined;
  }

  /** @inheritdoc */
  public getSetting<K extends keyof T & string>(name: K): UserSetting<NonNullable<T[K]>> {
    const setting = this.tryGetSetting(name);
    if (setting === undefined) {
      throw new Error(`AliasedUserSettingManager: Could not find setting with name ${name}`);
    }

    return setting as UserSetting<NonNullable<T[K]>>;
  }

  /** @inheritdoc */
  public whenSettingChanged<K extends keyof T & string>(name: K): Consumer<NonNullable<T[K]>> {
    const setting = this.aliasedSettings.get(name) as UserSetting<NonNullable<T[K]>> | undefined;
    if (!setting) {
      throw new Error(`AliasedUserSettingManager: Could not find setting with name ${name}`);
    }

    return new BasicConsumer<NonNullable<T[K]>>((handler, paused) => {
      return setting.sub(handler, true, paused);
    }).whenChanged();
  }

  /** @inheritdoc */
  public getAllSettings(): UserSetting<UserSettingValue>[] {
    return Array.from(this.aliasedSettings.values());
  }

  /** @inheritdoc */
  public mapTo<M extends Record<any, UserSettingValue>>(map: UserSettingMap<M, T>): UserSettingManager<M & T> {
    return new MappedUserSettingManager(this, map);
  }
}

/**
 * A user setting with a value which is sourced from another setting. While the setting has no source, its value is
 * fixed to its default value and cannot be changed.
 */
class AliasedUserSetting<T extends UserSettingValue> extends AbstractSubscribable<T> implements UserSetting<T> {
  public readonly isMutableSubscribable = true;

  /**
   * The user setting backing this deferred setting, or undefined if this setting has not been initialized.
   */
  private setting?: UserSetting<T>;

  // eslint-disable-next-line jsdoc/require-returns
  /** This setting's current value. */
  public get value(): T {
    return this.setting?.value ?? this.definition.defaultValue;
  }
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set value(v: T) {
    this.setting && (this.setting.value = v);
  }

  private settingSub?: Subscription;

  /**
   * Constructor.
   * @param definition This setting's definition.
   */
  constructor(
    public readonly definition: UserSettingDefinition<T>
  ) {
    super();
  }

  /**
   * Sets this setting's source.
   * @param setting The user setting to use as the new source, or `undefined` to leave this setting without a source.
   */
  public useSource(setting: UserSetting<T> | undefined): void {
    const oldValue = this.value;

    this.settingSub?.destroy();

    this.setting = setting;

    if (setting !== undefined) {
      this.settingSub = setting.sub(() => { this.notify(); });
    } else {
      this.settingSub = undefined;
    }

    if (oldValue !== this.value) {
      this.notify();
    }
  }

  /** @inheritdoc */
  public get(): T {
    return this.value;
  }

  /**
   * Sets the value of this setting.
   * @param value The new value.
   */
  public set(value: T): void {
    this.value = value;
  }

  /** @inheritdoc */
  public resetToDefault(): void {
    this.set(this.definition.defaultValue);
  }
}