/* eslint-disable function-paren-newline */
import { useUpdate } from '@instruments/common/hooks';
import { BitFlags, SeatFlags } from '@shared/bitFlags';
import { useCallback, useRef, useState } from 'react';

export const useBitFlags = (
    name: string,
    refreshInterval: number = 200,
): [
    BitFlags,
    (setter: BitFlags) => void
] => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [stateValue, setStateValue] = useState<number>(() => SimVar.GetSimVarValue(`L:${name}`, 'number'));

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();

            const newValue = SimVar.GetSimVarValue(`L:${name}`, 'number');
            if (newValue !== stateValue) {
                setStateValue(newValue);
                setter(new BitFlags(newValue));
            }
        }
    }, [name, stateValue, refreshInterval]);

    useUpdate(updateCallback);

    const setter = useCallback((value: BitFlags) => {
        SimVar.SetSimVarValue(`L:${name}`, 'string', value.toString()).catch(console.error).then();
        setStateValue(value.toNumber());
    }, [name, stateValue]);

    return [new BitFlags(stateValue), setter];
};

export const useSeatFlags = (
    name: string,
    totalSeats: number,
    refreshInterval: number = 200,
): [
    SeatFlags,
    (setter: SeatFlags) => void
] => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [stateValue, setStateValue] = useState<number>(() => SimVar.GetSimVarValue(name, 'number'));
    // const [seatFlags] = useState<SeatFlags>(() => new SeatFlags(stateValue, totalSeats));

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();

            const newValue = SimVar.GetSimVarValue(name, 'number');
            if (newValue !== stateValue) {
                setStateValue(newValue);
                // TODO: Refactor to recycle object instead of generating new object
                setter(new SeatFlags(newValue, totalSeats));
            }
        }
    }, [name, stateValue, refreshInterval]);

    useUpdate(updateCallback);

    const setter = useCallback((value: SeatFlags) => {
        lastUpdate.current = Date.now();
        // Note: as of SU XI 1.29.30.0 - Beyond (2^24) The BehaviourDebug window will incorrectly show this as its real value + 1.
        // console.log(`[SetSimVarValue] ${name} => ${value.toString()}`);
        SimVar.SetSimVarValue(name, 'string', value.toString()).catch(console.error).then();
        setStateValue(value.toNumber());
        // seatFlags.setFlags(value.toNumber());
    }, [name, stateValue]);

    return [
        // TODO: Refactor to recycle object instead of generating new object
        new SeatFlags(stateValue, totalSeats),
        setter,
    ];
};
