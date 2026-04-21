// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  DataStoreSettingKey,
  LegacyDataStoreSettingKey,
  NXDataStore,
  NXDataStoreSettings,
} from '@flybywiresim/fbw-sdk';
import { SimVarValueType } from '@microsoft/msfs-sdk';

interface BaseSyncedSettingDefinition {
  /** The local var to write, including the L: part. */
  localVarName: string;
  /** The type to write the local var with, defaults to `number`. */
  localVarUnit?: SimVarValueType | string;
}
interface LegacySyncedSettingDefinition<k extends string> extends BaseSyncedSettingDefinition {
  type: 'legacy';
  /** The NXDataStore key to read. */
  configKey: LegacyDataStoreSettingKey<k>;
  /** The default value of the config setting. */
  defaultValue: string | (() => string);
  /** Function to map the setting value to a numeric Lvar value. Defaults to `Number` constructor. */
  mapFunction?: (value: string) => number;
}

interface ModernSyncedSettingDefinition<K extends keyof NXDataStoreSettings> extends BaseSyncedSettingDefinition {
  type: 'setting';
  /** The NXDataStore setting to read. */
  settingKey: K;
  /** Function to map the setting value to a numeric Lvar value. Defaults to `Number` constructor. */
  mapFunction?: (value: NXDataStoreSettings[K]) => number;
}

export type SyncedSettingDefinition =
  | ModernSyncedSettingDefinition<DataStoreSettingKey>
  | LegacySyncedSettingDefinition<LegacyDataStoreSettingKey>;

export const globalSyncedSettings: SyncedSettingDefinition[] = [
  {
    type: 'legacy',
    configKey: 'SOUND_EXTERIOR_MASTER',
    localVarName: 'L:A32NX_SOUND_EXTERIOR_MASTER',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'SOUND_INTERIOR_ENGINE',
    localVarName: 'L:A32NX_SOUND_INTERIOR_ENGINE',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'SOUND_INTERIOR_WIND',
    localVarName: 'L:A32NX_SOUND_INTERIOR_WIND',
    defaultValue: '0',
  },
  { type: 'legacy', configKey: 'EFB_BRIGHTNESS', localVarName: 'L:A32NX_EFB_BRIGHTNESS', defaultValue: '0' },
  {
    type: 'legacy',
    configKey: 'EFB_USING_AUTOBRIGHTNESS',
    localVarName: 'L:A32NX_EFB_USING_AUTOBRIGHTNESS',
    localVarUnit: 'bool',
    defaultValue: '1',
  },
  {
    type: 'legacy',
    configKey: 'CABIN_MANUAL_BRIGHTNESS',
    localVarName: 'L:A32NX_CABIN_MANUAL_BRIGHTNESS',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'CABIN_USING_AUTOBRIGHTNESS',
    localVarName: 'L:A32NX_CABIN_USING_AUTOBRIGHTNESS',
    localVarUnit: 'bool',
    defaultValue: '1',
  },
  { type: 'legacy', configKey: 'ISIS_BARO_UNIT_INHG', localVarName: 'L:A32NX_ISIS_BARO_UNIT_INHG', defaultValue: '0' },
  {
    type: 'legacy',
    configKey: 'REALISTIC_TILLER_ENABLED',
    localVarName: 'L:A32NX_REALISTIC_TILLER_ENABLED',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'HOME_COCKPIT_ENABLED',
    localVarName: 'L:A32NX_HOME_COCKPIT_ENABLED',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'SOUND_PASSENGER_AMBIENCE_ENABLED',
    localVarName: 'L:A32NX_SOUND_PASSENGER_AMBIENCE_ENABLED',
    defaultValue: '1',
  },
  {
    type: 'legacy',
    configKey: 'SOUND_ANNOUNCEMENTS_ENABLED',
    localVarName: 'L:A32NX_SOUND_ANNOUNCEMENTS_ENABLED',
    defaultValue: '1',
  },
  {
    type: 'legacy',
    configKey: 'SOUND_BOARDING_MUSIC_ENABLED',
    localVarName: 'L:A32NX_SOUND_BOARDING_MUSIC_ENABLED',
    defaultValue: '1',
  },
  {
    type: 'legacy',
    configKey: 'RADIO_RECEIVER_USAGE_ENABLED',
    localVarName: 'L:A32NX_RADIO_RECEIVER_USAGE_ENABLED',
    defaultValue: '0',
  },
  { type: 'legacy', configKey: 'FDR_ENABLED', localVarName: 'L:A32NX_FDR_ENABLED', defaultValue: '1' },
  {
    type: 'legacy',
    configKey: 'MODEL_WHEELCHOCKS_ENABLED',
    localVarName: 'L:A32NX_MODEL_WHEELCHOCKS_ENABLED',
    localVarUnit: 'bool',
    defaultValue: '1',
  },
  {
    type: 'legacy',
    configKey: 'MODEL_CONES_ENABLED',
    localVarName: 'L:A32NX_MODEL_CONES_ENABLED',
    localVarUnit: 'bool',
    defaultValue: '1',
  },
  {
    type: 'legacy',
    configKey: 'FO_SYNC_EFIS_ENABLED',
    localVarName: 'L:A32NX_FO_SYNC_EFIS_ENABLED',
    localVarUnit: 'bool',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'MODEL_SATCOM_ENABLED',
    localVarName: 'L:A32NX_SATCOM_ENABLED',
    localVarUnit: 'bool',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'CONFIG_PILOT_AVATAR_VISIBLE',
    localVarName: 'L:A32NX_PILOT_AVATAR_VISIBLE_0',
    localVarUnit: 'bool',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'CONFIG_FIRST_OFFICER_AVATAR_VISIBLE',
    localVarName: 'L:A32NX_PILOT_AVATAR_VISIBLE_1',
    localVarUnit: 'bool',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'GSX_PAYLOAD_SYNC',
    localVarName: 'L:A32NX_GSX_PAYLOAD_SYNC_ENABLED',
    localVarUnit: 'bool',
    defaultValue: '0',
  },
  {
    type: 'setting',
    settingKey: 'CONFIG_USING_METRIC_UNIT',
    localVarName: 'L:A32NX_EFB_USING_METRIC_UNIT',
    localVarUnit: SimVarValueType.Bool,
  },
  {
    type: 'legacy',
    configKey: 'CONFIG_USING_PORTABLE_DEVICES',
    localVarName: 'L:A32NX_CONFIG_USING_PORTABLE_DEVICES',
    localVarUnit: 'bool',
    defaultValue: '1',
  },
  {
    type: 'legacy',
    configKey: 'REFUEL_RATE_SETTING',
    localVarName: 'L:A32NX_EFB_REFUEL_RATE_SETTING',
    defaultValue: '0',
  },
  {
    type: 'legacy',
    configKey: 'CONFIG_BOARDING_RATE',
    localVarName: 'L:A32NX_BOARDING_RATE',
    localVarUnit: 'enum',
    defaultValue: 'REAL',
    mapFunction: (v) => {
      switch (v) {
        default:
        case 'REAL':
          return 2;
        case 'FAST':
          return 1;
        case 'INSTANT':
          return 0;
      }
    },
  },
  {
    type: 'legacy',
    configKey: 'CONFIG_ALIGN_TIME',
    localVarName: 'L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME',
    localVarUnit: 'enum',
    defaultValue: 'REAL',
    mapFunction: (v) => {
      switch (v) {
        default:
        case 'REAL':
          return 0;
        case 'FAST':
          return 2;
        case 'INSTANT':
          return 1;
      }
    },
  },
];

function syncSetting(definition: SyncedSettingDefinition) {
  if (definition.type === 'setting') {
    NXDataStore.getSetting(definition.settingKey).sub((value) => {
      SimVar.SetSimVarValue(
        definition.localVarName,
        definition.localVarUnit ?? SimVarValueType.Number,
        (definition.mapFunction ?? Number)(value),
      ).catch((e) => console.log(definition.settingKey, e));
    }, true);
  } else {
    NXDataStore.getAndSubscribeLegacy(
      definition.configKey,
      (prop, value) => {
        if (value === undefined) {
          console.warn(`(syncSetting) Did not sync setting ${definition.configKey} because the value was undefined`);
          return;
        }

        SimVar.SetSimVarValue(
          definition.localVarName,
          definition.localVarUnit ?? SimVarValueType.Number,
          (definition.mapFunction ?? Number)(value),
        ).catch((e) => console.log(definition.configKey, e));
      },
      typeof definition.defaultValue === 'function' ? definition.defaultValue() : definition.defaultValue,
    );
  }
}

export function syncSettingsFromPersistentStorage(settingDefinitions: SyncedSettingDefinition[]) {
  settingDefinitions.forEach((s) => syncSetting(s));
}
