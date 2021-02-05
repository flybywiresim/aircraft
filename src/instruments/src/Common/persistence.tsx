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

import { useEffect, useState } from "react";
import { useSimVar } from "./simVars";

declare function GetStoredData(property: string, defaultValue?: string);
declare function SetStoredData(property: string, newValue: string);

export class NXDataStore {
    static get(key: string, defaultVal?: string) {
        const val = GetStoredData(`A32NX_${key}`);
        if (!val) {
            return defaultVal;
        }
        return val;
    }

    static set(key: string, val: string) {
        SetStoredData(`A32NX_${key}`, val);
    }
}

export const usePersistentProperty = (propertyName: string): [string, (string) => void] => {
    const [propertyValue, rawPropertySetter] = useState(() => NXDataStore.get(propertyName));

    const propertySetter = (value: string) => {
        NXDataStore.set(propertyName, value);
        rawPropertySetter(value);
    };

    return [propertyValue, propertySetter];
};

type SimVarSyncedPersistentPropertyType = <T>(simVarName: string, simVarUnit: string, propertyName: string) => [T, (T) => void];

export const useSimVarSyncedPersistentProperty: SimVarSyncedPersistentPropertyType = (simVarName, simVarUnit, propertyName) => {
    const [, setPropertyValue] = usePersistentProperty(propertyName);
    const [simVarValue, setSimVarValue] = useSimVar(simVarName, simVarUnit, 1_000);

    useEffect(() => {
        setPropertyValue(simVarValue);
    }, [simVarValue]);

    const setter = (value: string) => {
        setSimVarValue(value);
    };

    return [simVarValue, setter];
};
