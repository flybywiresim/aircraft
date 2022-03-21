/* eslint-disable max-len */
import React, { useState } from 'react';
import { IconPlane } from '@tabler/icons';
import { CloudArrowDown } from 'react-bootstrap-icons';
import { usePersistentProperty } from '@instruments/common/persistence';
import { toast } from 'react-toastify';

import { fetchSimbriefDataAction, isSimbriefDataLoaded } from '../../Store/features/simBrief';
import { useAppSelector, useAppDispatch } from '../../Store/store';

import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

interface InformationEntryProps {
    title: string;
    info: string;
}

const InformationEntry = ({ title, info }: InformationEntryProps) => (
    <div className="flex flex-col items-center w-full">
        <h3 className="font-light">{title}</h3>
        <h2 className="font-bold">{info}</h2>
    </div>
);

interface NoSimBriefDataOverlayProps {
    simbriefDataLoaded: boolean;
    simbriefDataPending: boolean;
    fetchData: () => void;
}

const NoSimBriefDataOverlay = ({ simbriefDataLoaded, simbriefDataPending, fetchData }: NoSimBriefDataOverlayProps) => (
    <div className={`absolute inset-0 transition duration-200 bg-theme-body ${simbriefDataLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <h1 className="flex justify-center items-center w-full h-full">
            {simbriefDataPending ? (
                <CloudArrowDown className="animate-bounce" size={40} />
            ) : (
                <>
                    {!simbriefDataLoaded && (
                        <div className="space-y-4">
                            <h1>SimBrief data not yet loaded.</h1>

                            <button
                                type="button"
                                onClick={fetchData}
                                className="flex justify-center items-center p-2 space-x-4 w-full text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                            >
                                <CloudArrowDown size={26} />
                                <p className="text-current">Import SimBrief Data</p>
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
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');

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

    const dispatch = useAppDispatch();

    const sta = new Date(parseInt(schedIn) * 1000);
    const schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}${sta.getUTCMinutes().toString().padStart(2, '0')}Z`;

    const std = new Date(parseInt(schedOut) * 1000);
    const schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}${std.getUTCMinutes().toString().padStart(2, '0')}Z`;

    const flightLevel = (cruiseAltitude / 100);
    const crzAlt = `FL${flightLevel.toString().padStart(3, '0')}`;

    const avgWind = `${weather.avgWindDir}/${weather.avgWindSpeed}`;

    const eZfwUnround = weights.estZeroFuelWeight / 100;
    const eZfw = Math.round(eZfwUnround) / 10;
    const estimatedZfw = `${eZfw}`;

    const fetchData = async () => {
        setSimbriefDataPending(true);

        try {
            const action = await fetchSimbriefDataAction(simbriefUserId ?? '');

            dispatch(action);
        } catch (e) {
            toast.error(e.message);
        }

        setSimbriefDataPending(false);
    };

    const simbriefDataLoaded = isSimbriefDataLoaded();

    return (
        <div className="w-full">
            <div className="flex flex-row justify-between items-center mb-4">
                <h1 className="font-bold">Your Flight</h1>
                {simbriefDataLoaded && (
                    <h1>
                        {(airline.length > 0 ? airline : '') + flightNum}
                        {' '}
                        |
                        {' '}
                        A320-251N
                    </h1>
                )}
            </div>
            <div className="overflow-hidden relative p-6 w-full h-content-section-reduced rounded-lg border-2 border-theme-accent">
                <div className="flex flex-col justify-between h-full">
                    <div className="space-y-8">
                        <div className="flex flex-row justify-between">
                            <div>
                                <h1 className="text-4xl font-bold">{departingAirport}</h1>
                                <p className="w-52 text-sm">{departingName}</p>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-right">{arrivingAirport}</h1>
                                <p className="w-52 text-sm text-right">{arrivingName}</p>
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-row items-center w-full">
                                <p className={`font-body ${flightPlanProgress > 1 ? 'text-theme-highlight' : 'text-theme-text'}`}>
                                    {schedOutParsed}
                                </p>
                                <div className="flex relative flex-row mx-6 w-full h-1">
                                    <div className="absolute inset-x-0 border-b-4 border-theme-text border-dashed" />

                                    <div className="relative w-full bg-theme-highlight" style={{ width: `${flightPlanProgress}%` }}>
                                        {!!flightPlanProgress && (
                                            <IconPlane
                                                className="absolute right-0 text-theme-highlight transform translate-x-1/2 -translate-y-1/2 fill-current"
                                                size={50}
                                                strokeLinejoin="miter"
                                            />
                                        )}
                                    </div>
                                </div>
                                <p className={`text-right font-body ${Math.round(flightPlanProgress) >= 98 ? 'text-theme-highlight' : 'text-theme-text'}`}>
                                    {schedInParsed}
                                </p>
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-row mb-4">
                                <InformationEntry title="Alternate" info={altIcao ?? 'NONE'} />
                                <div className="my-auto w-2 h-8 bg-theme-accent" />
                                <InformationEntry title="Company Route" info={departingIata + arrivingIata} />
                                <div className="my-auto w-2 h-8 bg-theme-accent" />
                                <InformationEntry title="ZFW" info={estimatedZfw} />
                            </div>
                            <div className="my-auto w-full h-0.5 bg-theme-accent" />
                            <div className="flex flex-row mt-4">
                                <InformationEntry title="Cost Index" info={costInd} />
                                <div className="my-auto w-2 h-8 bg-theme-accent" />
                                <InformationEntry title="Average Wind" info={avgWind} />
                                <div className="my-auto w-2 h-8 bg-theme-accent" />
                                <InformationEntry title="Cruise Alt" info={crzAlt} />
                            </div>
                        </div>
                        <div>
                            <h5 className="mb-2 text-2xl font-bold">Route</h5>
                            <ScrollableContainer height={15}>
                                <p className="font-mono text-2xl">
                                    <span className="text-2xl text-theme-highlight">
                                        {departingAirport}
                                        /
                                        {departingRunway}
                                    </span>
                                    {' '}
                                    {route}
                                    {' '}
                                    <span className="text-2xl text-theme-highlight">
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
                        className="flex justify-center items-center p-2 space-x-4 w-full text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-lg border-2 border-theme-highlight transition duration-100"
                    >
                        <CloudArrowDown size={26} />
                        <p className="text-current">Import SimBrief Data</p>
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
