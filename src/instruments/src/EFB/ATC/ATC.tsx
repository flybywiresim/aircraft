import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import * as apiClient from '@flybywiresim/api-client';
import { IconBuildingLighthouse, IconChartRadar, IconCircleCheck, IconPlaneArrival, IconPlaneDeparture, IconTrafficLights } from '@tabler/icons';
import { useSimVar, useSplitSimVar } from '../../Common/simVars';
import './ATC.scss';
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

    useEffect(() => {
        loadAtc();
        setInterval(() => loadAtc(), 2 * 60 * 1000);
    }, []);

    useEffect(() => {
        setAtc();
    }, [frequency]);

    useEffect(() => {
        loadAtc();
    }, [atisSource]);

    const loadAtc = () => {
        apiClient.ATC.getAtc((atisSource as string).toLowerCase()).then((res) => {
            let allAtc : ATCInfoExtended[] = res as ATCInfoExtended[];
            for (const a of allAtc) {
                a.distance = getDistanceFromLatLonInNm(a.latitude, a.longitude, currentLatitude, currentLongitude);
            }
            allAtc = allAtc.slice(0, 26);
            allAtc.push({ callsign: 'UNICOM', frequency: '122.800', type: apiClient.AtcType.radar, visualRange: 999999, distance: 0, latitude: 0, longitude: 0, textAtis: [] });
            allAtc.sort((a1, a2) => (a1.distance > a2.distance ? 1 : -1));
            setControllers(allAtc.filter((a) => a.distance <= a.visualRange
                && a.callsign.indexOf('_OBS') === -1
                && parseFloat(a.frequency) <= 136.975));
            if (frequency) {
                const converted = fromFrequency(frequency);
                const ctl = allAtc.find((c) => c.frequency === converted);
                setCurrentAtc(ctl);
            }
        });
    };

    const setAtc = () => {
        const converted = fromFrequency(frequency);
        setCurrentFrequency(converted);
        const c = controllers?.find((c) => c.frequency === converted);
        setCurrentAtc(c);
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

    return (
        <div className="flex p-6 w-full">
            { (atisSource === 'IVAO' || atisSource === 'VATSIM') && (
                <div className="w-8/12">
                    <h1 className="text-white font-medium mb-4 text-2xl">
                        {atisSource}
                        {' - '}
                        Controllers currently in range
                    </h1>
                    <div className="bg-gray-800 rounded-xl p-2 text-white shadow-lg">
                        <div className="flex p-2 w-full atc-buttons">
                            { controllers && controllers.map((atc) => (
                                <Button
                                    className={classNames({ 'atc-button': true, 'active': atc.frequency === currentFrequency })}
                                    id="atc.callsign"
                                    onClick={() => setFrequency(toFrequency(atc.frequency))}
                                >
                                    <div className="button-content">
                                        <div className="left">
                                            { atc.type === apiClient.AtcType.radar && <IconChartRadar size="2rem" /> }
                                            { atc.type === apiClient.AtcType.ground && <IconTrafficLights size="2rem" /> }
                                            { atc.type === apiClient.AtcType.departure && <IconPlaneDeparture size="2rem" /> }
                                            { atc.type === apiClient.AtcType.approach && <IconPlaneArrival size="2rem" /> }
                                            { atc.type === apiClient.AtcType.tower && <IconBuildingLighthouse size="2rem" /> }
                                            { atc.type === apiClient.AtcType.delivery && <IconCircleCheck size="2rem" /> }
                                        </div>
                                        <div className="right">
                                            <div>
                                                {atc.callsign}
                                            </div>
                                            <div className="freq">
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
                <div className="w-12/12">
                    <h1 className="text-white font-medium mb-4 text-2xl">
                        Only available when 'IVAO' or 'VATSIM' is selected as ATIS/ATC source in the settings page
                    </h1>
                </div>
            )}

            { (atisSource === 'IVAO' || atisSource === 'VATSIM') && (
                <div className="w-4/12 ml-4">
                    <h1 className="text-white font-medium mb-4 text-2xl">Active frequency</h1>
                    <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg">
                        <div>
                            <div className="active-frequency">
                                <div className="mr-4">
                                    {currentFrequency && currentFrequency.toString()}
                                </div>
                                <div>
                                    {currentAtc && currentAtc.callsign}
                                </div>
                            </div>
                            <div className="active-atis">
                                { currentAtc?.textAtis && currentAtc.textAtis.map((line) => (
                                    <p>{line}</p>
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
