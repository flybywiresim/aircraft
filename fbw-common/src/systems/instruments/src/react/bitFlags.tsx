import { useCallback, useMemo, useRef, useState } from 'react';
import { SeatFlags } from '../../../shared/src';
import { useSimVarList } from './simVars';
import { useUpdate } from './hooks';

export const useSeatFlags = (
    name: string,
    totalSeats: number,
    refreshInterval: number = 200,
): [
    SeatFlags,
    (
        setter: SeatFlags
    ) => void
] => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [stateValue, setStateValue] = useState<number>(() => SimVar.GetSimVarValue(name, 'number'));
    const [seatFlags, setSeatFlags] = useState<SeatFlags>(() => new SeatFlags(stateValue, totalSeats));

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();

            const newValue = SimVar.GetSimVarValue(name, 'number');

            if (newValue !== stateValue) {
                setStateValue(newValue);
                // TODO: Refactor to recycle object instead of generating new object
                // setter(new SeatFlags(newValue, totalSeats));
                setSeatFlags(new SeatFlags(newValue, totalSeats));
            }
        }
    }, [name, refreshInterval, totalSeats, stateValue]);

    useUpdate(updateCallback);

    const setter = useCallback((value: SeatFlags) => {
        lastUpdate.current = Date.now();
        // Note: as of SU XI 1.29.30.0 - Beyond (2^24) The BehaviourDebug window will incorrectly show this as its real value + 1.
        // console.log(`[SetSimVarValue] ${name} => ${value.toString()}`);
        SimVar.SetSimVarValue(name, 'string', value.toString()).catch(console.error);
        setStateValue(value.toNumber());
        setSeatFlags(new SeatFlags(value.toNumber(), totalSeats));
    }, [name, totalSeats]);

    return [
        seatFlags,
        setter,
    ];
};

export const useSeatMap = (
    Loadsheet: any,
) : [
        SeatFlags[],
        SeatFlags[],
        (
            setter: SeatFlags,
            index: number
        ) => void,
        (
            setter: SeatFlags,
            index: number
        ) => void,
    ] => {
    const [
        desiredVarNames, desiredVarUnits,
        activeVarNames, activeVarUnits,
    ] = useMemo(() => {
        const desiredNames: string[] = [];
        const desiredUnits: string[] = [];
        const activeNames: string[] = [];
        const activeUnits: string[] = [];
        Loadsheet.seatMap.forEach((station) => {
            desiredNames.push(`L:${station.bitFlags}_DESIRED`);
            desiredUnits.push('number');
            activeNames.push(`L:${station.bitFlags}`);
            activeUnits.push('number');
        });
        return [desiredNames, desiredUnits, activeNames, activeUnits];
    }, [Loadsheet]);

    const [desiredBitVars] = useSimVarList(desiredVarNames, desiredVarUnits);
    const [activeBitVars] = useSimVarList(activeVarNames, activeVarUnits);

    const setActiveFlags = useCallback((value: SeatFlags, index: number) => {
        SimVar.SetSimVarValue(`L:${Loadsheet.seatMap[index].bitFlags}`, 'string', value.toString()).catch(console.error).then();
    }, [Loadsheet]);

    const setDesiredFlags = useCallback((value: SeatFlags, index: number) => {
        SimVar.SetSimVarValue(`L:${Loadsheet.seatMap[index].bitFlags}_DESIRED`, 'string', value.toString()).catch(console.error).then();
    }, [Loadsheet]);

    const desiredFlags = useMemo(() => {
        const flags: SeatFlags[] = [];
        Loadsheet.seatMap.forEach((station, index) => {
            let stationSize = 0;
            station.rows.forEach((row) => {
                row.seats.forEach(() => {
                    stationSize++;
                });
            });
            flags[index] = new SeatFlags(desiredBitVars[index], stationSize);
        });
        return flags;
    }, [desiredBitVars, ...desiredBitVars]);

    const activeFlags = useMemo(() => {
        const flags: SeatFlags[] = [];
        Loadsheet.seatMap.forEach((station, index) => {
            let stationSize = 0;
            station.rows.forEach((row) => {
                row.seats.forEach(() => {
                    stationSize++;
                });
            });
            flags[index] = new SeatFlags(activeBitVars[index], stationSize);
        });
        return flags;
    }, [activeBitVars, ...activeBitVars]);

    return [
        desiredFlags,
        activeFlags,
        setDesiredFlags,
        setActiveFlags,
    ];
};
