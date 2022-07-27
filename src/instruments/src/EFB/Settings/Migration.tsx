import { NXDataStore } from '@shared/persistence';

type SimVar = [name: string, defaultValue: string]

const migrateSetting = (oldSimvar: Simvar, newSimvar: string) => {
    NXDataStore.set(newSimvar, NXDataStore.get(oldSimvar[0], oldSimvar[1]));
};

const settingsToMigrate: Map<SimVar, string> = new Map([
    [['CONFIG_EXTERNAL_MCDU_PORT', '8380'], 'CONFIG_SIMBRIDGE_PORT'],
    [['CONFIG_EXTERNAL_MCDU_SERVER_ENABLED', 'AUTO ON'], 'CONFIG_SIMBRIDGE_ENABLED'],
]);

export function migrateSettings() {
    settingsToMigrate.forEach((newSimvar, oldSimvar) => migrateSetting(oldSimvar, newSimvar));
}
