// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';

type SimVarProp = { name: string; defaultValue: string };
type migrationSet = [oldSimvar: SimVarProp, newSimvar: string];

const migrateSetting = (oldSimvar: SimVarProp, newSimvar: string) => {
  NXDataStore.set(newSimvar, NXDataStore.get(oldSimvar.name, oldSimvar.defaultValue));
};

// Object is set so that a list of simvars will be migrated when the migrated flag is false.
const settingsToMigrate: Map<string, migrationSet[]> = new Map([
  [
    'SIMBRIDGE_MIGRATED',
    [
      [{ name: 'CONFIG_EXTERNAL_MCDU_PORT', defaultValue: '8380' }, 'CONFIG_SIMBRIDGE_PORT'],
      [{ name: 'CONFIG_EXTERNAL_MCDU_SERVER_ENABLED', defaultValue: 'AUTO ON' }, 'CONFIG_SIMBRIDGE_ENABLED'],
    ],
  ],
]);

export function migrateSettings() {
  settingsToMigrate.forEach((migrations, migrationCheck) => {
    if (NXDataStore.get(migrationCheck, 'false') === 'false') {
      migrations.forEach((value) => {
        migrateSetting(value[0], value[1]);
      });
      NXDataStore.set(migrationCheck, 'true');
    }
  });
}
