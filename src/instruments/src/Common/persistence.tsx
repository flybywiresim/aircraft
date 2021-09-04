import { useEffect, useState } from 'react';
import { NXDataStore, StorageValue, StorageContents } from '@shared/persistence';
import { useSimVar } from './simVars';

/**
 * This hook allows to read and set a persistent storage property.
 *
 * Note: The value of the persistent property does not automatically refresh for now
 */
export const usePersistentProperty = <T extends StorageValue>(propertyName: string, defaultValue?: StorageContents<T>): [StorageContents<T>, (value: StorageContents<T>) => void] => {
    const [propertyValue, rawPropertySetter] = useState(() => NXDataStore.get(propertyName, defaultValue));

    if (defaultValue !== undefined && propertyValue === undefined) {
        rawPropertySetter(defaultValue);
    }

    useEffect(() => {
        const unsubscribe = NXDataStore.subscribe<T>(propertyName, (key, value) => rawPropertySetter(value));
        return () => {
            unsubscribe();
        };
    }, []);

    const propertySetter = (value: StorageContents<T>) => {
        NXDataStore.set<T>(propertyName, value);
        rawPropertySetter(value);
    };

    return [propertyValue, propertySetter];
};

export const usePersistentPropertyWithDefault = <T extends StorageValue>(propertyName: string, defaultValue: StorageContents<T>): [StorageContents<T>, (value: StorageContents<T>) => void] => {
    const [propertyValue, rawPropertySetter] = useState(() => NXDataStore.get<T>(propertyName, defaultValue));

    useEffect(() => {
        const unsubscribe = NXDataStore.subscribe<T>(propertyName, (key, value) => rawPropertySetter(value));
        return () => {
            unsubscribe();
        };
    }, []);

    const propertySetter = (value: StorageContents<T>) => {
        NXDataStore.set<T>(propertyName, value);
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
        if (simVarValue || simVarValue === 0) {
            setPropertyValue((simVarValue as number).toString());
        }
    }, [simVarValue]);

    const setter = (value: number) => {
        setSimVarValue(value);
    };

    return [simVarValue, setter];
};
