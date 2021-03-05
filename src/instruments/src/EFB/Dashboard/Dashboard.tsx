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
import FlightWidget from "./Widgets/FlightWidget";
import WeatherWidget from "./Widgets/WeatherWidget";

type DashboardProps = {
    currentFlight: string,
    airline: string,
    flightNum: string,
    aircraftReg: string,
    departingAirport: string,
    depIata: string,
    arrivingAirport: string,
    arrIata: string,
    flightDistance: string,
    flightETAInSeconds: string,
    timeSinceStart: string,
    schedOut: string,
    schedIn: string,
    fetchSimbrief: Function,
    route: string,
    altIcao: string,
    costInd: string
}

type DashboardState = {}

class Dashboard extends React.Component<DashboardProps, DashboardState> {

    calculateFlightTime(flightETAInSeconds: string): string {
        const timeInMinutes: number = parseInt(flightETAInSeconds) * 0.0166;
        if (timeInMinutes.toString() === "NaN") {
            return "00:00";
        }

        const hours = (timeInMinutes / 60);
        const roundedHours = Math.floor(hours);
        const minutes = (hours - roundedHours) * 60;
        const roundedMinutes = Math.round(minutes);

        return (roundedHours <= 9 ? "0" : "") + roundedHours + ":" + (roundedMinutes <= 9 ? "0" : "") + roundedMinutes;
    }

    render() {
        return (
            <div className="w-full">
                <h1 className="text-3xl text-white">Dashboard</h1>
                <div className="flex w-full mt-6">

                    <FlightWidget
                    name="todays"
                    airline={this.props.airline}
                    flightNum={this.props.flightNum}
                    aircraftReg={this.props.aircraftReg}
                    dep={this.props.departingAirport}
                    depIata={this.props.depIata}
                    arrIata={this.props.arrIata}
                    arr={this.props.arrivingAirport}
                    route={this.props.route}
                    distance={this.props.flightDistance}
                    eta={this.calculateFlightTime(this.props.flightETAInSeconds)}
                    timeSinceStart={this.props.timeSinceStart}
                    sta={this.props.schedIn}
                    std={this.props.schedOut}
                    fetchSimbrief={this.props.fetchSimbrief}
                    altIcao={this.props.altIcao}
                    costInd={this.props.costInd} />

                    <div className="w-3/5 h-efb bg-blue-default rounded-xl ml-3 shadow-lg">

                    </div>
                </div>
            </div>
        );
    }
}

export default Dashboard;
