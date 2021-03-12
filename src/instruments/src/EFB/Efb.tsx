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

import React from 'react';

import { Provider } from 'react-redux';
import store from './Store';

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

type EfbState = {
    currentPageIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6,
    simbriefUsername: string,
    departingAirport: string,
    departingIata: string,
    arrivingAirport: string,
    arrivingIata: string,
    flightDistance: string,
    flightETAInSeconds: string,
    currentTime: Date,
    initTime: Date,
    timeSinceStart: string,
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

class Efb extends React.Component<EfbProps, EfbState> {
    constructor(props: EfbProps) {
        super(props);
        this.updateCurrentTime = this.updateCurrentTime.bind(this);
        this.updateTimeSinceStart = this.updateTimeSinceStart.bind(this);
        this.fetchSimbriefData = this.fetchSimbriefData.bind(this);
    }

    state: EfbState = {
        currentPageIndex: 0,
        airline: '---',
        flightNum: '----',
        departingAirport: '----',
        departingIata: '---',
        arrivingAirport: '----',
        arrivingIata: '---',
        aircraftReg: '-----',
        simbriefUsername: this.fetchSimbriefUsername(),
        flightDistance: '---NM',
        route: '---------------------',
        flightETAInSeconds: 'N/A',
        currentTime: new Date(),
        initTime: new Date(),
        timeSinceStart: '00:00',
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
    }

    changeSimbriefUsername = (name: string) => {
        this.setState({ simbriefUsername: name });
        window.localStorage.setItem('SimbriefUsername', name);
    }

    async fetchSimbriefData() {
        if (!this.state.simbriefUsername) {
            return;
        }

        console.log('Fetching simbriefData');
        const simbriefData = await getSimbriefData(this.state.simbriefUsername);
        console.info(simbriefData);
        this.setState({
            airline: simbriefData.airline,
            flightNum: simbriefData.flightNumber,
            departingAirport: simbriefData.origin.icao,
            departingIata: simbriefData.origin.iata,
            arrivingAirport: simbriefData.destination.icao,
            arrivingIata: simbriefData.destination.iata,
            aircraftReg: simbriefData.aircraftReg,
            flightDistance: simbriefData.distance,
            flightETAInSeconds: simbriefData.flightETAInSeconds,
            route: simbriefData.route,
            weights: {
                cargo: simbriefData.weights.cargo,
                estLandingWeight: simbriefData.weights.estLandingWeight,
                estTakeOffWeight: simbriefData.weights.estTakeOffWeight,
                estZeroFuelWeight: simbriefData.weights.estZeroFuelWeight,
                maxLandingWeight: simbriefData.weights.maxLandingWeight,
                maxTakeOffWeight: simbriefData.weights.maxTakeOffWeight,
                maxZeroFuelWeight: simbriefData.weights.maxZeroFuelWeight,
                passengerCount: simbriefData.weights.passengerCount,
                passengerWeight: simbriefData.weights.passengerWeight,
                payload: simbriefData.weights.payload,
            },
            fuels: {
                avgFuelFlow: simbriefData.fuel.avgFuelFlow,
                contingency: simbriefData.fuel.contingency,
                enrouteBurn: simbriefData.fuel.enrouteBurn,
                etops: simbriefData.fuel.etops,
                extra: simbriefData.fuel.extra,
                maxTanks: simbriefData.fuel.maxTanks,
                minTakeOff: simbriefData.fuel.minTakeOff,
                planLanding: simbriefData.fuel.planLanding,
                planRamp: simbriefData.fuel.planRamp,
                planTakeOff: simbriefData.fuel.planTakeOff,
                reserve: simbriefData.fuel.reserve,
                taxi: simbriefData.fuel.taxi,
            },
            units: simbriefData.units,
            altIcao: simbriefData.alternate.icao,
            altIata: simbriefData.alternate.iata,
            altBurn: simbriefData.alternate.burn,
            tripTime: simbriefData.times.est_time_enroute,
            contFuelTime: simbriefData.times.contfuel_time,
            resFuelTime: simbriefData.times.reserve_time,
            taxiOutTime: simbriefData.times.taxi_out,
            schedOut: simbriefData.times.sched_out,
            schedIn: simbriefData.times.sched_in,
            loadsheet: simbriefData.text,
            costInd: simbriefData.costIndex,
        });
    }

    updateCurrentTime(currentTime: Date) {
        this.setState({ currentTime });
    }

    updateTimeSinceStart(timeSinceStart: string) {
        this.setState({ timeSinceStart });
    }

    fetchSimbriefUsername() {
        const username = window.localStorage.getItem('SimbriefUsername');
        if (username === null) {
            return '';
        }
        return username;
    }

    currentPage() {
        let schedInParsed = '--:--';
        let schedOutParsed = '--:--';

        if (this.state.schedIn !== '--:--') {
            const sta = new Date(parseInt(this.state.schedIn) * 1000);
            schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}:${sta.getUTCMinutes().toString().padStart(2, '0')}z`;
        }
        if (this.state.schedOut !== '--:--') {
            const std = new Date(parseInt(this.state.schedOut) * 1000);
            schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}:${std.getUTCMinutes().toString().padStart(2, '0')}z`;
        }

        switch (this.state.currentPageIndex) {
        case 1:
            return (
                <Dispatch
                    loadsheet={this.state.loadsheet}
                    weights={this.state.weights}
                    fuels={this.state.fuels}
                    units={this.state.units}
                    arrivingAirport={this.state.arrivingAirport}
                    arrivingIata={this.state.arrivingIata}
                    departingAirport={this.state.departingAirport}
                    departingIata={this.state.departingIata}
                    altBurn={this.state.altBurn}
                    altIcao={this.state.altIcao}
                    altIata={this.state.altIata}
                    tripTime={this.state.tripTime}
                    contFuelTime={this.state.contFuelTime}
                    resFuelTime={this.state.resFuelTime}
                    taxiOutTime={this.state.taxiOutTime}
                />
            );
        case 2:
            return <Ground />;
        case 3:
            return <Company simbriefUsername={this.state.simbriefUsername} changeSimbriefUsername={this.changeSimbriefUsername} />;
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
                    fetchSimbrief={this.fetchSimbriefData}
                    currentFlight={this.props.currentFlight}
                    airline={this.state.airline}
                    flightNum={this.state.flightNum}
                    aircraftReg={this.state.aircraftReg}
                    departingAirport={this.state.departingAirport}
                    arrivingAirport={this.state.arrivingAirport}
                    flightDistance={this.state.flightDistance}
                    flightETAInSeconds={this.state.flightETAInSeconds}
                    timeSinceStart={this.state.timeSinceStart}
                    route={this.state.route}
                    depIata={this.state.departingIata}
                    arrIata={this.state.arrivingIata}
                    schedIn={schedInParsed}
                    schedOut={schedOutParsed}
                    altIcao={this.state.altIcao}
                    costInd={this.state.costInd}
                />
            );
        }
    }

    render() {
        return (
            <Provider store={store}>
                <div className="flex flex-col">
                    <StatusBar initTime={this.state.initTime} updateCurrentTime={this.updateCurrentTime} updateTimeSinceStart={this.updateTimeSinceStart} />
                    <div className="flex flex-row">
                        <ToolBar setPageIndex={(index) => this.setState({ currentPageIndex: index })} />
                        <div className="py-16 px-8 text-gray-700 bg-navy-regular h-screen w-screen">
                            {this.currentPage()}
                        </div>
                    </div>
                </div>
            </Provider>
        );
    }
}

export default Efb;
