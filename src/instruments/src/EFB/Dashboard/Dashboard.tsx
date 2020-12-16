/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
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
import Map from "@flybywiresim/map";

type DashboardWidgetProps = {
    airline: string,
    flightNum: string,
    aircraftReg: string,
    departingAirport: string,
    arrivingAirport: string,
    flightDistance: string,
    flightETAInSeconds: string,
    timeSinceStart: string,
    schedOut: string,
    schedIn: string
}

type DashboardWidgetState = {}

class DashboardWidget extends React.Component<DashboardWidgetProps, DashboardWidgetState> {

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
            <div className="dashboard">
                <span id='title-todays-flight' className="widget-title">Today's Flight</span>
                <span id='title-wx' className="widget-title">Weather</span>
                <span id='title-map' className="widget-title">Map</span>

                <FlightWidget
                    name="todays"
                    airline={this.props.airline}
                    flightNum={this.props.flightNum}
                    aircraftReg={this.props.aircraftReg}
                    dep={this.props.departingAirport}
                    arr={this.props.arrivingAirport}
                    elapsedTime="00:49"
                    distance={this.props.flightDistance}
                    eta={this.calculateFlightTime(this.props.flightETAInSeconds)}
                    timeSinceStart={this.props.timeSinceStart}
                    sta={this.props.schedIn}
                    std={this.props.schedOut} />

                <WeatherWidget name='origin' editIcao="yes" icao={this.props.departingAirport} />
                <WeatherWidget name='dest' editIcao="yes" icao={this.props.arrivingAirport} />

                <div className="map-widget">
                    <Map class="map" currentFlight="" disableSearch={true} disableInfo={true} disableFlights={true} />
                </div>
            </div>
        );
    }
}

export default DashboardWidget;
