import { useCallback, useEffect, useRef, useState } from 'react';
import { useInteractionEvents, useUpdate } from './hooks';

type SimVarSetter = <T extends SimVarValue>(oldValue: T) => T;

type UnitName = SimVar.SimVarUnit;
type SimVarValue = number | any;

/**
 * taken from the AAU1 G3000
 * The purpose is to reduce the amount of allocations
 * by reducing the amount of allocations caused by the default function
 */
const latlonaltRegEx = new RegExp(/latlonalt/i);
const latlonaltpbhRegex = new RegExp(/latlonaltpbh/i);
const pbhRegex = new RegExp(/pbh/i);
const pidStructRegex = new RegExp(/pid_struct/i);
const xyzRegex = new RegExp(/xyz/i);
const stringRegex = new RegExp(/string/i);
const boolRegex = new RegExp(/boolean|bool/i);
const numberRegex = new RegExp(/number/i);
const defaultSource = '';
SimVar.GetSimVarValue = (name, unit, dataSource = defaultSource) => {
    try {
        // @ts-ignore
        if (simvar) {
            let output;
            const registeredID = SimVar.GetRegisteredId(name, unit, dataSource);

            if (registeredID >= 0) {
                console.log('hi ID');

                if (numberRegex.test(unit)) {
                    // @ts-ignore
                    output = simvar.getValueReg(registeredID);
                } else if (stringRegex.test(unit)) {
                    // @ts-ignore
                    output = simvar.getValueReg_String(registeredID);
                } else if (latlonaltRegEx.test(unit)) {
                    // @ts-ignore
                    output = new LatLongAlt(simvar.getValue_LatLongAlt(name, dataSource));
                } else if (latlonaltpbhRegex.test(unit)) {
                    // @ts-ignore
                    output = new LatLongAltPBH(simvar.getValue_LatLongAltPBH(name, dataSource));
                } else if (pbhRegex.test(unit)) {
                    // @ts-ignore
                    output = new PitchBankHeading(simvar.getValue_PBH(name, dataSource));
                } else if (pidStructRegex.test(unit)) {
                    // @ts-ignore
                    output = new PID_STRUCT(simvar.getValue_PID_STRUCT(name, dataSource));
                } else if (xyzRegex.test(unit)) {
                    // @ts-ignore
                    output = new XYZ(simvar.getValue_XYZ(name, dataSource));
                } else {
                    // @ts-ignore
                    output = simvar.getValueReg(registeredID);
                }
            }
            return output;
        }

        console.warn(`SimVar handler is not defined (${name})`);
    } catch (error) {
        console.warn('ERROR ', error, ` GetSimVarValue ${name} unit : ${unit}`);
        return null;
    }
    return null;
};
SimVar.SetSimVarValue = (name, unit, value, dataSource = defaultSource) => {
    if (value === undefined) {
        console.warn(`${name} : Trying to set a null value`);
        return Promise.resolve();
    }
    try {
        // @ts-ignore
        if (simvar) {
            const regID = SimVar.GetRegisteredId(name, unit, dataSource);
            if (regID >= 0) {
                if (stringRegex.test(unit)) {
                    return Coherent.call('setValueReg_String', regID, value);
                }
                if (boolRegex.test(unit)) {
                    return Coherent.call('setValueReg_Bool', regID, !!value);
                }
                if (numberRegex.test(unit)) {
                    return Coherent.call('setValueReg_Number', regID, value);
                }
                if (latlonaltRegEx.test(unit)) {
                    return Coherent.call('setValue_LatLongAlt', name, value, dataSource);
                }
                if (latlonaltpbhRegex.test(unit)) {
                    return Coherent.call('setValue_LatLongAltPBH', name, value, dataSource);
                }
                if (pbhRegex.test(unit)) {
                    return Coherent.call('setValue_PBH', name, value, dataSource);
                }
                if (pidStructRegex.test(unit)) {
                    return Coherent.call('setValue_PID_STRUCT', name, value, dataSource);
                }
                if (xyzRegex.test(unit)) {
                    return Coherent.call('setValue_XYZ', name, value, dataSource);
                }

                return Coherent.call('setValueReg_Number', regID, value);
            }
        } else {
            console.warn('SimVar handler is not defined');
        }
    } catch (error) {
        console.warn(`error SetSimVarValue ${error}`);
    }
    return Promise.resolve();
};

/**
 * The useSimVar hook provides an easy way to read and write SimVars from React.
 *
 * It's signature is similar to useState and it regularly refreshes the SimVar
 * to ensure your React component stays in sync with the SimVar being modified
 * from outside your component (like from other components, XML or SimConnect).
 *
 * You may optionally specify the refresh interval. If the same SimVar
 * is used in multiple places, this hook will automatically deduplicate those
 * for maximum performance, rather than fetching the SimVar multiple times.
 * Setting the SimVar will instantly cause it to be updated in all other places
 * within the same React tree.
 *
 * @param name The name of the SimVar.
 * @param unit The unit of the SimVar.
 * @param refreshInterval The time in milliseconds that needs to elapse before
 * the next render will cause a SimVar refresh from the simulator.
 *
 * @example
 * // the return value is the value itself and a setter, similar to useState
 * const [v1, setV1] = useSimVar('L:AIRLINER_V1_SPEED', 'Knots');
 *
 * @example
 * // only refresh the SimVar every 500ms
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
    refreshInterval = 0,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter
) => void] => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [stateValue, setStateValue] = useState(() => SimVar.GetSimVarValue(name, unit));

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();

            const newValue = SimVar.GetSimVarValue(name, unit);

            setStateValue(newValue);
        }
    }, [name, unit, refreshInterval]);

    useUpdate(updateCallback);

    const setter = useCallback((valueOrSetter: any | SimVarSetter) => {
        const executedValue = typeof valueOrSetter === 'function' ? valueOrSetter(stateValue) : valueOrSetter;

        SimVar.SetSimVarValue(name, unit, executedValue);

        setStateValue(executedValue);

        return stateValue;
    }, [name, unit, stateValue]);

    return [stateValue, setter];
};

/**
 * The useGlobalVar hook provides an easy way to read and write GlobalVars from
 * React. The signature is similar to useSimVar, except for the return being a
 * single value as it is non-writeable.
 *
 * @param name The name of the GlobalVar.
 * @param unit The unit of the GlobalVar.
 * @param refreshInterval The time in milliseconds that needs to elapse before
 * the next render will cause a SimVar refresh from the simulator.
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
    refreshInterval = 0,
): SimVarValue => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [stateValue, setStateValue] = useState(() => SimVar.GetGlobalVarValue(name, unit));

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();

            const newValue = SimVar.GetGlobalVarValue(name, unit);

            setStateValue(newValue);
        }
    }, [name, unit, refreshInterval]);

    useUpdate(updateCallback);

    return stateValue;
};

/**
 * The useGameVar hook provides an easy way to read and write GameVars from
 * React. The signature is similar to useSimVar, except for the return being a
 * single value as it is non-writeable.
 *
 * @param name The name of the useGameVar.
 * @param unit The unit of the useGameVar.
 * @param refreshInterval The time in milliseconds that needs to elapse before
 * the next render will cause a SimVar refresh from the simulator.
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
    refreshInterval = 0,
): SimVarValue => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [stateValue, setStateValue] = useState(() => SimVar.GetGameVarValue(name, unit));

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();

            const newValue = SimVar.GetGameVarValue(name, unit);

            setStateValue(newValue);
        }
    }, [name, unit, refreshInterval]);

    useUpdate(updateCallback);

    return stateValue;
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
 * @param refreshInterval The time in milliseconds that needs to elapse before
 * the next render will cause a SimVar refresh from the simulator.
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
    refreshInterval = 500,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter
) => void] => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [stateValue, setStateValue] = useState(() => SimVar.GetSimVarValue(name, unit));

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();

            const newValue = SimVar.GetSimVarValue(name, unit);

            setStateValue(newValue);
        }
    }, [name, unit, refreshInterval]);

    useUpdate(updateCallback);

    useInteractionEvents(
        Array.isArray(interactionEvents) ? interactionEvents : [interactionEvents],
        () => setStateValue(SimVar.GetSimVarValue(name, unit)), // force an update
    );

    const setter = useCallback((valueOrSetter: any | SimVarSetter) => {
        const executedValue = typeof valueOrSetter === 'function' ? valueOrSetter(stateValue) : valueOrSetter;

        SimVar.SetSimVarValue(name, unit, executedValue);

        setStateValue(executedValue);

        return stateValue;
    }, [name, unit]);

    return [stateValue, setter];
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
 * @param refreshInterval The time in milliseconds that needs to elapse before
 * the next render will cause a SimVar refresh from the simulator.
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
    refreshInterval = 0,
): [SimVarValue, (newValueOrSetter: SimVarValue | SimVarSetter
) => void] => {
    const [readValue] = useSimVar(readName, readUnit, refreshInterval);
    const [, writeSetter] = useSimVar(writeName, writeUnit || readUnit);

    const [stateValue, setStateValue] = useState(readValue);

    useEffect(() => {
        setStateValue(readValue);
    }, [readValue]);

    const setter = useCallback((valueOrSetter: any | SimVarSetter) => {
        const executedValue = typeof valueOrSetter === 'function' ? valueOrSetter(stateValue) : valueOrSetter;

        writeSetter(executedValue);
        setStateValue(executedValue);
    }, [stateValue, writeName]);

    return [stateValue, setter];
};
