import React, { useEffect, useState } from 'react';
import { IconPlane } from '@tabler/icons';
import { FileEarmarkArrowDown } from 'react-bootstrap-icons';
import { usePersistentProperty } from '@instruments/common/persistence';
import { toast } from 'react-toastify';
import { useSimVarValue } from '@instruments/common/simVars';

import { useAppSelector, useAppDispatch } from '../../Store/store';

import { fetchSimbriefDataAction } from '../../Store/features/simBrief';
import { ScrollableContainer } from '../../Components/ScrollableContainer';

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

export const FlightWidget = () => {
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
        arrivingPosLat,
        arrivingPosLong,
        departingAirport,
        departingIata,
        departingName,
        departingPosLat,
        departingPosLong,
        airline,
        route,
        flightNum,
        altIcao,
        costInd,
    } = useAppSelector((state) => state.simbrief.data);
    const dispatch = useAppDispatch();

    const [totalDistance, setTotalDistance] = useState(0);
    const [remainingDistance, setRemainingDistance] = useState(0);

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

    const lat = useSimVarValue('PLANE LATITUDE', 'degree latitude', 2000);
    const long = useSimVarValue('PLANE LONGITUDE', 'degree longitude', 2000);

    useEffect(() => {
        setRemainingDistance(Avionics.Utils.computeGreatCircleDistance(
            { lat, long },
            { lat: arrivingPosLat, long: arrivingPosLong },
        ));
    }, [lat, long, arrivingPosLat, arrivingPosLong]);

    useEffect(() => {
        setTotalDistance(Avionics.Utils.computeGreatCircleDistance(
            { lat: departingPosLat, long: departingPosLong },
            { lat: arrivingPosLat, long: arrivingPosLong },
        ));
    }, [departingPosLat, departingPosLong, arrivingPosLat, arrivingPosLong]);

    const flightPlanProgress = totalDistance ? ((totalDistance - remainingDistance) / totalDistance) * 100 : 0;

    return (
        <div className="overflow-hidden p-6 mr-3 w-2/5 h-full rounded-lg border-2 shadow-md border-theme-accent">
            <div className="flex flex-col justify-between h-full">
                <div className="space-y-8">
                    <div className="flex flex-row justify-between">
                        <div>
                            <p>{(airline.length > 0 ? airline : '') + flightNum}</p>
                            <h1 className="text-4xl font-bold">{departingAirport}</h1>
                            <p className="w-52 text-sm">{departingName}</p>
                        </div>
                        <div>
                            <p className="text-right">A320-251N</p>
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
                                    {!!totalDistance && (
                                        <IconPlane
                                            className="absolute right-0 transform translate-x-1/2 -translate-y-1/2 fill-current text-theme-highlight"
                                            size={50}
                                            strokeLinejoin="miter"
                                        />
                                    )}
                                </div>
                                <div className="w-full bg-white border-dashed" style={{ width: `${100 - flightPlanProgress}%` }} />
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
                        <ScrollableContainer height={15} resizeDependencies={[route]}>
                            <p className="font-mono text-justify">{route}</p>
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
                    <FileEarmarkArrowDown size={26} />
                    <p>Import Flightplan from SimBrief</p>
                </button>
            </div>
        </div>
    );
};
