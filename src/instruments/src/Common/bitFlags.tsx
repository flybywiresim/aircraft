import { BitFlags } from '@shared/bitFlags';
import { useCallback } from 'react';
import { useSimVar } from './simVars';

type BitFlagsSetter = <T extends BitFlags>(oldValue: T) => T;

export const useBitFlagsVar = (
    name: string,
    maxStaleness = 0,
): [BitFlags, (setter: BitFlags
) => void] => {
    const [stateValue, setValue] = useSimVar(name, 'number', maxStaleness);

    const setter = useCallback((valueOrSetter: BitFlags | BitFlagsSetter) => {
        const executedValue: BitFlags = typeof valueOrSetter === 'function' ? valueOrSetter(stateValue) : valueOrSetter.toDouble();
        setValue(executedValue);
    }, [name, stateValue]);

    return [new BitFlags(stateValue), setter];
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
export const useBitFlagsVar2 = (
    name: string,
    refreshInterval = 0,
): [BitFlags, (newValueOrSetter: BitFlags | BitFlagsSetter
) => void] => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [stateValue, setStateValue] = useState(() => new BitFlags(SimVar.GetSimVarValue(name, 'number')));

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();

            const newValue = new BitFlags(SimVar.GetSimVarValue(name, 'number'));

            setStateValue(newValue);
        }
    }, [name, refreshInterval]);

    useUpdate(updateCallback);

    const setter = useCallback((valueOrSetter: any | BitFlagsSetter) => {
        const executedValue: BitFlags = typeof valueOrSetter === 'function' ? valueOrSetter(stateValue) : valueOrSetter;

        console.log('setting simvar ', name);

        SimVar.SetSimVarValue(name, 'number', executedValue.toDouble());

        setStateValue(executedValue);

        return stateValue;
    }, [name, stateValue]);

    return [stateValue, setter];
};
