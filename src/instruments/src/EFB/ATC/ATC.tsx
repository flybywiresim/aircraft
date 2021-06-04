import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import * as apiClient from '@flybywiresim/api-client';
import { IconBuildingLighthouse, IconChartRadar, IconCircleCheck, IconInfoCircle, IconPlaneArrival, IconPlaneDeparture, IconTrafficLights } from '@tabler/icons';
import { useSimVar, useSplitSimVar } from '../../Common/simVars';
import Button from '../Components/Button/Button';
import { usePersistentProperty } from '../../Common/persistence';
import { SelectGroup, SelectItem } from '../Components/Form/Select';
import { FmgcFlightPhases } from '../../Common/flightPhase';
import { SimbriefData } from '../Efb';

export declare class ATCInfoExtended extends apiClient.ATCInfo {
    distance: number;
}

type ATCProps = {
    simbriefData: SimbriefData,
    fetchSimbrief: Function,
}

export const ATC = (props: ATCProps) => {
    const [controllers, setControllers] = useState<ATCInfoExtended[]>();
    const [messages, setMessages] = useState<string[]>();
    const [controllersToDisplay, setControllersToDisplay] = useState<ATCInfoExtended[]>();
    const [frequency, setFrequency] = useSplitSimVar('COM ACTIVE FREQUENCY:1', 'Hz', 'K:COM_RADIO_SET_HZ', 'Hz', 500);
    const [currentFrequency, setCurrentFrequency] = useState<string>();
    const [currentAtc, setCurrentAtc] = useState<ATCInfoExtended>();
    const [currentLatitude] = useSimVar('GPS POSITION LAT', 'Degrees', 5000);
    const [currentLongitude] = useSimVar('GPS POSITION LON', 'Degrees', 5000);
    const [currentFlightPhase] = useSimVar('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum', 5000);
    const [atisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');
    const [atcMode, setAtcMode] = usePersistentProperty('CONFIG_ATC_MODE', 'RANGE');

    const unicom : ATCInfoExtended = { callsign: 'UNICOM', frequency: '122.800', type: apiClient.AtcType.radar, visualRange: 999999, distance: 0, latitude: 0, longitude: 0, textAtis: [] };

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

    useEffect(() => {
        setCurrentFilter();
    }, [controllers]);

    useEffect(() => {
        setCurrentFilter();
    }, [atcMode]);

    const loadAtc = () => {
        apiClient.ATC.getAtc((atisSource as string).toLowerCase()).then((res) => {
            let allAtc : ATCInfoExtended[] = res as ATCInfoExtended[];

            // filter controllers
            allAtc = allAtc.filter((a) => a.callsign.indexOf('_OBS') === -1 && parseFloat(a.frequency) <= 136.975);
            for (const a of allAtc.filter((a) => a.callsign.indexOf('_OBS') === -1 && parseFloat(a.frequency) <= 136.975)) {
                a.distance = getDistanceFromLatLonInNm(a.latitude, a.longitude, currentLatitude, currentLongitude) * 1.3;
            }
            setControllers(allAtc);

            if (frequency) {
                setCurrentAtc(controllers?.find((c) => c.frequency === fromFrequency(frequency)));
            }
        });
    };

    const setCurrentFilter = () => {
        if (controllers) {
            if (atcMode === 'RANGE') {
                let view = controllers.map((obj) => ({ ...obj }));
                if (view) {
                    view = view.filter((a) => a.distance <= a.visualRange);
                    view.sort((a1, a2) => (a1.distance > a2.distance ? 1 : -1));
                    view = view.slice(0, 26);
                    view.push(unicom);
                    setMessages([]);
                    setControllersToDisplay(view);
                }
            }

            if (atcMode === 'CURRENT') {
                if (props.simbriefData.departingAirport !== '----') {
                    const departures = controllers.filter((a) => a.callsign.indexOf(props.simbriefData.departingAirport) === 0);
                    const arrivals = controllers.filter((a) => a.callsign.indexOf(props.simbriefData.arrivingAirport) === 0);
                    const centers = controllers.filter((a) => a.callsign.indexOf('_CTR') > -1 && a.distance <= a.visualRange);

                    setControllersToDisplay([...departures, ...centers, ...arrivals]);
                } else {
                    setMessages(['You have to import your flight from simBrief first']);
                    setControllersToDisplay([]);
                }
            }
        } else {
            setControllersToDisplay([]);
        }
    };

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

    const phaseAsString = (phase: FmgcFlightPhases | null): string => {
        switch (phase) {
        case FmgcFlightPhases.PREFLIGHT: return 'Pre flight';
        case FmgcFlightPhases.TAKEOFF: return 'Take off';
        case FmgcFlightPhases.CLIMB: return 'Climb';
        case FmgcFlightPhases.CRUISE: return 'Cruise';
        case FmgcFlightPhases.DESCENT: return 'Descent';
        case FmgcFlightPhases.APPROACH: return 'Approach';
        case FmgcFlightPhases.GOAROUND: return 'Go around';
        case FmgcFlightPhases.DONE: return 'Done';
        default: return '';
        }
    };

    return (
        <div className="flex p-6 w-full">
            { (atisSource === 'IVAO' || atisSource === 'VATSIM') && (
                <div className="w-8/12">
                    <h1 className="text-white font-medium mb-4 text-2xl">
                        {atisSource}
                        {' - '}
                        Controllers
                    </h1>
                    <div className="bg-gray-800 rounded-xl p-2 text-white shadow-lg">
                        { props.simbriefData && props.simbriefData.departingAirport && props.simbriefData.departingAirport !== '' && (
                            <div>
                                <SelectGroup>
                                    <SelectItem
                                        onSelect={() => setAtcMode('RANGE')}
                                        selected={atcMode === 'RANGE'}
                                    >
                                        All controllers in range
                                    </SelectItem>
                                    <SelectItem
                                        onSelect={() => setAtcMode('CURRENT')}
                                        selected={atcMode === 'CURRENT'}
                                    >
                                        Specific to your current flight phase (
                                        {phaseAsString(currentFlightPhase)}
                                        )
                                    </SelectItem>
                                </SelectGroup>
                            </div>
                        )}

                        <div>
                            { messages && messages.length > 0 && (
                                <div className="flex -flex-col p-2 w-full m-4">
                                    { messages.map((m) => (
                                        <div className="text-base text-blue-500 flex">
                                            <IconInfoCircle className="mr-2" />
                                            { m }
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex p-2 w-full flex flex-wrap justify-between">
                            { controllersToDisplay && controllersToDisplay.map((atc) => (
                                <Button
                                    className={classNames({ 'w-60 m-1 flex': true, 'text-yellow-200': atc.frequency === currentFrequency })}
                                    id="atc.callsign"
                                    onClick={() => setFrequency(toFrequency(atc.frequency))}
                                >
                                    <div className="flex w-full justify-start text-base">
                                        <div>
                                            { atc.type === apiClient.AtcType.radar && <IconChartRadar size="2rem" /> }
                                            { atc.type === apiClient.AtcType.ground && <IconTrafficLights size="2rem" /> }
                                            { atc.type === apiClient.AtcType.departure && <IconPlaneDeparture size="2rem" /> }
                                            { atc.type === apiClient.AtcType.approach && <IconPlaneArrival size="2rem" /> }
                                            { atc.type === apiClient.AtcType.tower && <IconBuildingLighthouse size="2rem" /> }
                                            { atc.type === apiClient.AtcType.delivery && <IconCircleCheck size="2rem" /> }
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
                    <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg">
                        <div>
                            <div className="flex text-2xl text-yellow-200">
                                <div className="mr-4">
                                    {currentFrequency && currentFrequency.toString()}
                                </div>
                                <div>
                                    {currentAtc && currentAtc.callsign}
                                </div>
                            </div>
                            <div className="active-atis mt-8 text-2xl">
                                { currentAtc?.textAtis && currentAtc.textAtis.map((line) => (
                                    <p className="mt-2">{line}</p>
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
