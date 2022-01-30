import React from 'react';
import { IconPlane } from '@tabler/icons';
import { CloudArrowDown } from 'react-bootstrap-icons';
import { usePersistentProperty } from '@instruments/common/persistence';
import { toast } from 'react-toastify';

import { initialState, fetchSimbriefDataAction } from '../../Store/features/simBrief';
import { useAppSelector, useAppDispatch } from '../../Store/store';

import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

interface InformationEntryProps {
    title: string;
    info: string;
}

const InformationEntry = ({ title, info }: InformationEntryProps) => (
    <div className="flex flex-col items-center w-full">
        <h3 className="font-bold textl-xl">{title}</h3>
        <p className="text-2xl font-light">{info}</p>
    </div>
);

const simbriefValuePlaceholders = {
    airline: '---',
    flightNum: '----',
    departingAirport: '----',
    departingRunway: '---',
    departingIata: '---',
    departingName: '---',
    departingPosLat: 0,
    departingPosLong: 0,
    arrivingAirport: '----',
    arrivingRunway: '---',
    arrivingIata: '---',
    arrivingName: '---',
    arrivingPosLat: 0,
    arrivingPosLong: 0,
    aircraftReg: '-----',
    flightDistance: '---NM',
    route: '---- --- ---- --- ---- ----',
    flightETAInSeconds: 'N/A',
    cruiseAltitude: 0,
    weights: {
        cargo: 0,
        estLandingWeight: 0,
        estTakeOffWeight: 0,
        estZeroFuelWeight: 0,
        maxLandingWeight: 0,
        maxTakeOffWeight: 0,
        maxZeroFuelWeight: 0,
        passengerCount: 0,
        passengerWeight: 0,
        payload: 0,
    },
    fuels: {
        avgFuelFlow: 0,
        contingency: 0,
        enrouteBurn: 0,
        etops: 0,
        extra: 0,
        maxTanks: 0,
        minTakeOff: 0,
        planLanding: 0,
        planRamp: 0,
        planTakeOff: 0,
        reserve: 0,
        taxi: 0,
    },
    weather: {
        avgWindDir: '---',
        avgWindSpeed: '---',
    },
    units: 'kgs',
    altIcao: '----',
    altIata: '---',
    altBurn: 0,
    tripTime: 0,
    contFuelTime: 0,
    resFuelTime: 0,
    taxiOutTime: 0,
    schedIn: '--:--',
    schedOut: '--:--',
    loadsheet: 'N/A',
    costInd: '--',
};

export const FlightWidget = () => {
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const { data } = useAppSelector((state) => state.simbrief);
    const isInitialData = data === initialState.data;

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
        aircraftReg,
    } = isInitialData ? simbriefValuePlaceholders : data;
    const { flightPlanProgress } = useAppSelector((state) => state.flightProgress);

    const dispatch = useAppDispatch();

    let schedInParsed = '----';
    let schedOutParsed = '----';
    let crzAlt = '-----';
    let avgWind = '---/---';
    let estimatedZfw = '--.-';

    if (schedIn !== '--:--') {
        const sta = new Date(parseInt(schedIn) * 1000);
        schedInParsed = `ETA ${sta.getUTCHours().toString().padStart(2, '0')}${sta.getUTCMinutes().toString().padStart(2, '0')}Z`;
    }

    if (schedOut !== '--:--') {
        const std = new Date(parseInt(schedOut) * 1000);
        schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}${std.getUTCMinutes().toString().padStart(2, '0')}Z`;
    }

    if (cruiseAltitude !== 0) {
        const flightLevel = (cruiseAltitude / 100);
        crzAlt = `FL${flightLevel}`;
    }

    if (weather.avgWindDir !== '---' && weather.avgWindSpeed !== '---') {
        avgWind = `${weather.avgWindDir}/${weather.avgWindSpeed}`;
    }

    if (weights.estZeroFuelWeight !== 0) {
        const eZfwUnround = weights.estZeroFuelWeight / 100;
        const eZfw = Math.round(eZfwUnround) / 10;
        estimatedZfw = `${eZfw}`;
    }

    return (
        <div className="overflow-hidden p-6 mr-3 w-2/5 h-full rounded-lg border-2 border-theme-accent">
            <div className="flex flex-col justify-between h-full">
                <div className="space-y-8">
                    <div className="flex flex-row justify-between">
                        <div>
                            <p>{(airline.length > 0 ? airline : '') + flightNum}</p>
                            <h1 className="text-4xl font-bold">{departingAirport}</h1>
                            <p className="w-52 text-sm">{departingName}</p>
                        </div>
                        <div>
                            <p className="text-right">{aircraftReg}</p>
                            <h1 className="text-4xl font-bold text-right">{arrivingAirport}</h1>
                            <p className="w-52 text-sm text-right">{arrivingName}</p>
                        </div>
                    </div>
                    <div>
                        <div className="w-full">
                            <div>
                                <p className={`text-theme-highlight font-body ${flightPlanProgress > 1 ? 'text-theme-highlight' : 'text-theme-text'}`}>
                                    {schedOutParsed}
                                </p>
                                <div className={`w-1 h-4 ${flightPlanProgress > 1 ? 'bg-theme-highlight' : 'bg-theme-text'}`} />
                            </div>
                            <div className="flex flex-row h-1">
                                <div className="relative w-full bg-theme-highlight" style={{ width: `${flightPlanProgress}%` }}>
                                    {!!flightPlanProgress && (
                                        <IconPlane
                                            className="absolute right-0 transform translate-x-1/2 -translate-y-1/2 fill-current text-theme-highlight"
                                            size={50}
                                            strokeLinejoin="miter"
                                        />
                                    )}
                                </div>
                                <div className="w-full border-dashed bg-theme-text" style={{ width: `${100 - flightPlanProgress}%` }} />
                            </div>
                            <div>
                                <div className={`w-1 ml-auto h-4 ${flightPlanProgress > 99 ? 'bg-theme-highlight' : 'bg-theme-text'}`} />
                                <p className={`text-right font-body ${flightPlanProgress > 99 ? 'text-theme-highlight' : 'text-theme-text'}`}>
                                    {schedInParsed}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex flex-row mb-4">
                            <InformationEntry title="ALTN" info={altIcao} />
                            <div className="my-auto w-2 h-8 bg-theme-text" />
                            <InformationEntry title="CO RTE" info={departingIata + arrivingIata} />
                            <div className="my-auto w-2 h-8 bg-theme-text" />
                            <InformationEntry title="ZFW" info={estimatedZfw} />
                        </div>
                        <div className="my-auto w-full h-0.5 bg-theme-text" />
                        <div className="flex flex-row mt-4">
                            <InformationEntry title="CI" info={avgWind} />
                            <div className="my-auto w-2 h-8 bg-theme-text" />
                            <InformationEntry title="AVG WIND" info={costInd} />
                            <div className="my-auto w-2 h-8 bg-theme-text" />
                            <InformationEntry title="CRZ" info={crzAlt} />
                        </div>
                    </div>
                    <div>
                        <h5 className="text-2xl font-bold">Route</h5>
                        <ScrollableContainer height={15}>
                            <p className="font-mono">
                                {!isInitialData && (
                                    <span className="text-theme-highlight">
                                        {departingAirport}
                                        /
                                        {departingRunway}
                                    </span>
                                )}
                                {' '}
                                {route}
                                {' '}
                                {!isInitialData && (
                                    <span className="text-theme-highlight">
                                        {arrivingAirport}
                                        /
                                        {arrivingRunway}
                                    </span>
                                )}
                            </p>
                        </ScrollableContainer>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        fetchSimbriefDataAction(simbriefUserId ?? '').then((action) => {
                            dispatch(action);
                        }).catch((e) => {
                            toast.error(e.message);
                        });
                    }}
                    className="flex justify-center items-center p-2 space-x-4 w-full rounded-lg border-2 shadow-lg focus:outline-none bg-theme-highlight border-theme-secondary"
                >
                    <CloudArrowDown size={26} />
                    <p>Import Flightplan from SimBrief</p>
                </button>
            </div>
        </div>
    );
};
