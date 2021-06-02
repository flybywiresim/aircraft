import { NXDataStore } from '@shared/persistence';
import { setSimVar } from '../../util.js';

type SettingSync = { simVar: [name: string, type: string], propertyName: string }

function syncSetting(simVarName, simVarUnit, propertyName) {
    const propertyValue = NXDataStore.get<string>(propertyName);

    try {
        setSimVar(simVarName, Number.parseInt(propertyValue), 'number');
    } catch (_) {
        console.error(`Could not sync simvar '${simVarName}' because it was not of type number`);
    }
}

/**
 * This contains a list of NXDataStore settings that must be synced to simvars on plane load
 */
const settingsToSync: SettingSync[] = [
    {
        simVar: ['L:A32NX_SOUND_PTU_AUDIBLE_COCKPIT', 'Bool'],
        propertyName: 'SOUND_PTU_AUDIBLE_COCKPIT',
    },
    {
        simVar: ['L:A32NX_SOUND_EXTERIOR_MASTER', 'number'],
        propertyName: 'SOUND_EXTERIOR_MASTER',
    },
    {
        simVar: ['L:A32NX_SOUND_INTERIOR_ENGINE', 'number'],
        propertyName: 'SOUND_INTERIOR_ENGINE',
    },
    {
        simVar: ['L:A32NX_SOUND_INTERIOR_WIND', 'number'],
        propertyName: 'SOUND_INTERIOR_WIND',
    },
    {
        simVar: ['L:A32NX_REFUEL_RATE_SETTING', 'number'],
        propertyName: 'REFUEL_RATE_SETTING',
    },
    {
        simVar: ['L:A32NX_CONFIG_USING_METRIC_UNIT', 'number'],
        propertyName: 'CONFIG_USING_METRIC_UNIT',
    },
    {
        simVar: ['L:A32NX_EFB_BRIGHTNESS', 'number'],
        propertyName: 'EFB_BRIGHTNESS',
    },
];

export function readSettingsFromPersistentStorage() {
    settingsToSync.forEach((setting) => syncSetting(setting.simVar[0], setting.simVar[1], setting.propertyName));
}
