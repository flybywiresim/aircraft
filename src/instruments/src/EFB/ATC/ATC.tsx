/* eslint-disable max-len */
import React, { useState, useEffect, useCallback } from 'react';
import * as apiClient from '@flybywiresim/api-client';
import useInterval from '@instruments/common/useInterval';
import { Link } from 'react-router-dom';
import { CloudArrowDown, Gear, InfoCircle } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { t } from '../translation';
import { pathify } from '../Utils/routing';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { useSimVar, useSplitSimVar } from '../../Common/simVars';
import { usePersistentProperty } from '../../Common/persistence';

export declare class ATCInfoExtended extends apiClient.ATCInfo {
    distance: number;
}

interface FrequencyCardProps {
    className?: string;
    callsign: string;
    frequency: string;
    setActive: () => void;
    setCurrent: () => void;
    setStandby: () => void;
}

const FrequencyCard = ({ className, callsign, frequency, setActive, setCurrent, setStandby }: FrequencyCardProps) => (
    <div className={className}>
        <div className="overflow-hidden relative p-6 w-full rounded-md bg-theme-secondary">
            <h2 className="font-bold">
                {callsign}
            </h2>
            <h2>
                {frequency}
            </h2>

            <div className="flex absolute inset-0 flex-row opacity-0 hover:opacity-100 transition duration-100">
                <div
                    className="flex justify-center items-center px-2 w-full font-bold text-center border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                    onClick={setActive}
                >
                    <h2 className="text-current">{t('AirTrafficControl.SetActive')}</h2>
                </div>
                <div
                    className="flex justify-center items-center px-2 w-full font-bold text-center border-2 transition duration-100 text-theme-body hover:text-utility-amber bg-utility-amber hover:bg-theme-body border-utility-amber"
                    onClick={setStandby}
                >
                    <h2 className="text-current">{t('AirTrafficControl.SetStandby')}</h2>
                </div>
                <div
                    className="flex justify-center items-center w-1/4 font-bold border-2 transition duration-100 text-theme-body hover:text-theme-text bg-theme-text hover:bg-theme-body border-theme-text"
                    onClick={setCurrent}
                >
                    <InfoCircle size={35} />
                </div>
            </div>
        </div>
    </div>
);

export const ATC = () => {
    const [controllers, setControllers] = useState<ATCInfoExtended[]>();
    const [activeFrequency, setActiveFrequency] = useSplitSimVar('COM ACTIVE FREQUENCY:1', 'Hz', 'K:COM_RADIO_SET_HZ', 'Hz', 500);
    const [stanbdyFrequency, setStandbyFrequency] = useSplitSimVar('COM STANDBY FREQUENCY:1', 'Hz', 'K:COM_STBY_RADIO_SET_HZ', 'Hz', 500);
    const [displayedActiveFrequency, setDisplayedActiveFrequency] = useState<string>();
    const [displayedStandbyFrequency, setDisplayedStandbyFrequency] = useState<string>();
    const [currentAtc, setCurrentAtc] = useState<ATCInfoExtended>();
    const [currentLatitude] = useSimVar('GPS POSITION LAT', 'Degrees', 10_000);
    const [currentLongitude] = useSimVar('GPS POSITION LON', 'Degrees', 10_000);
    const [atisSource] = usePersistentProperty('CONFIG_ATIS_SRC', 'FAA');

    const [atcDataPending, setAtcDataPending] = useState(true);

    const loadAtc = useCallback(async () => {
        if (atisSource.toLowerCase() !== 'vatsim' && atisSource.toLowerCase() !== 'ivao') return;
        const atisSourceReq = atisSource.toLowerCase();

        try {
            const atcRes = await apiClient.ATC.get(atisSourceReq);
            if (!atcRes) return;
            let allAtc : ATCInfoExtended[] = atcRes as ATCInfoExtended[];

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
        } catch (e) {
            toast.error(e.message);
        }

        setAtcDataPending(false);
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

    const fromFrequency = (frequency: number): string => {
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

    // Update selected controller info when controllers change
    useEffect(() => {
        const currentControllerFrequency = currentAtc?.frequency;

        if (currentControllerFrequency) {
            const controllerWithFrequency = controllers?.find((c) => c.frequency === currentControllerFrequency);

            if (controllerWithFrequency) {
                setCurrentAtc(controllerWithFrequency);
            }
        }
    }, [controllers]);

    useInterval(() => {
        loadAtc();
    }, 60_000);

    return (
        <div>
            <div className="flex relative flex-row justify-between items-center mb-2">
                <h1 className="font-bold">
                    {t('AirTrafficControl.Title')}
                    {(atisSource === 'IVAO' || atisSource === 'VATSIM') && ` (${atisSource})`}
                </h1>
            </div>
            { (atisSource === 'IVAO' || atisSource === 'VATSIM') ? (
                <div className="mt-4 w-full h-content-section-reduced">
                    <div className="relative">
                        <ScrollableContainer innerClassName="grid grid-cols-2" height={29}>
                            {controllers && controllers.map((controller, index) => (
                                <FrequencyCard
                                    className={`${index && index % 2 !== 0 && 'ml-4'} ${index >= 2 && 'mt-4'}`}
                                    callsign={controller.callsign}
                                    frequency={controller.frequency}
                                    setActive={() => setActiveFrequency(toFrequency(controller.frequency))}
                                    setCurrent={() => setCurrentAtc(controllers?.find((c) => c.frequency === controller.frequency))}
                                    setStandby={() => setStandbyFrequency(toFrequency(controller.frequency))}
                                />
                            ))}
                        </ScrollableContainer>

                        <div className={`absolute flex items-center justify-center inset-0 transition duration-200 bg-theme-body h-full border-2 border-theme-accent rounded-md
                            ${atcDataPending ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            {atcDataPending && (
                                <CloudArrowDown className="animate-bounce" size={40} />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-row mt-4 h-96 rounded-lg border-2 divide-x-2 border-theme-accent divide-theme-accent">
                        <div className="flex flex-col justify-between p-6">
                            <div>
                                <p>{t('AirTrafficControl.Active')}</p>
                                <div className="flex justify-center items-center mt-4 w-72 h-24 text-6xl rounded-lg border-2 font-rmp text-theme-highlight border-theme-accent">
                                    {displayedActiveFrequency && displayedActiveFrequency}
                                </div>
                            </div>
                            <div>
                                <p>{t('AirTrafficControl.Standby')}</p>
                                <div className="flex justify-center items-center mt-4 w-72 h-24 text-6xl rounded-lg border-2 font-rmp text-utility-amber border-theme-accent">
                                    {displayedStandbyFrequency && displayedStandbyFrequency}
                                </div>
                            </div>
                        </div>
                        {currentAtc?.textAtis ? (
                            <ControllerInformation currentAtc={currentAtc} />
                        ) : (
                            <div className="flex justify-center items-center w-full">
                                <h1 className="font-bold text-center">{t('AirTrafficControl.NoInformationAvailableForThisFrequency').toUpperCase()}</h1>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center mt-4 rounded-lg border-2 h-content-section-reduced border-theme-accent">
                    <div className="space-y-8 max-w-4xl">
                        <h1 className="text-center">{t('AirTrafficControl.SelectCorrectATISATCSource')}</h1>
                        <Link
                            to={`/settings/${pathify('ATSU / AOC')}`}
                            className="flex justify-center items-center p-2 space-x-4 w-full rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                        >
                            <Gear size={26} />
                            <p className="text-current">{t('AirTrafficControl.ChangeATISATCSourceButton')}</p>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ControllerInformationProps {
    currentAtc?: ATCInfoExtended;
}

const ControllerInformation = ({ currentAtc }: ControllerInformationProps) => (
    <ScrollableContainer height={24} className="p-4">
        <h2>{currentAtc?.callsign}</h2>
        {currentAtc?.textAtis.map((line) => (
            <p className="flex flex-wrap mt-4">{line}</p>
        ))}
    </ScrollableContainer>
);

export default ATC;
