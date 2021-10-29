import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import * as apiClient from '@flybywiresim/api-client';
import { IconBuildingLighthouse, IconChartRadar, IconCircleCheck, IconPlaneArrival, IconPlaneDeparture, IconRadio, IconTrafficLights } from '@tabler/icons';
import { useInterval } from '@flybywiresim/react-components';
import { useSimVar, useSplitSimVar } from '../../Common/simVars';
import Button from '../Components/Button/Button';
import { usePersistentProperty } from '../../Common/persistence';

export declare class ATCInfoExtended extends apiClient.ATCInfo {
    distance: number;
}

export const ATC = () => {
    const [controllers, setControllers] = useState<ATCInfoExtended[]>();
    const [frequency, setFrequency] = useSplitSimVar('COM ACTIVE FREQUENCY:1', 'Hz', 'K:COM_RADIO_SET_HZ', 'Hz', 500);
    const [currentFrequency, setCurrentFrequency] = useState<string>();
    const [currentAtc, setCurrentAtc] = useState<ATCInfoExtended>();
    const [currentLatitude] = useSimVar('GPS POSITION LAT', 'Degrees', 5000);
    const [currentLongitude] = useSimVar('GPS POSITION LON', 'Degrees', 5000);
    const [atisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');

    const loadAtc = useCallback(() => {
        apiClient.ATC.getAtc((atisSource as string).toLowerCase()).then((res) => {
            let allAtc : ATCInfoExtended[] = res as ATCInfoExtended[];
            allAtc = allAtc.filter((a) => a.callsign.indexOf('_OBS') === -1 && parseFloat(a.frequency) <= 136.975);
            for (const a of allAtc) {
                a.distance = getDistanceFromLatLonInNm(a.latitude, a.longitude, currentLatitude, currentLongitude);
                if (a.visualRange === 0 && a.type === apiClient.AtcType.ATIS) {
                    a.visualRange = 100;
                }
            }
            allAtc.sort((a1, a2) => (a1.distance > a2.distance ? 1 : -1));
            allAtc = allAtc.slice(0, 26);
            allAtc.push({ callsign: 'UNICOM', frequency: '122.800', type: apiClient.AtcType.RADAR, visualRange: 999999, distance: 0, latitude: 0, longitude: 0, textAtis: [] });
            setControllers(allAtc.filter((a) => a.distance <= a.visualRange));
        });
    }, [currentLatitude, currentLongitude, atisSource]);

    const setAtc = () => {
        const converted = fromFrequency(frequency);
        setCurrentFrequency(converted);
        setCurrentAtc(controllers?.find((c) => c.frequency === converted));
    };

    const getDistanceFromLatLonInNm = (lat1, lon1, lat2, lon2) : number => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1); // deg2rad below
        const dLon = deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2))
          * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c * 0.5399568; // Distance in nm
        return d;
    };

    const deg2rad = (deg) => deg * (Math.PI / 180);

    const toFrequency = (frequency:string) : number => {
        if (frequency) {
            return parseFloat(`${frequency.replace('.', '').padEnd(9, '0')}.000`);
        }
        return 0;
    };

    const fromFrequency = (frequency:number) : string => {
        if (frequency) {
            let converted : string = frequency.toString().replace('.', '');
            converted = `${converted.substring(0, 3)}.${converted.substring(3)}`;
            return parseFloat(converted).toFixed(3);
        }
        return '';
    };

    useEffect(() => {
        loadAtc();
    }, [loadAtc]);

    useEffect(() => {
        setAtc();
    }, [frequency]);

    useEffect(() => {
        if (frequency) {
            setCurrentAtc(controllers?.find((c) => c.frequency === fromFrequency(frequency)));
        }
    }, [controllers, frequency]);

    useInterval(() => {
        loadAtc();
    }, 60 * 1000);

    return (
        <div className="flex p-6 w-full">
            { (atisSource === 'IVAO' || atisSource === 'VATSIM') && (
                <div className="w-8/12">
                    <h1 className="text-white font-medium mb-4 text-2xl">
                        {atisSource}
                        {' - '}
                        Controllers currently in range
                    </h1>
                    <div className="p-2 text-theme-text">
                        <div className="flex p-2 w-full flex-wrap justify-between">
                            { controllers && controllers.map((atc) => (
                                <Button
                                    className={classNames({ 'w-60 m-1 flex': true, 'text-yellow-200': atc.frequency === currentFrequency })}
                                    id="atc.callsign"
                                    onClick={() => setFrequency(toFrequency(atc.frequency))}
                                >
                                    <div className="flex w-full justify-start text-lg">
                                        <div>
                                            { atc.type === apiClient.AtcType.RADAR && <IconChartRadar size="2rem" /> }
                                            { atc.type === apiClient.AtcType.GROUND && <IconTrafficLights size="2rem" /> }
                                            { atc.type === apiClient.AtcType.DEPARTURE && <IconPlaneDeparture size="2rem" /> }
                                            { atc.type === apiClient.AtcType.APPROACH && <IconPlaneArrival size="2rem" /> }
                                            { atc.type === apiClient.AtcType.TOWER && <IconBuildingLighthouse size="2rem" /> }
                                            { atc.type === apiClient.AtcType.DELIVERY && <IconCircleCheck size="2rem" /> }
                                            { atc.type === apiClient.AtcType.ATIS && <IconRadio size="2rem" /> }
                                        </div>
                                        <div className="flex flex-col flex-grow text-center justify-center items-center">
                                            <div>
                                                {atc.callsign}
                                            </div>
                                            <div>
                                                {atc.frequency}
                                            </div>
                                        </div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            { (atisSource !== 'IVAO' && atisSource !== 'VATSIM') && (
                <div className="w-full">
                    <h1 className="text-white font-medium mb-4 text-2xl">
                        Only available when 'IVAO' or 'VATSIM' is selected as ATIS/ATC source in the settings page
                    </h1>
                </div>
            )}

            { (atisSource === 'IVAO' || atisSource === 'VATSIM') && (
                <div className="w-4/12 ml-4">
                    <h1 className="text-white font-medium mb-4 text-2xl">Active frequency</h1>
                    <div className="bg-gray-800 rounded-xl p-6 text-white">
                        <div>
                            <div className="flex text-2xl text-yellow-200">
                                <div className="mr-4">
                                    {currentFrequency && currentFrequency.toString()}
                                </div>
                                <div>
                                    {currentAtc && currentAtc.callsign}
                                </div>
                            </div>
                            <div className="active-atis flex-wrap mt-8 text-2xl">
                                { currentAtc?.textAtis && currentAtc.textAtis.map((line) => (
                                    <p className="flex text-base flex-wrap mt-2">{line}</p>
                                )) }
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default ATC;
