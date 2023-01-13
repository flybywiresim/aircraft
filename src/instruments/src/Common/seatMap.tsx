import { useUpdate } from '@instruments/common/hooks';
import { SimVarSetter, SimVarValue } from '@instruments/common/simVars';
import { BitFlags } from '@shared/bitFlags';
import { CargoStationInfo, PaxStationInfo } from '@shared/seatMap';
import { useCallback, useRef, useState } from 'react';

const getLocalFloat = (propertyName: string) => {
    const value: string | null = localStorage.getItem(propertyName);
    if (value) {
        return parseFloat(value);
    }
    return 0;
};

export const useSeats = (
    seatMap: PaxStationInfo[],
    refreshInterval = 0,
): [
    SimVarValue,
    SimVarValue,
    (newValueOrSetter: SimVarValue | SimVarSetter, index: number) => void,
    BitFlags[],
    BitFlags[],
    (newValueOrSetter: SimVarValue | SimVarSetter, index: number) => void,
    (newValueOrSetter: SimVarValue | SimVarSetter, index: number
) => void
] => {
    const lastUpdate = useRef(Date.now() - refreshInterval - 1);

    const [currentSeated, setCurrentSeated] = useState<number[]>(() => {
        const stations: number[] = [];
        seatMap.forEach((station: PaxStationInfo) => {
            const stationSeated = SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number');
            stations.push(stationSeated);
        });
        return stations;
    });

    const [desiredSeated, setDesiredSeated] = useState<number[]>(() => {
        const stations: number[] = [];
        seatMap.forEach((station: PaxStationInfo) => {
            const stationValue = SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, 'Number');
            stations.push(stationValue);
        });
        return stations;
    });

    const [currentFlags, setCurrentFlags] = useState<BitFlags[]>(() => {
        const stations: BitFlags[] = [];
        seatMap.forEach((station: PaxStationInfo) => {
            const stationFlag = new BitFlags(getLocalFloat(station.bitFlags));
            stations.push(stationFlag);
        });
        return stations;
    });

    const [desiredFlags, setDesiredFlags] = useState<BitFlags[]>(() => {
        const stations: BitFlags[] = [];
        seatMap.forEach((station: PaxStationInfo) => {
            const stationFlag = new BitFlags(getLocalFloat(`${station.bitFlags}_DESIRED`));
            stations.push(stationFlag);
        });
        return stations;
    });

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= refreshInterval) {
            lastUpdate.current = Date.now();
            seatMap.forEach((station: PaxStationInfo, index: number) => {
                const stationCurrentSeated = SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number');
                const stationDesiredSeated = SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, 'Number');
                const stationCurrentFloat = getLocalFloat(station.bitFlags);
                const stationDesiredFloat = getLocalFloat(`${station.bitFlags}_DESIRED`);
                currentSeated[index] = stationCurrentSeated;
                desiredSeated[index] = stationDesiredSeated;
                if (currentFlags[index].toDouble() !== stationCurrentFloat) {
                    currentFlags[index] = new BitFlags(stationCurrentFloat);
                    setCurrentFlags(currentFlags);
                    setCurrentSeated(currentSeated);
                }
                if (desiredFlags[index].toDouble() !== stationDesiredFloat) {
                    desiredFlags[index] = new BitFlags(stationDesiredFloat);
                    setDesiredFlags(desiredFlags);
                    setDesiredSeated(desiredSeated);
                }
            });
        }
    }, [seatMap, refreshInterval]);

    const setter = useCallback((valueOrSetter: any | SimVarSetter, index: number) => {
        const executedValue = typeof valueOrSetter === 'function' ? valueOrSetter(desiredSeated) : valueOrSetter;

        SimVar.SetSimVarValue(`L:${seatMap[index].simVar}_DESIRED`, 'Number', executedValue);
        desiredSeated[index] = executedValue;

        setDesiredSeated(desiredSeated);

        return desiredSeated;
    }, [seatMap, desiredSeated]);

    const setCurrent = useCallback((value: BitFlags, index: number) => {
        localStorage.setItem(seatMap[index].bitFlags, value.toDouble().toString());
        currentFlags[index] = value;

        setCurrentFlags(currentFlags);

        return currentFlags;
    }, [seatMap, currentFlags]);

    const setDesired = useCallback((value: BitFlags, index: number) => {
        localStorage.setItem(`${seatMap[index].bitFlags}_DESIRED`, value.toDouble().toString());
        desiredFlags[index] = value;

        setDesiredFlags(desiredFlags);

        return desiredFlags;
    }, [seatMap, desiredFlags]);

    useUpdate(updateCallback);

    return [currentSeated, desiredSeated, setter, currentFlags, desiredFlags, setCurrent, setDesired];
};

export const useCargo = (
    cargoMap: CargoStationInfo[],
): [
    SimVarValue,
    SimVarValue,
    (newValueOrSetter: SimVarValue | SimVarSetter, index: number
) => void,
] => {
    const lastUpdate = useRef(Date.now() - 1);

    const [currentLoaded, setCurrentLoaded] = useState<number[]>(() => {
        const stations: number[] = [];
        cargoMap.forEach((station: CargoStationInfo) => {
            const stationSeated = SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number');
            stations.push(stationSeated);
        });
        return stations;
    });

    const [desiredLoaded, setDesiredLoaded] = useState<number[]>(() => {
        const stations: number[] = [];
        cargoMap.forEach((station: CargoStationInfo) => {
            const stationValue = SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, 'Number');
            stations.push(stationValue);
        });
        return stations;
    });

    const updateCallback = useCallback(() => {
        const delta = Date.now() - lastUpdate.current;

        if (delta >= 0) {
            lastUpdate.current = Date.now();
            cargoMap.forEach((station: CargoStationInfo, index: number) => {
                const stationCurrentLoaded = SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number');
                const stationDesiredLoaded = SimVar.GetSimVarValue(`L:${station.simVar}_DESIRED`, 'Number');
                currentLoaded[index] = stationCurrentLoaded;
                desiredLoaded[index] = stationDesiredLoaded;
            });

            setCurrentLoaded(currentLoaded);
            setDesiredLoaded(desiredLoaded);
        }
    }, [cargoMap]);

    useUpdate(updateCallback);

    const setter = useCallback((valueOrSetter: any | SimVarSetter, index: number) => {
        const executedValue = typeof valueOrSetter === 'function' ? valueOrSetter(desiredLoaded) : valueOrSetter;

        SimVar.SetSimVarValue(`L:${cargoMap[index].simVar}_DESIRED`, 'Number', executedValue);
        desiredLoaded[index] = executedValue;

        setDesiredLoaded(desiredLoaded);

        return desiredLoaded;
    }, [cargoMap, desiredLoaded]);

    return [currentLoaded, desiredLoaded, setter];
};
