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

import { useEffect, useState } from 'react';
import { useSimVar } from './simVars';

declare function GetStoredData(property: string, defaultValue?: string);
declare function SetStoredData(property: string, newValue: string);

/**
 * Allows interacting with the persistent storage
 */
export class NXDataStore {
    /**
     * Reads a value from persistent storage
     *
     * @param key The property key
     * @param defaultVal The default value if the property is not set
     */
    static get(key: string, defaultVal?: string) {
        if (process.env.SIMVAR_DISABLE) {
            const val = window.localStorage.getItem(`A32NX_${key}`);
            if (!val) {
                return defaultVal;
            }
            return val;
        }

        const val = GetStoredData(`A32NX_${key}`);
        if (!val) {
            return defaultVal;
        }
        return val;
    }

    /**
     * Sets a value in persistent storage
     *
     * @param key The property key
     * @param val The value to assign to the property
     */
    static set(key: string, val: string) {
        if (process.env.SIMVAR_DISABLE) {
            window.localStorage.setItem(`A32NX_${key}`, val);
            return;
        }

        SetStoredData(`A32NX_${key}`, val);
    }
}

/**
 * This hook allows to read and set a persistent storage property.
 *
 * Note: The value of the persistent property does not automatically refresh for now
 */
export const usePersistentProperty = (propertyName: string): [string, (string) => void] => {
    const [propertyValue, rawPropertySetter] = useState(() => NXDataStore.get(propertyName));

    const propertySetter = (value: string) => {
        NXDataStore.set(propertyName, value);
        rawPropertySetter(value);
    };

    return [propertyValue, propertySetter];
};

type SimVarSyncedPersistentPropertyType = (simVarName: string, simVarUnit: string, propertyName: string) => [number, (value: number) => void];

/**
 * This hook allows to set the value of a persistent storage property from the value of a simvar, and sync in an unidirectional fashion
 *
 * Note: The value of the persistent property does not automatically refresh for now
 */
export const useSimVarSyncedPersistentProperty: SimVarSyncedPersistentPropertyType = (simVarName, simVarUnit, propertyName) => {
    const [, setPropertyValue] = usePersistentProperty(propertyName);
    const [simVarValue, setSimVarValue] = useSimVar(simVarName, simVarUnit, 1_000);

    useEffect(() => {
        if (simVarValue) {
            setPropertyValue((simVarValue as number).toString());
        }
    }, [simVarValue]);

    const setter = (value: number) => {
        setSimVarValue(value);
    };

    return [simVarValue, setter];
};
