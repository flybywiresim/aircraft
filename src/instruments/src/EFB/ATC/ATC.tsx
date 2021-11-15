import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as apiClient from '@flybywiresim/api-client';
import { useInterval } from '@flybywiresim/react-components';
import { Link } from 'react-router-dom';
import { Gear } from 'react-bootstrap-icons';
import { useSimVar, useSplitSimVar } from '../../Common/simVars';
import { usePersistentProperty } from '../../Common/persistence';

export declare class ATCInfoExtended extends apiClient.ATCInfo {
    distance: number;
}

export const ATC = () => {
    const [controllers, setControllers] = useState<ATCInfoExtended[]>();
    const [activeFrequency, setActiveFrequency] = useSplitSimVar('COM ACTIVE FREQUENCY:1', 'Hz', 'K:COM_RADIO_SET_HZ', 'Hz', 500);
    const [stanbdyFrequency, setStandbyFrequency] = useSplitSimVar('COM STANDBY FREQUENCY:1', 'Hz', 'K:COM_RADIO_SET_HZ', 'Hz', 500);
    const [displayedActiveFrequency, setDisplayedActiveFrequency] = useState<string>();
    const [displayedStandbyFrequency, setDisplayedStandbyFrequency] = useState<string>();
    const [currentAtc, setCurrentAtc] = useState<ATCInfoExtended>();
    const [currentLatitude] = useSimVar('GPS POSITION LAT', 'Degrees', 5000);
    const [currentLongitude] = useSimVar('GPS POSITION LON', 'Degrees', 5000);
    const [atisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');

    const [contentOverflows, setContentOverflows] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const position = useRef({ top: 0, y: 0 });

    const handleMouseDown = (event: React.MouseEvent) => {
        position.current.top = containerRef.current ? containerRef.current.scrollTop : 0;
        position.current.y = event.clientY;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (event: MouseEvent) => {
        const dy = event.clientY - position.current.y;
        if (containerRef.current) {
            containerRef.current.scrollTop = position.current.top - dy;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    useEffect(() => {
        if (contentRef.current) {
            if (contentRef.current.clientHeight > 29 * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
                setContentOverflows(true);
            }
        }
    }, [controllers]);

    const loadAtc = useCallback(() => {
        apiClient.ATC.getAtc(atisSource.toString().toLowerCase()).then((res) => {
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

    const getDistanceFromLatLonInNm = (lat1, lon1, lat2, lon2) : number => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2Rad(lat2 - lat1); // deg2Rad below
        const dLon = deg2Rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(deg2Rad(lat1)) * Math.cos(deg2Rad(lat2))
          * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c * 0.5399568; // Distance in nm
        return d;
    };

    const deg2Rad = (deg) => deg * (Math.PI / 180);

    const toFrequency = (frequency:string) : number => {
        if (frequency) {
            return parseFloat(`${frequency.replace('.', '').padEnd(9, '0')}.000`);
        }
        return 0;
    };

    const fromFrequency = (frequency:number): string => {
        if (frequency) {
            let converted: string = frequency.toString().replace('.', '');
            converted = `${converted.substring(0, 3)}.${converted.substring(3)}`;
            return parseFloat(converted).toFixed(3);
        }
        return '';
    };

    useEffect(() => {
        loadAtc();
    }, [loadAtc]);

    useEffect(() => {
        const converted = fromFrequency(activeFrequency);
        setDisplayedActiveFrequency(converted);
        setCurrentAtc(controllers?.find((c) => c.frequency === converted));
    }, [activeFrequency]);

    useEffect(() => {
        const converted = fromFrequency(stanbdyFrequency);
        setDisplayedStandbyFrequency(converted);
        setCurrentAtc(controllers?.find((c) => c.frequency === converted));
    }, [stanbdyFrequency]);

    useEffect(() => {
        if (activeFrequency) {
            setCurrentAtc(controllers?.find((c) => c.frequency === fromFrequency(activeFrequency)));
        }
    }, [controllers, activeFrequency]);

    useEffect(() => {

    }, [currentAtc]);

    useInterval(() => {
        loadAtc();
    }, 60 * 1000);

    return (
        <div>
            <h1 className="font-bold">
                Air Traffic Control
                {(atisSource === 'IVAO' || atisSource === 'VATSIM') && ` - ${atisSource} Controllers currently in range`}
            </h1>
            { (atisSource === 'IVAO' || atisSource === 'VATSIM') ? (
                <div className="w-full h-efb">
                    {/* TODO: REPLACE WITH JIT VALUE */}
                    <div
                        className={`${contentOverflows && 'overflow-y-scroll'} scrollbar`}
                        style={{ height: '29rem' }}
                        ref={containerRef}
                        onMouseDown={handleMouseDown}
                    >
                        <div className={`flex flex-wrap ${contentOverflows && 'mr-4'}`} ref={contentRef}>
                            {controllers && controllers.map((controller, index) => (
                                <div className={`${index % 2 === 0 && 'pr-4'} w-full max-w-1/2`}>
                                    <div className="overflow-hidden relative p-6 mt-4 w-full rounded-md bg-theme-secondary">
                                        <h2 className="font-bold">
                                            {controller.callsign}
                                        </h2>
                                        <h2>
                                            {controller.frequency}
                                        </h2>

                                        <div className="flex absolute inset-0 flex-row opacity-0 hover:opacity-100 transition duration-100">
                                            <div
                                                className="flex justify-center items-center w-full bg-opacity-80 bg-theme-highlight"
                                                onClick={() => setActiveFrequency(toFrequency(controller.frequency))}
                                            >
                                                <h2>Set Active</h2>
                                            </div>
                                            <div
                                                className="flex justify-center items-center w-full bg-yellow-500 bg-opacity-80"
                                                onClick={() => setStandbyFrequency(toFrequency(controller.frequency))}
                                            >
                                                <h2>Set Standby</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-row mt-8 h-96 rounded-lg border divide-x shadow-lg divide-theme-accent border-theme-accent">
                        <div className="flex flex-col justify-between p-6">
                            <div>
                                <p>Active</p>
                                <div className="flex justify-center items-center py-4 px-10 mt-4 text-6xl rounded-lg border shadow-lg text-theme-highlight font-rmp border-theme-accent">
                                    {displayedActiveFrequency && displayedActiveFrequency}
                                </div>
                            </div>
                            <div>
                                <p>Standby</p>
                                <div className="flex justify-center items-center py-4 px-10 mt-4 text-6xl text-yellow-500 rounded-lg border shadow-lg font-rmp border-theme-accent">
                                    {displayedStandbyFrequency && displayedStandbyFrequency}
                                </div>
                            </div>
                        </div>
                        {currentAtc?.textAtis ? (
                            <ControllerInformation currentAtc={currentAtc} />
                        ) : (
                            <div className="flex justify-center items-center w-full">
                                <h1 className="font-bold">NO INFORMATION AVAILABLE FOR THIS FREQUENCY</h1>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col justify-center items-center space-y-8 w-full bg-blue-500 rounded-lg border-2 shadow-md h-efb border-theme-accent">
                    <h1 className="max-w-4xl text-center">This page is only available when IVAO or VATSIM is selected as the ATIS/ATC source in the settings page</h1>
                    <Link
                        to="/settings/atsu-/-aoc"
                        className="flex justify-center items-center py-2 px-16 space-x-4 rounded-lg border-2 shadow-lg focus:outline-none bg-theme-highlight border-theme-secondary"
                    >
                        <Gear size={26} />
                        <p>Change ATIS/ATC source</p>
                    </Link>
                </div>
            )}
        </div>
    );
};

type ControllerInformationProps = {
    currentAtc: ATCInfoExtended | undefined,
}

const ControllerInformation = ({ currentAtc }: ControllerInformationProps) => {
    const [contentOverflows, setContentOverflows] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const position = useRef({ top: 0, y: 0 });

    const handleMouseDown = (event: React.MouseEvent) => {
        position.current.top = containerRef.current ? containerRef.current.scrollTop : 0;
        position.current.y = event.clientY;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (event: MouseEvent) => {
        const dy = event.clientY - position.current.y;
        if (containerRef.current) {
            containerRef.current.scrollTop = position.current.top - dy;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    useEffect(() => {
        if (contentRef.current) {
            if (contentRef.current.clientHeight > 24 * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
                setContentOverflows(true);
            }
        }
    }, [currentAtc]);

    return (
        <div
            className={`${contentOverflows && 'overflow-y-scroll'} overflow-hidden flex-wrap p-2 w-full h-96 scrollbar`}
            ref={containerRef}
            onMouseDown={handleMouseDown}
        >
            <div ref={contentRef}>
                <h2>{currentAtc?.callsign}</h2>
                {currentAtc?.textAtis.map((line) => (
                    <p className="flex flex-wrap mt-4">{line}</p>
                ))}
            </div>
        </div>
    );
};

export default ATC;
