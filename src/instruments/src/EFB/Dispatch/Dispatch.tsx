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
    currentPageIndex: number
};

class Dispatch extends React.Component<DispatchProps, DispatchState> {
    constructor(props: DispatchProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    currentPage() {
        switch (this.state.currentPageIndex) {
            case 1:
                return <LoadsheetPage
                    loadsheet={this.props.loadsheet} />;
            case 2:
                return <h1>Page 2</h1>;
            case 3:
                return <h1>Page 3</h1>;
            case 4:
                return <h1>Page 4</h1>;
            default:
                return <OverviewPage
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
                    taxiOutTime={this.props.taxiOutTime} />;
        }
    }

    tabs = [
        { id: 0, name: 'Overview', link: 'dashboard'},
        { id: 1, name: 'Loadsheet', link: 'dispatch'},
        { id: 2, name: 'Fuel', link: 'flight' },
        { id: 3, name: 'Payload', link: 'ground'}
    ];

    state: DispatchState = {
        activeIndex: this.indexInit(),
        currentPageIndex: 0
    };

    indexInit(): number {
        const url = window.location.pathname;
        let index = 0;
        this.tabs.map((tab) => {
            if (("/" + tab.link) === url) {
                index = tab.id;
            } else if (url === "/") {
                index = 0;
            }
        });
        return index;
    }

    handleClick(index: number) {
        return (() => {
            this.setState({activeIndex: index});
            this.setState({currentPageIndex: index});
        });
    }

    render() {
        return (
            <div>
                <nav className="bg-none">
                    <div className="flex justify-between p-6">
                        <div className="flex-1 flex items-center justify-start">
                            <div className="flex space-x-4 text-xl">
                                {
                                    this.tabs.map((tab) =>
                                        <a className={tab.id === this.state.activeIndex ? 'border-b-2 border-t-0 border-r-0 border-l-0 text-white px-3 pb-2 font-medium' : 'text-white px-3 pb-2 font-medium'} key={tab.id} onClick={this.handleClick(tab.id)}>
                                            {tab.name}
                                        </a>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </nav>
                <div>
                    {this.currentPage()}
                </div>
            </div>
        );
    }
}

export default Dispatch;