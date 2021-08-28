import { useEffect, useState } from 'react';
import { NXDataStore, StorageValue, StorageContents } from '@shared/persistence';

/**
 * This hook allows to read and set a persistent storage property.
 *
 * Note: The value of the persistent property does not automatically refresh for now
 */
export const usePersistentProperty = <T extends StorageValue>(propertyName: string, defaultValue?: StorageContents<T>): [StorageContents<T>, (value: StorageContents<T>) => void] => {
    const [propertyValue, rawPropertySetter] = useState(() => NXDataStore.get<T>(propertyName, defaultValue));

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
