import React from 'react';
import {
    IconPlane,
    IconPlaneDeparture,
    IconPlaneArrival,
} from '@tabler/icons';
import { FileEarmarkArrowDown } from 'react-bootstrap-icons';
import { usePersistentProperty } from '@instruments/common/persistence';
import fuselage from '../../Assets/320neo-outline-nose.svg';

import { useAppSelector, useAppDispatch } from '../../Store/store';

import { fetchSimbriefDataAction } from '../../Store/features/simBrief';
import { useUIMessages } from '../../UIMessages/Provider';
import { Notification } from '../../UIMessages/Notification';

const FlightWidget = () => {
    const uiMessages = useUIMessages();

    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const simbriefData = useAppSelector((state) => state.simbrief.data);
    const dispatch = useAppDispatch();

    let schedInParsed = '--:--';
    let schedOutParsed = '--:--';
    let crzAlt = '-----';
    let avgWind = '---/---';
    let estimatedZfw = '--.-';

    if (simbriefData.schedIn !== '--:--') {
        const sta = new Date(parseInt(simbriefData.schedIn) * 1000);
        schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}:${sta.getUTCMinutes().toString().padStart(2, '0')}z`;
    }

    if (simbriefData.schedOut !== '--:--') {
        const std = new Date(parseInt(simbriefData.schedOut) * 1000);
        schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}:${std.getUTCMinutes().toString().padStart(2, '0')}z`;
    }

    if (simbriefData.cruiseAltitude !== 0) {
        const flightLevel = (simbriefData.cruiseAltitude / 100);
        crzAlt = `FL${flightLevel}`;
    }

    if (simbriefData.weather.avgWindDir !== '---' && simbriefData.weather.avgWindSpeed !== '---') {
        avgWind = `${simbriefData.weather.avgWindDir}/${simbriefData.weather.avgWindSpeed}`;
    }

    if (simbriefData.weights.estZeroFuelWeight !== 0) {
        const eZfwUnround = simbriefData.weights.estZeroFuelWeight / 100;
        const eZfw = Math.round(eZfwUnround) / 10;
        estimatedZfw = `${eZfw}`;
    }

    return (
        <div className="overflow-hidden p-6 mr-3 w-2/5 h-full rounded-lg border-2 shadow-md border-theme-secondary">
            <div className="flex flex-col justify-between h-full">
                <div className="w-full">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-medium">{(simbriefData.airline.length > 0 ? simbriefData.airline : '') + simbriefData.flightNum}</h1>
                        <span className="text-lg">{simbriefData.aircraftReg}</span>
                        {' '}
                        <br />
                        <span className="text-lg">A320-251N</span>
                    </div>

                    <div className="flex justify-center items-center mb-6 text-lg">
                        [
                        {simbriefData.departingIata}
                        ]
                        {' '}
                        <span className="mx-3 text-3xl">{simbriefData.departingAirport}</span>
                        <IconPlane size={35} stroke={1.5} strokeLinejoin="miter" />
                        <span className="mx-3 text-3xl">{simbriefData.arrivingAirport}</span>
                        {' '}
                        [
                        {simbriefData.arrivingIata}
                        ]
                    </div>

                    <div className="flex">
                        <div className="mr-4 w-1/2">
                            <div className="flex justify-end text-lg">
                                STD
                                {' '}
                                <IconPlaneDeparture className="ml-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                            </div>
                            <div className="mt-1 text-2xl text-right">{schedOutParsed}</div>
                        </div>
                        <div className="ml-4 w-1/2">
                            <div className="flex justify-start text-lg">
                                <IconPlaneArrival className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                STA
                            </div>
                            <div className="mt-1 text-2xl text-left">{schedInParsed}</div>
                        </div>
                    </div>
                </div>
                <div className="my-3 w-full">
                    <img src={fuselage} alt="Aircraft outline" className="-ml-48 flip-horizontal" />
                </div>
                <div className="mt-3 w-full">
                    <div className="grid grid-cols-3 gap-4 mb-10 text-center">
                        <div className="mb-3">
                            <h3 className="text-xl font-medium">ALTN</h3>
                            <span className="font-mono text-lg font-light">{simbriefData.altIcao}</span>
                        </div>
                        <div className="mb-3">
                            <h3 className="text-xl font-medium">CO RTE</h3>
                            <span className="font-mono text-lg font-light">{simbriefData.departingIata + simbriefData.arrivingIata}</span>
                        </div>
                        <div className="mb-3">
                            <h3 className="text-xl font-medium">ZFW</h3>
                            <span className="font-mono text-lg font-light">{estimatedZfw}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium">AVG WIND</h3>
                            <span className="font-mono text-lg font-light">{avgWind}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium">CI</h3>
                            <span className="font-mono text-lg font-light">{simbriefData.costInd}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-medium">CRZ</h3>
                            <span className="font-mono text-lg font-light">{crzAlt}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            fetchSimbriefDataAction(simbriefUserId ?? '').then((action) => {
                                dispatch(action);
                            }).catch(() => {
                                uiMessages.pushNotification(
                                    <Notification
                                        type="ERROR"
                                        title="SimBrief Error"
                                        message="An error occurred when trying to fetch your SimBrief data."
                                    />,
                                );
                            });
                        }}
                        className="flex justify-center items-center p-2 space-x-4 w-full rounded-lg border-2 shadow-lg focus:outline-none bg-theme-highlight border-theme-secondary"
                    >
                        <FileEarmarkArrowDown size={26} />
                        <p>Import Flightplan from SimBrief</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlightWidget;
