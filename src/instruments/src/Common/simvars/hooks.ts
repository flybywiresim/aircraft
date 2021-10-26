//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { useCallback, useEffect, useState } from 'react';
import { useInteractionEvents } from '../hooks';
import { usePersistentProperty } from '../persistence';
import { useSimVarContext } from './provider';
import { SimVarSetter, SimVarType, SimVarValue } from './types';
import { SimVarUnit } from './units';

export const useVariableValue = (name: string, unit: SimVarUnit, type: SimVarType, maxStaleness?: number, interactionEvents?: string | string[]): SimVarValue => {
    const { getValue, subscribe, unsubscribe } = useSimVarContext();
    const [value, setValue] = useState<SimVarValue>(getValue(name, unit, type));

    if (interactionEvents) {
        useInteractionEvents(
            Array.isArray(interactionEvents) ? interactionEvents : [interactionEvents],
            () => getValue(name, unit, SimVarType.Sim, true), // force an update
        );
    }

    useEffect(() => {
        const subscriptionId = subscribe(name, unit, type, (value) => {
            setValue(value);
        }, maxStaleness);
        return () => {
            if (subscriptionId) {
                unsubscribe(name, unit, type, subscriptionId);
            }
        };
    }, [name, unit, type, maxStaleness]);

    return value;
};

const useVariableSetter = (name: string, unit: SimVarUnit, type: SimVarType, proxy?: string): (value: SimVarValue) => void => {
    const { setValue } = useSimVarContext();
    return useCallback((value: SimVarValue) => setValue(name, unit, type, value, proxy), [name, unit, proxy, setValue]);
};

const useVariable = (name: string, unit: SimVarUnit, type: SimVarType, maxStaleness?: number, proxy?: string): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter) => void] => {
    const value = useVariableValue(name, unit, type, maxStaleness);
    const setter = useVariableSetter(name, unit, type, proxy);
    return [value, setter];
};

export const useGameVar = (name: string, unit: SimVarUnit, maxStaleness?: number):
[SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter) => void] => useVariable(name, unit, SimVarType.Game, maxStaleness);

export const useGlobalVar = (name: string, unit: SimVarUnit, maxStaleness?: number):
[SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter) => void] => useVariable(name, unit, SimVarType.Global, maxStaleness);

export const useSimVar = (name: string, unit: SimVarUnit, maxStaleness?: number):
[SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter) => void] => useVariable(name, unit, SimVarType.Sim, maxStaleness);

export const useInteractionSimVar = (
    name: string,
    unit: SimVarUnit,
    interactionEvents: string | string[],
    maxStaleness = 500,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter
) => void] => {
    const value = useVariableValue(name, unit, SimVarType.Sim, maxStaleness, interactionEvents);
    const setter = useVariableSetter(name, unit, SimVarType.Sim);
    return [value, setter];
};

export const useSplitSimVar = (
    readName: string,
    readUnit: SimVarUnit,
    writeName: string,
    writeUnit?: SimVarUnit,
    maxStaleness = 0,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter
) => void] => {
    if (process.env.SIMVAR_DISABLE) {
        return [0, () => {}];
    }

    const value = useVariableValue(readName, readUnit, SimVarType.Sim, maxStaleness);
    const setter = useVariableSetter(readName, writeUnit || readUnit, SimVarType.Sim, writeName);
    return [value, setter];
};

export const useSimVarSyncedPersistentProperty = (simVarName: string, simVarUnit: SimVarUnit, propertyName: string) => {
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
