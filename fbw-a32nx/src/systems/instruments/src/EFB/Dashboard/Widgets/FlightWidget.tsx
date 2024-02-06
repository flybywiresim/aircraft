// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IconPlane } from '@tabler/icons';
import { CloudArrowDown } from 'react-bootstrap-icons';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import { toast } from 'react-toastify';
import { fetchSimbriefDataAction, isSimbriefDataLoaded, setPayloadImported, setFuelImported } from '../../Store/features/simBrief';
import { useAppSelector, useAppDispatch } from '../../Store/store';

import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { t } from '../../translation';
import { getAirframeType } from '../../Efb';

interface InformationEntryProps {
    title: string;
    info: string;
}

const InformationEntry = ({ title, info }: InformationEntryProps) => (
    <div className="justify-content flex w-full flex-col items-center">
        <h3 className="text-center font-light">{title}</h3>
        <h2 className="font-bold">{info}</h2>
    </div>
);

interface NoSimBriefDataOverlayProps {
    simbriefDataLoaded: boolean;
    simbriefDataPending: boolean;
    fetchData: () => void;
}

const NoSimBriefDataOverlay = ({ simbriefDataLoaded, simbriefDataPending, fetchData }: NoSimBriefDataOverlayProps) => (
    <div className={`bg-theme-body absolute inset-0 transition duration-200 ${simbriefDataLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <h1 className="flex h-full w-full items-center justify-center">
            {simbriefDataPending ? (
                <CloudArrowDown className="animate-bounce" size={40} />
            ) : (
                <>
                    {!simbriefDataLoaded && (
                        <div className="space-y-4">
                            <h1
                                className="text-center"
                                style={{ maxWidth: '18em' }}
                            >
                                {t('Dashboard.YourFlight.SimBriefDataNotYetLoaded')}
                            </h1>

                            <button
                                type="button"
                                onClick={fetchData}
                                className="text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight flex w-full items-center justify-center space-x-4 rounded-md border-2 p-2 transition duration-100"
                            >
                                <CloudArrowDown size={26} />
                                <p className="text-current">{t('Dashboard.YourFlight.ImportSimBriefData')}</p>
                            </button>
                        </div>
                    )}
                </>
            )}
        </h1>
    </div>
);

export const FlightWidget = () => {
    const { data } = useAppSelector((state) => state.simbrief);
    const [simbriefDataPending, setSimbriefDataPending] = useState(false);
    const [navigraphUsername] = usePersistentProperty('NAVIGRAPH_USERNAME');
    const [overrideSimBriefUserID] = usePersistentProperty('CONFIG_OVERRIDE_SIMBRIEF_USERID');
    const [autoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT');
    const [airframe] = useState(getAirframeType());

    const {
        schedIn,
        schedOut,
        weather,
        cruiseAltitude,
        weights,
        arrivingAirport,
        arrivingIata,
        arrivingName,
        departingAirport,
        departingIata,
        departingName,
        airline,
        route,
        flightNum,
        altIcao,
        costInd,
        arrivingRunway,
        departingRunway,
    } = data;
    const { flightPlanProgress } = useAppSelector((state) => state.flightProgress);

    const fuelImported = useAppSelector((state) => state.simbrief.fuelImported);
    const payloadImported = useAppSelector((state) => state.simbrief.payloadImported);

    const dispatch = useAppDispatch();

    const history = useHistory();

    const sta = new Date(parseInt(schedIn) * 1000);
    const schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}${sta.getUTCMinutes().toString().padStart(2, '0')}Z`;

    const std = new Date(parseInt(schedOut) * 1000);
    const schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}${std.getUTCMinutes().toString().padStart(2, '0')}Z`;

    const flightLevel = (cruiseAltitude / 100);
    const crzAlt = `FL${flightLevel.toString().padStart(3, '0')}`;

    const avgWind = `${weather.avgWindDir}/${weather.avgWindSpeed}`;

    const eZfwUnround = Number.parseFloat(weights.estZeroFuelWeight) / 100;
    const eZfw = Math.round(eZfwUnround) / 10;
    const estimatedZfw = `${eZfw}`;

    const fetchData = async () => {
        setSimbriefDataPending(true);
        let importError = false;

        dispatch(setFuelImported(false));
        dispatch(setPayloadImported(false));
        fetchSimbriefDataAction(navigraphUsername ?? '', overrideSimBriefUserID ?? '').then((action) => {
            dispatch(action);
        }).catch((e) => {
            toast.error(e.message);
            importError = true;
        }).then(() => {
            if (!importError) {
                history.push('/ground/fuel');
                history.push('/ground/payload');
                history.push('/dashboard');
                setTimeout(() => {
                    if (fuelImported && payloadImported) {
                        toast.success(t('Dashboard.YourFlight.ToastFuelPayloadImported'));
                    }
                }, 2000);
            }
        });

        setSimbriefDataPending(false);
    };

    useEffect(() => {
        if ((!data || !isSimbriefDataLoaded()) && !simbriefDataPending && autoSimbriefImport === 'ENABLED' && (navigraphUsername || overrideSimBriefUserID)) {
            fetchData();
        }
    }, []);

    const simbriefDataLoaded = isSimbriefDataLoaded();

    return (
        <div className="w-1/2">
            <div className="mb-4 flex flex-row items-center justify-between">
                <h1 className="font-bold">{t('Dashboard.YourFlight.Title')}</h1>
                {simbriefDataLoaded && (
                    <h1>
                        {(airline.length > 0 ? airline : '') + flightNum}
                        {' '}
                        |
                        {' '}
                        {airframe === 'A380_842' ? 'A380-842' : 'A320-251N'}
                    </h1>
                )}
            </div>
            <div className="h-content-section-reduced border-theme-accent relative w-full overflow-hidden rounded-lg border-2 p-6">
                <div className="flex h-full flex-col justify-between">
                    <div className="space-y-8">
                        <div className="flex flex-row justify-between">
                            <div>
                                <h1 className="text-4xl font-bold">{departingAirport}</h1>
                                <p className="w-52 text-sm">{departingName}</p>
                            </div>
                            <div>
                                <h1 className="text-right text-4xl font-bold">{arrivingAirport}</h1>
                                <p className="w-52 text-right text-sm">{arrivingName}</p>
                            </div>
                        </div>
                        <div>
                            <div className="flex w-full flex-row items-center">
                                <p className={`font-body ${flightPlanProgress > 1 ? 'text-theme-highlight' : 'text-theme-text'}`}>
                                    {schedOutParsed}
                                </p>
                                <div className="relative mx-6 flex h-1 w-full flex-row">
                                    <div className="border-theme-text absolute inset-x-0 border-b-4 border-dashed" />

                                    <div className="bg-theme-highlight relative w-full" style={{ width: `${flightPlanProgress}%` }}>
                                        {!!flightPlanProgress && (
                                            <IconPlane
                                                className="text-theme-highlight absolute right-0 -translate-y-1/2 translate-x-1/2 fill-current"
                                                size={50}
                                                strokeLinejoin="miter"
                                            />
                                        )}
                                    </div>
                                </div>
                                <p className={`font-body text-right ${Math.round(flightPlanProgress) >= 98 ? 'text-theme-highlight' : 'text-theme-text'}`}>
                                    {schedInParsed}
                                </p>
                            </div>
                        </div>
                        <div>
                            <div className="mb-4 flex flex-row justify-around">
                                <InformationEntry title={t('Dashboard.YourFlight.Alternate')} info={altIcao ?? 'NONE'} />
                                <div className="bg-theme-accent mx-4 my-auto h-8 w-1" />
                                <InformationEntry title={t('Dashboard.YourFlight.CompanyRoute')} info={departingIata + arrivingIata} />
                                <div className="bg-theme-accent mx-4 my-auto h-8 w-1" />
                                <InformationEntry title={t('Dashboard.YourFlight.ZFW')} info={estimatedZfw} />
                            </div>
                            <div className="bg-theme-accent my-auto h-0.5 w-full" />
                            <div className="mt-4 flex flex-row justify-around">
                                <InformationEntry title={t('Dashboard.YourFlight.CostIndex')} info={costInd} />
                                <div className="bg-theme-accent mx-4 my-auto h-8 w-1" />
                                <InformationEntry title={t('Dashboard.YourFlight.AverageWind')} info={avgWind} />
                                <div className="bg-theme-accent mx-4 my-auto h-8 w-1" />
                                <InformationEntry title={t('Dashboard.YourFlight.CruiseAlt')} info={crzAlt} />
                            </div>
                        </div>
                        <div>
                            <h5 className="mb-2 text-2xl font-bold">{t('Dashboard.YourFlight.Route')}</h5>
                            <ScrollableContainer height={15}>
                                <p className="font-mono text-2xl">
                                    <span className="text-theme-highlight text-2xl">
                                        {departingAirport}
                                        /
                                        {departingRunway}
                                    </span>
                                    {' '}
                                    {route}
                                    {' '}
                                    <span className="text-theme-highlight text-2xl">
                                        {arrivingAirport}
                                        /
                                        {arrivingRunway}
                                    </span>
                                </p>
                            </ScrollableContainer>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchData}
                        className="text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight flex w-full items-center justify-center space-x-4 rounded-lg border-2 p-2 transition duration-100"
                    >
                        <CloudArrowDown size={26} />
                        <p className="text-current">{t('Dashboard.YourFlight.ImportSimBriefData')}</p>
                    </button>
                </div>

                <NoSimBriefDataOverlay
                    simbriefDataLoaded={simbriefDataLoaded}
                    simbriefDataPending={simbriefDataPending}
                    fetchData={fetchData}
                />
            </div>
        </div>
    );
};
