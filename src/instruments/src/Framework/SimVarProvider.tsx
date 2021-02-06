import * as React from 'react';
import { customElement } from '../util.js';
import { useEffect, useState } from "react"

declare const SimVar;

export const normalizeUnitName = (unit: UnitName): UnitName => {
    switch(unit) {
        case "bool":
        case "Bool":
        case "boolean":
        case "Boolean":
            return "bool";
        case "number":
        case "Number":
           return "number";
        case "Degrees":
        case "degree":
            return "degree";
        case "Percent":
        case "percent":
            return "percent";
        case "Feet":
        case "feet":
        case "feets":
        case "Feets":
            return "feet";
        case "Knots":
        case "knots":
            return "knots";
        default:
           return unit;
    }
}

type SimVarSetter = <T extends SimVarValue>(oldValue: T) => T;

type RetrieveSimVar = (name: string, unit: UnitName) => SimVarValue;
type UpdateSimVar = (name: string, unit: UnitName, newValueOrSetter: SimVarValue | SimVarSetter) => void;
type RegisterSimVar = (name: string, unit: UnitName, maxStaleness: number) => void;
type UnregisterSimVar = (name: string, unit: UnitName, maxStaleness: number) => void;

const errorCallback = () => {
    throw Error('useSimVar was called in a React tree with no SimVarProvider');
};
const context = React.createContext<{
    retrieve: RetrieveSimVar,
    update: UpdateSimVar,
    register: RegisterSimVar,
    unregister: UnregisterSimVar,
}>({
    retrieve: errorCallback,
    update: errorCallback,
    register: errorCallback,
    unregister: errorCallback,
});
const {Provider: InternalProvider}  = context;

type UnitName = string | any;
type SimVarValue = number;
type SimVarCache = Record<string, {
    value: SimVarValue,
    lastUpdatedAgo: number,
}>;

/**
 * This component provides the basic functionality for the useSimVar hooks.
 * By keeping the last known SimVar values inside this provider, we're
 * effectively caching each SimVar, so that there is no additional overhead when
 * using multiple useSimVar hooks for the same SimVar.
 * For improved performance, this component will only trigger renders when the
 * "update" custom event is emitted through an instrument.
 */
const SimVarProvider: React.FC = ({ children }) => {
    const listeners = React.useRef<Record<string, number[]>>({});
    const [cache, setCache] = useState<SimVarCache>({});

    useEffect(() => {

        /**
         * At this point the instrument has determined that an update is required.
         * Now we check all SimVars, and investigate if any need to be updated.
         * @param event
         */
        const onUpdateEvent = (event: CustomEvent) => {
            const stateUpdates: Record<string, {
                value?: SimVarValue,
                lastUpdatedAgo: number,
            }> = {};
            const deltaTime = event.detail;

            for (const [key, intervals] of Object.entries(listeners.current)) {
                // First, let's check if there are any listeners at all
                if (!intervals.length) {
                    continue;
                }

                // The refresh time is given by the *smallest* maximum update
                // interval.
                const threshold = Math.min(...intervals);
                const lastUpdatedAgo = (cache[key].lastUpdatedAgo || 0) + deltaTime;

                if (lastUpdatedAgo >= threshold) {
                    // At this point, as we haven't updated this SimVar recently, we
                    // need to fetch the latest value from the simulator and store
                    // it.
                    const [name, rawUnit] = key.split('/');
                    const unit = normalizeUnitName(rawUnit as UnitName);
                    stateUpdates[key] = {
                        value: SimVar.GetSimVarValue(name, unit),
                        lastUpdatedAgo: lastUpdatedAgo % threshold,
                    };
                } else {
                    // Otherwise, just increment lastUpdatedAgo.
                    stateUpdates[key] = { lastUpdatedAgo };
                }
            }

            setCache((oldCache) => {
                const newCache: SimVarCache = {};
                for (const [key, update] of Object.entries(stateUpdates)) {
                    newCache[key] = {...oldCache[key], ...update};
                }
                return {...oldCache, ...newCache};
            });
        }

        customElement.addEventListener('update', onUpdateEvent);
        return () => {
            customElement.removeEventListener('update', onUpdateEvent);
        };
    });

    const getKey = (name: string, unit: UnitName) => {
        return `${name}/${normalizeUnitName(unit)}`;
    }

    const retrieve: RetrieveSimVar = (name, unit) => {
        const key = getKey(name, unit);
        if (cache[key]) {
            return cache[key].value;
        }

        const value = SimVar.GetSimVarValue(name, unit);
        setCache((oldCache) => ({
            ...oldCache,
            [key]: {
                value,
                lastUpdatedAgo: 0,
            },
        }));
        return value;
    }

    /**
     * This function will be called by the useSimVar hook through the context
     * and updates the appropriate SimVar for the specific unit with the
     * supplied value.
     * @param name The SimVar to update.
     * @param unit The unit of the SimVar to update.
     * @param value {*|(function(*): *)} Either the new value for the
     * SimVar, or an update function that takes the old value and returns an
     * updated value.
     */
    const update: UpdateSimVar = (name, unit, value) => {
        const key = getKey(name, unit);
        setCache((oldCache) => {
            const newValue = typeof value === 'function' ? value(oldCache[key].value) : value;
            SimVar.SetSimVarValue(name, unit, newValue);
            return {
                ...oldCache,
                [key]: {
                    value: newValue,
                    lastUpdatedAgo: 0,
                },
            };
        });
    };

    /**
     * This function will be called by the useSimVar hook through the context
     * and ensures the SimVar with the supplied name and unit will be updated
     * every maxStaleness.
     */
    const register: RegisterSimVar = (name, unit, maxStaleness) => {
        const key = getKey(name, unit);
        if (!listeners.current[key]) {
            listeners.current[key] = [];
        }
        listeners.current[key].push(maxStaleness || 0);
    }

    /**
     * This function will be called by the useSimVar hook through the context
     * and notifies us that there is one listener less for this specific SimVar
     * and unit combination.
     */
    const unregister: UnregisterSimVar = (name: string, unit: UnitName, maxStaleness: number): void => {
        const key = getKey(name, unit);
        const old = listeners.current[key];
        if (!Array.isArray(old) || old.length === 0) {
            throw new Error('Attempted to unregisterHook with no known listener');
        }
        if (old.length === 1) {
            // if we're unregistering the last entry, delete the array...
            delete listeners.current[key];
        } else {
            // ...otherwise, filter out the first occurence of this value
            const index = listeners.current[key].indexOf(maxStaleness || 0);
            listeners.current[key] = listeners.current[key].splice(index, 1);
        }
    }

    return (
        <InternalProvider value={{
            retrieve,
            update,
            register,
            unregister,
        }}
        >
            { children }
        </InternalProvider>
    );
}

export const useSimVarValue = (name: string, unit: UnitName, maxStaleness: number): SimVarValue => {
    const contextValue = React.useContext(context);

    React.useEffect(() => {
        // This part of useEffect will be called whenever either:
        // - the component has just mounted, or
        // - one the parameters below (name, unit, maxStaleness) has changed.
        // In these cases, we want to register our current parameters with the
        // SimVarProvider that we access through the context.
        contextValue.register(name, unit, maxStaleness);
        return () => {
            // This part of useEffect will be called whenever either:
            // - one of the parameters below (name, unit, maxStaleness) is about
            //   to change, or
            // - the component is about to unmount
            // In these cases, we want to unregister our current parameters from
            // the SimVar provider, that we again access through the context.
            contextValue.unregister(name, unit, maxStaleness);
        };
    }, [name, unit, maxStaleness]);

    return contextValue.retrieve(name, unit);
};

export const useSimVarSetter = (
    name: string,
    unit: UnitName
): ((newValueOrSetter: SimVarValue | SimVarSetter) => void) => {
    const contextValue = React.useContext(context);
    return (value) => contextValue.update(name, unit, value);
};

/**
 * The useSimVar hook provides an easy way to read and write SimVars from React.
 *
 * It's signature is similar to useState and it regularly refreshes the SimVar
 * to ensure your React component stays in sync with the SimVar being modified
 * from outside your component (like from other components, XML or SimConnect).
 *
 * You may optionally specify the maximum refresh interval. If the same SimVar
 * is used in multiple places, this hook will automatically deduplicate those
 * for maximum performance, rather than fetching the SimVar multiple times.
 * Setting the SimVar will instantly cause it to be updated in all other places
 * within the same React tree.
 *
 * @param name The name of the SimVar.
 * @param unit The unit of the SimVar.
 * @param maxStaleness The maximum time in milliseconds that may elapse before
 * the next render will cause a SimVar refresh from the simulator. This
 * parameter is only an upper bound! If another hook requests the same SimVar
 * with a lower maxStaleness, this hook will also benefit from that and refresh
 * the value more often.
 *
 * @example
 * // the return value is the value itself and a setter, similar to useSate
 * const [v1, setV1] = useSimVar('L:AIRLINER_V1_SPEED', 'Knots', 500);
 *
 * @example
 * // only refresh the SimVar every 500ms
 * const [lightsTest] = useSimVar('L:XMLVAR_LTS_Test', 'Bool', 1000);
 *
 * @returns {[*, (function(*): void)]}
 */
export const useSimVar = (
    name: string,
    unit: UnitName,
    maxStaleness: number,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter) => void] => {
    const value = useSimVarValue(name, unit, maxStaleness);
    const setter = useSimVarSetter(name, unit);
    return [value, setter];
}

export const useSplitSimVar = (
    readName: string,
    readUnit: UnitName,
    writeName: string,
    writeUnit: UnitName,
    maxStaleness: number
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter) => void] => {
    const value = useSimVarValue(readName, readUnit, maxStaleness);
    const setter = useSimVarSetter(writeName, writeUnit);
    return [value, setter];
};

export default SimVarProvider;
