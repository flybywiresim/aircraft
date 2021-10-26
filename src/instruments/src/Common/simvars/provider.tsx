//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import React, { useCallback, FC, useState, createContext, useContext, useMemo } from 'react';
import { throttle } from 'lodash';
import { useUpdate } from '../hooks';
import { getSimVarKey } from './helpers';
import { SimVarInstance } from './instance';
import { SimVarType, SimVarValue } from './types';
import { SimVarUnit } from './units';

export type SimVarContextType = {
    subscribe: (name: string, unit: SimVarUnit, type: SimVarType, onUpdated:(value: SimVarValue) => void, maxStaleness?: number) => string;
    unsubscribe: (name: string, unit: SimVarUnit, type: SimVarType, subscriptionId: string) => void;
    getValue: (name: string, unit: SimVarUnit, type: SimVarType, force?: boolean) => SimVarValue;
    setValue: (name: string, unit: SimVarUnit, type: SimVarType, value: SimVarValue, proxy?: string) => void;
}

const SimVarContext = createContext<SimVarContextType>(undefined!);

export type SimVarProviderProps = {
    maxUpdateFrequency?: number;
}

export const SimVarProvider: FC<SimVarProviderProps> = ({ maxUpdateFrequency = 30, children }) => {
    const [instances, setInstances] = useState<Record<string, SimVarInstance>>({});

    const updateInstances = useMemo(() => throttle(() => {
        for (const [, instance] of Object.entries(instances)) {
            if (!instance.maxStaleness || (Date.now() - instance.lastUpdated >= instance.maxStaleness) || !instance.lastUpdated) {
                instance.updateValue();
            }
        }
    }, 1000 / maxUpdateFrequency), [instances]);

    useUpdate(() => {
        updateInstances();
    });

    const subscribe = useCallback((name: string, unit: SimVarUnit, type: SimVarType, onUpdated:(value: SimVarValue) => void, maxStaleness?: number): string => {
        const key = getSimVarKey(type, name, unit);
        return instances[key].subscribe(onUpdated, maxStaleness);
    }, [instances]);

    const unsubscribe = useCallback((name: string, unit: SimVarUnit, type: SimVarType, subscriptionId: string): void => {
        const key = getSimVarKey(type, name, unit);

        const instance = instances[key];

        if (instance) {
            instance.unsubscribe(subscriptionId);
            if (!instance.hasSubscribers()) {
                setInstances((oldInstances) => {
                    delete oldInstances[key];
                    return oldInstances;
                });
            }
        }
    }, [instances, setInstances]);

    const getValue = useCallback((name: string, unit: SimVarUnit, type: SimVarType, force?: boolean): SimVarValue => {
        const key = getSimVarKey(type, name, unit);

        if (!instances[key]) {
            instances[key] = new SimVarInstance(name, unit, type);
        }

        if (force) {
            instances[key].updateValue();
        }

        return instances[key].getValue();
    }, [instances]);

    const setValue = useCallback((name: string, unit: SimVarUnit, type: SimVarType, value: SimVarValue, proxy?: string): void => {
        const key = getSimVarKey(type, name, unit);

        if (instances[key]) {
            instances[key].setValue(value, proxy);
        }
    }, [instances]);

    return (
        <SimVarContext.Provider value={{ getValue, setValue, subscribe, unsubscribe }}>
            { children }
        </SimVarContext.Provider>
    );
};

export const useSimVarContext = (): SimVarContextType => {
    const context = useContext(SimVarContext);
    if (!context) {
        throw new Error('useSimVarContext must be used within a SimVarProvider');
    }
    return context;
};
