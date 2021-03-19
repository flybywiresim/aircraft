/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useState } from 'react';

import { Provider } from 'react-redux';
import store from './Store';

import NavigraphClient, { NavigraphContext } from './ChartsApi/Navigraph';

import { getSimbriefData, IFuel, IWeights } from './SimbriefApi';
import StatusBar from './StatusBar/StatusBar';
import ToolBar from './ToolBar/ToolBar';
import Dashboard from './Dashboard/Dashboard';
import Dispatch from './Dispatch/Dispatch';
import Ground from './Ground/Ground';
import Company from './Company/Company';
import Navigation from './Navigation/Navigation';
import Settings from './Settings/Settings';

type EfbProps = {
    currentFlight: string
};

type TimeState = {
    currentTime: Date,
    initTime: Date,
    timeSinceStart: string,
}

type SimbriefData = {
    departingAirport: string,
    departingIata: string,
    arrivingAirport: string,
    arrivingIata: string,
    flightDistance: string,
    flightETAInSeconds: string,
    weights: IWeights,
    fuels: IFuel,
    units: string,
    altIcao: string,
    altIata: string,
    altBurn: number,
    tripTime: number,
    contFuelTime: number,
    resFuelTime: number,
    taxiOutTime: number,
    schedOut: string,
    schedIn: string,
    airline: string,
    flightNum: string,
    aircraftReg: string,
    route: string,
    loadsheet: string,
    costInd: string
};

const emptySimbriefData: SimbriefData = {
    airline: '---',
    flightNum: '----',
    departingAirport: '----',
    departingIata: '---',
    arrivingAirport: '----',
    arrivingIata: '---',
    aircraftReg: '-----',
    flightDistance: '---NM',
    route: '---------------------',
    flightETAInSeconds: 'N/A',
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

const Efb = (props: EfbProps) => {
    const [navigraph] = useState(() => new NavigraphClient());
    const [simbriefData, setSimbriefData] = useState<SimbriefData>(emptySimbriefData);

    const fetchSimbriefUsername = (): string => {
        const username = window.localStorage.getItem('SimbriefUsername');
        if (username === null) {
            return '';
        }
        return username;
    };

    const [simbriefUsername, setSimbriefUsername] = useState<string>(fetchSimbriefUsername());
    const [timeState, setTimeState] = useState<TimeState>({
        currentTime: new Date(),
        initTime: new Date(),
        timeSinceStart: '00:00',
    });
    const [currentPageIndex, setCurrentPageIndex] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);

    const changeSimbriefUsername = (name: string) => {
        setSimbriefUsername(name);
        window.localStorage.setItem('SimbriefUsername', name);
    };

    const fetchSimbriefData = async () => {
        if (!simbriefUsername) {
            return;
        }

        console.log('Fetching simbriefData');
        const returnedSimbriefData = await getSimbriefData(simbriefUsername);
        console.info(returnedSimbriefData);
        setSimbriefData({
            airline: simbriefData.airline,
            flightNum: returnedSimbriefData.flightNumber,
            departingAirport: returnedSimbriefData.origin.icao,
            departingIata: returnedSimbriefData.origin.iata,
            arrivingAirport: returnedSimbriefData.destination.icao,
            arrivingIata: returnedSimbriefData.destination.iata,
            aircraftReg: returnedSimbriefData.aircraftReg,
            flightDistance: returnedSimbriefData.distance,
            flightETAInSeconds: returnedSimbriefData.flightETAInSeconds,
            route: returnedSimbriefData.route,
            weights: {
                cargo: returnedSimbriefData.weights.cargo,
                estLandingWeight: returnedSimbriefData.weights.estLandingWeight,
                estTakeOffWeight: returnedSimbriefData.weights.estTakeOffWeight,
                estZeroFuelWeight: returnedSimbriefData.weights.estZeroFuelWeight,
                maxLandingWeight: returnedSimbriefData.weights.maxLandingWeight,
                maxTakeOffWeight: returnedSimbriefData.weights.maxTakeOffWeight,
                maxZeroFuelWeight: returnedSimbriefData.weights.maxZeroFuelWeight,
                passengerCount: returnedSimbriefData.weights.passengerCount,
                passengerWeight: returnedSimbriefData.weights.passengerWeight,
                payload: returnedSimbriefData.weights.payload,
            },
            fuels: {
                avgFuelFlow: returnedSimbriefData.fuel.avgFuelFlow,
                contingency: returnedSimbriefData.fuel.contingency,
                enrouteBurn: returnedSimbriefData.fuel.enrouteBurn,
                etops: returnedSimbriefData.fuel.etops,
                extra: returnedSimbriefData.fuel.extra,
                maxTanks: returnedSimbriefData.fuel.maxTanks,
                minTakeOff: returnedSimbriefData.fuel.minTakeOff,
                planLanding: returnedSimbriefData.fuel.planLanding,
                planRamp: returnedSimbriefData.fuel.planRamp,
                planTakeOff: returnedSimbriefData.fuel.planTakeOff,
                reserve: returnedSimbriefData.fuel.reserve,
                taxi: returnedSimbriefData.fuel.taxi,
            },
            units: returnedSimbriefData.units,
            altIcao: returnedSimbriefData.alternate.icao,
            altIata: returnedSimbriefData.alternate.iata,
            altBurn: returnedSimbriefData.alternate.burn,
            tripTime: returnedSimbriefData.times.estTimeEnroute,
            contFuelTime: returnedSimbriefData.times.contFuelTime,
            resFuelTime: returnedSimbriefData.times.reserveTime,
            taxiOutTime: returnedSimbriefData.times.taxiOut,
            schedOut: returnedSimbriefData.times.schedOut,
            schedIn: returnedSimbriefData.times.schedIn,
            loadsheet: returnedSimbriefData.text,
            costInd: returnedSimbriefData.costIndex,
        });
    };

    const updateCurrentTime = (currentTime: Date) => {
        setTimeState({ ...timeState, currentTime });
    };

    const updateTimeSinceStart = (timeSinceStart: string) => {
        setTimeState({ ...timeState, timeSinceStart });
    };

    const currentPage = () => {
        let schedInParsed = '--:--';
        let schedOutParsed = '--:--';

        if (simbriefData.schedIn !== '--:--') {
            const sta = new Date(parseInt(simbriefData.schedIn) * 1000);
            schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}:${sta.getUTCMinutes().toString().padStart(2, '0')}z`;
        }
        if (simbriefData.schedOut !== '--:--') {
            const std = new Date(parseInt(simbriefData.schedOut) * 1000);
            schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}:${std.getUTCMinutes().toString().padStart(2, '0')}z`;
        }

        switch (currentPageIndex) {
        case 1:
            return (
                <Dispatch
                    loadsheet={simbriefData.loadsheet}
                    weights={simbriefData.weights}
                    fuels={simbriefData.fuels}
                    units={simbriefData.units}
                    arrivingAirport={simbriefData.arrivingAirport}
                    arrivingIata={simbriefData.arrivingIata}
                    departingAirport={simbriefData.departingAirport}
                    departingIata={simbriefData.departingIata}
                    altBurn={simbriefData.altBurn}
                    altIcao={simbriefData.altIcao}
                    altIata={simbriefData.altIata}
                    tripTime={simbriefData.tripTime}
                    contFuelTime={simbriefData.contFuelTime}
                    resFuelTime={simbriefData.resFuelTime}
                    taxiOutTime={simbriefData.taxiOutTime}
                />
            );
        case 2:
            return <Ground />;
        case 3:
            return <Company simbriefUsername={simbriefUsername} changeSimbriefUsername={changeSimbriefUsername} />;
        case 4:
            return <Navigation />;
        case 5:
            return (
                <div className="w-full h-full">
                    <p className="text-white font-medium mt-6 ml-4 text-3xl">Inop.</p>
                </div>
            );
        case 6:
            return <Settings />;
        default:
            return (
                <Dashboard
                    fetchSimbrief={fetchSimbriefData}
                    currentFlight={props.currentFlight}
                    airline={simbriefData.airline}
                    flightNum={simbriefData.flightNum}
                    aircraftReg={simbriefData.aircraftReg}
                    departingAirport={simbriefData.departingAirport}
                    arrivingAirport={simbriefData.arrivingAirport}
                    flightDistance={simbriefData.flightDistance}
                    flightETAInSeconds={simbriefData.flightETAInSeconds}
                    timeSinceStart={timeState.timeSinceStart}
                    route={simbriefData.route}
                    depIata={simbriefData.departingIata}
                    arrIata={simbriefData.arrivingIata}
                    schedIn={schedInParsed}
                    schedOut={schedOutParsed}
                    altIcao={simbriefData.altIcao}
                    costInd={simbriefData.costInd}
                />
            );
        }
    };

    return (
        <Provider store={store}>
            <NavigraphContext.Provider value={navigraph}>
                <div className="flex flex-col">
                    <StatusBar initTime={timeState.initTime} updateCurrentTime={updateCurrentTime} updateTimeSinceStart={updateTimeSinceStart} />
                    <div className="flex flex-row">
                        <ToolBar setPageIndex={(index) => setCurrentPageIndex(index)} />
                        <div className="py-16 px-8 text-gray-700 bg-navy-regular h-screen w-screen">
                            {currentPage()}
                        </div>
                    </div>
                </div>
            </NavigraphContext.Provider>
        </Provider>
    );
};

export default Efb;
