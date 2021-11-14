import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useInteractionEvents, useUpdate } from './hooks';

/**
 * If the same SimVar or GlobalVar is requested in multiple places with
 * equivalent units, we normalize them to a common name to deduplicate the
 * entries in the cache.
 */
const normalizeUnitName = (unit: UnitName): UnitName => {
    switch (unit) {
    case 'bool':
    case 'Bool':
    case 'boolean':
    case 'Boolean':
        return 'bool';
    case 'number':
    case 'Number':
        return 'number';
    case 'Degrees':
    case 'degree':
        return 'degree';
    case 'Percent':
    case 'percent':
        return 'percent';
    case 'Feet':
    case 'feet':
    case 'feets':
    case 'Feets':
        return 'feet';
    case 'Knots':
    case 'knots':
        return 'knots';
    default:
        return unit;
    }
};

type SimVarSetter = <T extends SimVarValue>(oldValue: T) => T;

type RetrieveSimVar = (name: string, unit: UnitName, force?: boolean, varType?: number) => SimVarValue;
type UpdateSimVar = (name: string, unit: UnitName, newValueOrSetter: SimVarValue | SimVarSetter, proxy?: string) => void;
type RegisterSimVar = (name: string, unit: UnitName, maxStaleness: number, varType: number) => void;
type UnregisterSimVar = (name: string, unit: UnitName, maxStaleness: number, varType: number) => void;

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
const { Provider: InternalProvider } = context;

type UnitName = string | any; // once typings is next to tsconfig.json, use those units
type SimVarValue = number | any;
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
    const listeners = useRef<Record<string, number[]>>({});
    const [cache, setCache] = useState<SimVarCache>({});

    useUpdate((deltaTime: number) => {
        const stateUpdates: Record<string, {
            value?: SimVarValue,
            lastUpdatedAgo: number,
        }> = {};

        for (const [key, intervals] of Object.entries(listeners.current)) {
            // First, let's check if there are any listeners at all
            if (!intervals.length) {
                continue;
            }

            // The refresh time is given by the *smallest* maximum update
            // interval.
            const threshold = Math.min(...intervals);
            const lastUpdatedAgo = (cache[key] ? cache[key].lastUpdatedAgo || 0 : 0) + deltaTime;

            if (lastUpdatedAgo >= threshold) {
                // At this point, as we haven't updated this SimVar recently, we
                // need to fetch the latest value from the simulator and store
                // it.
                const [name, rawUnit] = key.split('/');
                const unit = normalizeUnitName(rawUnit as UnitName);
                let value;
                if (name.startsWith('_GLOBAL_')) {
                    value = SimVar.GetGlobalVarValue(name.substr(8), unit);
                } else if (name.startsWith('_GAME_')) {
                    value = SimVar.GetGameVarValue(name.substr(6), unit);
                } else {
                    value = SimVar.GetSimVarValue(name, unit);
                }
                stateUpdates[key] = {
                    value,
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
                newCache[key] = { ...oldCache[key], ...update };
            }
            return { ...oldCache, ...newCache };
        });
    });

    const getKey = (name: string, unit: UnitName, varType: number) => {
        switch (varType) {
        default:
            return `${name}/${normalizeUnitName(unit)}`;
        case 1:
            return `_GLOBAL_${name}/${normalizeUnitName(unit)}`;
        case 2:
            return `_GAME_${name}/${normalizeUnitName(unit)}`;
        }
    };

    /**
     * This function will be called by the SimVar hooks through the context and
     * retrieves the appropriate SimVar value from the cache if it exists, and
     * retrieve it from the simulator otherwise.
     * @param name The SimVar to update.
     * @param unit The unit of the SimVar to update.
     * @param force Whether to always bypass the cache and always retrieve it
     * from the simulator.
     */
    const retrieve: RetrieveSimVar = (name, unit, force, varType) => {
        const key = getKey(name, unit, varType || 0);
        if (cache[key] && !force) {
            return cache[key].value;
        }
        let value;
        switch (varType) {
        default:
            value = SimVar.GetSimVarValue(name, unit);
            break;
        case 1:
            value = SimVar.GetGlobalVarValue(name, unit);
            break;
        case 2:
            value = SimVar.GetGameVarValue(name, unit);
            break;
        }
        setCache((oldCache) => ({
            ...oldCache,
            [key]: {
                value,
                lastUpdatedAgo: 0,
            },
        }));
        return value;
    };

    /**
     * This function will be called by the SimVar hooks through the context and
     * updates the appropriate SimVar for the specific unit with the supplied
     * value.
     * @param name The SimVar to update.
     * @param unit The unit of the SimVar to update.
     * @param value {*|(function(*): *)} Either the new value for the
     * SimVar, or an update function that takes the old value and returns an
     * updated value.
     * @param proxy If the SimVar used to set the SimVar is different from the
     * SimVar used to retrieve it, set this parameter to the SimVar for the set
     * operation.
     */
    const update: UpdateSimVar = (name, unit, value, proxy) => {
        const key = getKey(name, unit, 0);
        setCache((oldCache) => {
            const newValue = typeof value === 'function' ? value(oldCache[key].value) : value;
            SimVar.SetSimVarValue((proxy || name), unit, newValue);
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
    const register: RegisterSimVar = (name, unit, maxStaleness, varType) => {
        const key = getKey(name, unit, varType);
        if (!listeners.current[key]) {
            listeners.current[key] = [];
        }
        listeners.current[key].push(maxStaleness || 0);
    };

    /**
     * This function will be called by the useSimVar hook through the context
     * and notifies us that there is one listener less for this specific SimVar
     * and unit combination.
     */
    const unregister: UnregisterSimVar = (name, unit, maxStaleness, varType): void => {
        const key = getKey(name, unit, varType);
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
            // splice removes in-place, so an assignment would be wrong here as the return value is the removed element
            listeners.current[key].splice(index, 1);
        }
    };

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
 * // the return value is the value itself and a setter, similar to useState
 * const [v1, setV1] = useSimVar('L:AIRLINER_V1_SPEED', 'Knots');
 *
 * @example
 * // only refresh the SimVar every 500ms (unless this SimVar is lower elsewhere)
 * const [lightsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Bool', 500);
 *
 * @returns {[*, (function(*): void)]}
 *
 * @see {@link useSplitSimVar} if your SimVar is set through a K event
 * @see {@link useInteractionSimVar} if you emit an H event whenever your SimVar changes
 * @see {@link useGlobalVar} if you have a Global Var instead
 */
export const useSimVar = (
    name: string,
    unit: UnitName,
    maxStaleness = 0,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter
) => void] => {
    const value = useSimVarValue(name, unit, maxStaleness);
    const setter = useSimVarSetter(name, unit);

    return [value, setter];
};

/**
 * The useGlobalVar hook provides an easy way to read and write GlobalVars from
 * React. The signature is similar to useSimVar, except for the return being a
 * single value as it is non-writeable.
 *
 * @param name The name of the GlobalVar.
 * @param unit The unit of the GlobalVar.
 * @param maxStaleness The maximum time in milliseconds that may elapse before
 * the next render will cause a GlobalVar refresh from the simulator. This
 * parameter is only an upper bound! If another hook requests the same GlobalVar
 * with a lower maxStaleness, this hook will also benefit from that and refresh
 * the value more often.
 *
 * @example
 * // only refresh the GlobalVar every 100ms (unless this GlobalVar is lower elsewhere)
 * const time = useGlobalVar('ZULU TIME', 'seconds', 100);
 *
 * @returns {[*, (function(*): void)]}
 *
 * @see {@link useSimVar} if you're trying to access a SimVar instead
 */
export const useGlobalVar = (
    name: string,
    unit: UnitName,
    maxStaleness = 0,
): SimVarValue => {
    const contextValue = useContext(context);

    useEffect(() => {
        // This part of useEffect will be called whenever either:
        // - the component has just mounted, or
        // - one the parameters below (name, unit, maxStaleness) has changed.
        // In these cases, we want to register our current parameters with the
        // SimVarProvider that we access through the context.
        contextValue.register(name, unit, maxStaleness, 1);
        return () => {
            // This part of useEffect will be called whenever either:
            // - one of the parameters below (name, unit, maxStaleness) is about
            //   to change, or
            // - the component is about to unmount
            // In these cases, we want to unregister our current parameters from
            // the SimVar provider, that we again access through the context.
            contextValue.unregister(name, unit, maxStaleness, 1);
        };
    }, [contextValue, name, unit, maxStaleness]);

    return contextValue.retrieve(name, unit, false, 1);
};

/**
 * The useGameVar hook provides an easy way to read and write GameVars from
 * React. The signature is similar to useSimVar, except for the return being a
 * single value as it is non-writeable.
 *
 * @param name The name of the useGameVar.
 * @param unit The unit of the useGameVar.
 * @param maxStaleness The maximum time in milliseconds that may elapse before
 * the next render will cause a useGameVar refresh from the simulator. This
 * parameter is only an upper bound! If another hook requests the same useGameVar
 * with a lower maxStaleness, this hook will also benefit from that and refresh
 * the value more often.
 *
 * @example
 * // only refresh the useGameVar every 200ms (unless this useGameVar is lower elsewhere)
 * const time = useGameVar('CAMERA POS IN PLANE', 'xyz', 200);
 *
 * @returns {[*, (function(*): void)]}
 *
 * @see {@link useSimVar} if you're trying to access a SimVar instead
 */
export const useGameVar = (
    name: string,
    unit: UnitName,
    maxStaleness = 0,
): SimVarValue => {
    const contextValue = useContext(context);

    useEffect(() => {
        // This part of useEffect will be called whenever either:
        // - the component has just mounted, or
        // - one the parameters below (name, unit, maxStaleness) has changed.
        // In these cases, we want to register our current parameters with the
        // SimVarProvider that we access through the context.
        contextValue.register(name, unit, maxStaleness, 2);
        return () => {
            // This part of useEffect will be called whenever either:
            // - one of the parameters below (name, unit, maxStaleness) is about
            //   to change, or
            // - the component is about to unmount
            // In these cases, we want to unregister our current parameters from
            // the SimVar provider, that we again access through the context.
            contextValue.unregister(name, unit, maxStaleness, 2);
        };
    }, [contextValue, name, unit, maxStaleness]);

    return contextValue.retrieve(name, unit, false, 2);
};

/**
 * The useInteractionSimVar hook is an optimized version of the useSimVar hook
 * when we can guarantee that an interaction event (H event) is emitted whenever
 * the SimVar has changed. This can be helpful when the SimVar is set by
 * physical button and not a system.
 *
 * By relying on an H event we need to poll the variable much less frequently,
 * as we're guaranteed to be notified of any changes. To handle the SimVar
 * change itself through some external means, like third-party plugin or cockpit
 * hardware, the SimVar is still refreshed occasionally, but much less
 * frequently than with useSimVar.
 *
 * @param name The name of the SimVar.
 * @param unit The unit of the SimVar.
 * @param interactionEvents The name of the interaction events that signals a
 * change to the SimVar.
 * @param maxStaleness The maximum time in milliseconds that may elapse before
 * the next render will cause a SimVar refresh from the simulator. This
 * parameter is only an upper bound.
 *
 * @example
 * // the XML updates the SimVar and emits an H event, so we can use the optimized version
 * const [toggleSwitch, setToggleSwitch] = useInteractionSimVar(
 *   'L:A32NX_RMP_LEFT_TOGGLE_SWITCH',
 *   'bool',
 *   'H:A32NX_RMP_LEFT_TOGGLE_SWITCH'
 * );
 *
 * @returns {[*, (function(*): void)]}
 *
 * @see useSimVar if you do not have an H event indicating this SimVar has changed
 */
export const useInteractionSimVar = (
    name: string,
    unit: UnitName,
    interactionEvents: string | string[],
    maxStaleness = 500,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter
) => void] => {
    const contextValue = useContext(context);
    const value = useSimVarValue(name, unit, maxStaleness);

    useInteractionEvents(
        Array.isArray(interactionEvents) ? interactionEvents : [interactionEvents],
        () => contextValue.retrieve(name, unit, true), // force an update
    );

    const setter = useSimVarSetter(name, unit);
    return [value, setter];
};

/**
 * The useSplitSimVar hook is a special version of the userSimVar hook that is
 * appropriate for some special SimVars where sets need to happen using a
 * K event.
 *
 * @param readName The name of the SimVar to read from.
 * @param readUnit The unit of the SimVar to read from.
 * @param writeName The name of the SimVar to write to.
 * @param writeUnit The unit of the SimVar to write to.
 * @param maxStaleness The maximum time in milliseconds that may elapse before
 * the next render will cause a SimVar refresh from the simulator. This
 * parameter is only an upper bound.
 *
 * @example
 * // read the SimVar 'COM STANDBY FREQUENCY:2', and set it through 'K:COM_2_RADIO_SET_HZ'
 * const [frequencyTwo, setFrequencyTwo] = useSplitSimVar(
 *   'COM STANDBY FREQUENCY:2', 'Hz',
 *   'K:COM_2_RADIO_SET_HZ', 'Hz'
 * );
 *
 * @returns {[*, (function(*): void)]}
 *
 * @see useSimVar if you're reading and writing from the same SimVar
 */
export const useSplitSimVar = (
    readName: string,
    readUnit: UnitName,
    writeName: string,
    writeUnit?: UnitName,
    maxStaleness = 0,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter
) => void] => {
    const value = useSimVarValue(readName, readUnit, maxStaleness);
    const setter = useSimVarSetter(readName, writeUnit || readUnit, writeName);

    return [value, setter];
};

/**
 * This is an internal hook that exposes the internal value for a SimVar only.
 * You will usually want to useSimVar instead. Don't use this unless you know
 * what you're doing and writing your own hook.
 */
export const useSimVarValue = (name: string, unit: UnitName, maxStaleness: number): SimVarValue => {
    const contextValue = useContext(context);

    useEffect(() => {
        // This part of useEffect will be called whenever either:
        // - the component has just mounted, or
        // - one the parameters below (name, unit, maxStaleness) has changed.
        // In these cases, we want to register our current parameters with the
        // SimVarProvider that we access through the context.
        contextValue.register(name, unit, maxStaleness, 0);
        return () => {
            // This part of useEffect will be called whenever either:
            // - one of the parameters below (name, unit, maxStaleness) is about
            //   to change, or
            // - the component is about to unmount
            // In these cases, we want to unregister our current parameters from
            // the SimVar provider, that we again access through the context.
            contextValue.unregister(name, unit, maxStaleness, 0);
        };
    }, [contextValue, name, unit, maxStaleness]);

    return contextValue.retrieve(name, unit);
};

/**
 * This is an internal hook that exposes the internal setter for a SimVar only.
 * You will usually want to useSimVar instead. Don't use this unless you know
 * what you're doing and writing your own hook.
 */
export const useSimVarSetter = (
    name: string,
    unit: UnitName,
    proxy?: string,
): ((newValueOrSetter: SimVarValue | SimVarSetter) => void
) => {
    const contextValue = useContext(context);
    return (value) => contextValue.update(name, unit, value, proxy);
};

export { SimVarProvider };
