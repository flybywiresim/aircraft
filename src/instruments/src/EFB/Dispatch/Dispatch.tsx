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

import OverviewPage from './Pages/OverviewPage';
import LoadsheetPage from './Pages/LoadsheetPage';
import { Navbar } from '../Components/Navbar';

type DispatchProps = {
    loadsheet: string,
    weights: {
        cargo: number,
        estLandingWeight: number,
        estTakeOffWeight: number,
        estZeroFuelWeight: number,
        maxLandingWeight: number,
        maxTakeOffWeight: number,
        maxZeroFuelWeight: number,
        passengerCount: number,
        passengerWeight: number,
        payload: number,
    },
    fuels: {
        avgFuelFlow: number,
        contingency: number,
        enrouteBurn: number,
        etops: number,
        extra: number,
        maxTanks: number,
        minTakeOff: number,
        planLanding: number,
        planRamp: number,
        planTakeOff: number,
        reserve: number,
        taxi: number,
    },
    units: string,
    arrivingAirport: string,
    arrivingIata: string,
    departingAirport: string,
    departingIata: string,
    altBurn: number,
    altIcao: string,
    altIata: string,
    tripTime: number,
    contFuelTime: number,
    resFuelTime: number,
    taxiOutTime: number,
};

type DispatchState = {
    activeIndex: number,
};

class Dispatch extends React.Component<DispatchProps, DispatchState> {
    tabs = [
        'Overview',
        'Loadsheet',
        'Fuel',
        'Payload',
    ];

    constructor(props: DispatchProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.state = {
            activeIndex: 0,
        };
    }

    handleClick(index: number) {
        this.setState({ activeIndex: index });
    }

    currentPage() {
        switch (this.state.activeIndex) {
        case 1:
            return (
                <LoadsheetPage loadsheet={this.props.loadsheet} />
            );
        case 2:
            return (
                <div className="w-full h-full">
                    <p className="text-white font-medium mt-6 ml-4 text-3xl">Inop.</p>
                </div>
            );
        case 3:
            return (
                <div className="w-full h-full">
                    <p className="text-white font-medium mt-6 ml-4 text-3xl">Inop.</p>
                </div>
            );
        case 4:
            return (
                <div className="w-full h-full">
                    <p className="text-white font-medium mt-6 ml-4 text-3xl">Inop.</p>
                </div>
            );
        default:
            return (
                <OverviewPage
                    weights={this.props.weights}
                    fuels={this.props.fuels}
                    units={this.props.units}
                    arrivingAirport={this.props.arrivingAirport}
                    arrivingIata={this.props.arrivingIata}
                    departingAirport={this.props.departingAirport}
                    departingIata={this.props.departingIata}
                    altBurn={this.props.altBurn}
                    altIcao={this.props.altIcao}
                    altIata={this.props.altIata}
                    tripTime={this.props.tripTime}
                    contFuelTime={this.props.contFuelTime}
                    resFuelTime={this.props.resFuelTime}
                    taxiOutTime={this.props.taxiOutTime}
                />
            );
        }
    }

    render() {
        return (
            <div className="w-full">
                <Navbar tabs={this.tabs} onSelected={(index) => this.handleClick(index)} />
                <div>
                    {this.currentPage()}
                </div>
            </div>
        );
    }
}

export default Dispatch;
