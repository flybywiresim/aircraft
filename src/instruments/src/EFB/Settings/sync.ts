/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NXDataStore } from '../../Common/persistence';
import { setSimVar } from '../../util.js';

type SettingSync = { simVar: [name: string, type: string], propertyName: string }

function syncSetting(simVarName, simVarUnit, propertyName) {
    const propertyValue = NXDataStore.get(propertyName);

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
];

export function readSettingsFromPersistentStorage() {
    settingsToSync.forEach((setting) => syncSetting(setting.simVar[0], setting.simVar[1], setting.propertyName));
}
