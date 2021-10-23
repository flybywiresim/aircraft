/* eslint-disable max-len */
import React, { useState, useEffect, useCallback } from 'react';
import * as apiClient from '@flybywiresim/api-client';
import useInterval from '@instruments/common/useInterval';
import { Link } from 'react-router-dom';
import { CloudArrowDown, Gear } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { pathify } from '../Utils/routing';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { useSimVar, useSplitSimVar } from '../../Common/simVars';
import { usePersistentProperty } from '../../Common/persistence';
import { AlertModal, useModals } from '../UtilComponents/Modals/Modals';

export declare class ATCInfoExtended extends apiClient.ATCInfo {
    distance: number;
}

interface FrequencyCardProps {
    className?: string;
    callsign: string;
    frequency: string;
    setActive: () => void;
    setStandby: () => void;
}

const FrequencyCard = ({ className, callsign, frequency, setActive, setStandby }: FrequencyCardProps) => (
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
                    className="flex justify-center items-center w-full font-bold border-2 transition duration-100 bg-theme-highlight text-theme-body hover:text-theme-highlight hover:bg-theme-body border-theme-highlight"
                    onClick={setActive}
                >
                    <h2 className="text-current">Set Active</h2>
                </div>
                <div
                    className="flex justify-center items-center w-full font-bold border-2 transition duration-100 bg-utility-amber text-theme-body hover:text-utility-amber hover:bg-theme-body border-utility-amber"
                    onClick={setStandby}
                >
                    <h2 className="text-current">Set Standby</h2>
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
    const [hoppieUserId] = usePersistentProperty('CONFIG_HOPPIE_USERID');
    const [hoppieActive, setHoppieActive] = useSimVar('L:A32NX_HOPPIE_ACTIVE', 'number');
    const [mcduFlightNoSet] = useSimVar('L:A32NX_MCDU_FLT_NO_SET', 'boolean');
    const [callsign] = useSimVar('ATC FLIGHT NUMBER', 'string');

    const [atcDataPending, setAtcDataPending] = useState(true);

    const { showModal } = useModals();

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

    useEffect(() => {
        if (activeFrequency) {
            setCurrentAtc(controllers?.find((c) => c.frequency === fromFrequency(activeFrequency)));
        }
    }, [controllers, activeFrequency]);

    useInterval(() => {
        loadAtc();
    }, 60_000);

    const handleHoppieToggle = async (): Promise<void> => {
        if (!hoppieActive) {
            if (hoppieUserId === '' || hoppieUserId === undefined) {
                showModal(
                    <AlertModal
                        title="Hoppie Error"
                        bodyText="Hoppie system requires a user ID which needs to be set in Settings > ATSU / AOC."
                        onAcknowledge={() => {
                            setHoppieActive(0);
                        }}
                    />,
                );
            } else {
                const body = {
                    logon: hoppieUserId,
                    from: 'FBWA32NX',
                    to: 'ALL-CALLSIGNS',
                    type: 'ping',
                    packet: '',
                };
                let retval = await apiClient.Hoppie.sendRequest(body).then((resp) => resp.response);

                // check if the logon code is valid
                if (retval === 'error {illegal logon code}') {
                    showModal(
                        <AlertModal
                            title="Hoppie Error"
                            bodyText="Invalid logon code used."
                            onAcknowledge={() => {
                                setHoppieActive(0);
                            }}
                        />,
                    );
                } else if (mcduFlightNoSet && callsign && callsign.length !== 0) {
                    const body = {
                        logon: hoppieUserId,
                        from: callsign,
                        to: 'ALL-CALLSIGNS',
                        type: 'ping',
                        packet: '',
                    };
                    retval = await apiClient.Hoppie.sendRequest(body).then((resp) => resp.response);

                    // check if the callsign is already in use
                    if (retval === 'error {callsign already in use}') {
                        showModal(
                            <AlertModal
                                title="Hoppie Error"
                                bodyText="Flightnumber is already in use."
                                onAcknowledge={() => {
                                    setHoppieActive(0);
                                }}
                            />,
                        );
                    } else {
                        setHoppieActive(1);
                    }
                } else {
                    setHoppieActive(1);
                }
            }
        } else {
            setHoppieActive(0);
        }
    };

    return (
        <div>
            <div className="flex relative flex-row justify-between items-center mb-2">
                <h1 className="font-bold">
                    Air Traffic Control
                    {(atisSource === 'IVAO' || atisSource === 'VATSIM') && ` (${atisSource})`}
                </h1>

                <button
                    type="button"
                    className="flex absolute top-0 right-0 justify-center items-center py-2 w-80 rounded-md bg-theme-accent"
                    onClick={handleHoppieToggle}
                >
                    <p>
                        {hoppieActive ? 'Disconnect Hoppie ACARS' : 'Connect Hoppie ACARS'}
                    </p>
                </button>
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
                                    setStandby={() => setStandbyFrequency(toFrequency(controller.frequency))}
                                    key={controller.frequency}
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
                                <p>Active</p>
                                <div className="flex justify-center items-center mt-4 w-72 h-24 text-6xl rounded-lg border-2 font-rmp text-theme-highlight border-theme-accent">
                                    {displayedActiveFrequency && displayedActiveFrequency}
                                </div>
                            </div>
                            <div>
                                <p>Standby</p>
                                <div className="flex justify-center items-center mt-4 w-72 h-24 text-6xl rounded-lg border-2 text-utility-amber font-rmp border-theme-accent">
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
                <div className="flex justify-center items-center mt-4 rounded-lg border-2 h-content-section-reduced border-theme-accent">
                    <div className="space-y-8 max-w-4xl">
                        <h1 className="text-center">This page is only available when IVAO or VATSIM is selected as the ATIS/ATC source in the settings page.</h1>
                        <Link
                            to={`/settings/${pathify('ATSU / AOC')}`}
                            className="flex justify-center items-center p-2 space-x-4 w-full rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                        >
                            <Gear size={26} />
                            <p className="text-current">Change ATIS/ATC source</p>
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
