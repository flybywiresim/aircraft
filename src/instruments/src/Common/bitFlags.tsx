import { useLocalStorage } from '@instruments/common/persistence';
import { BitFlags } from '@shared/bitFlags';
import { useCallback, useState } from 'react';

type BitFlagsSetter = <T extends number>(oldValue: T) => T;

export const useBitFlags = (
    name: string,
): [BitFlags, (setter: BitFlags
) => void] => {
    const [storage, setStorage] = useLocalStorage(name, '');
    const [stateValue, setValue] = useState(storage ? JSON.parse(storage) : 0);

    const setter = useCallback((valueOrSetter: BitFlags | BitFlagsSetter) => {
        const executedValue: number = typeof valueOrSetter === 'function' ? valueOrSetter(stateValue) : valueOrSetter.toDouble();
        setValue(executedValue);
        setStorage(JSON.stringify(executedValue));
    }, [name, stateValue]);

    return [new BitFlags(stateValue), setter];
};
