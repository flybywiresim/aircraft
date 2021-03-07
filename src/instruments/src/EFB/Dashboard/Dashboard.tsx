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
import { CurrentFlight, Map } from '@flybywiresim/map';
import { useSimVar } from '../../Common/simVars';

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

const Dashboard: React.FC<DashboardProps> = (props) => {
    const [flightNumber] = useSimVar('ATC FLIGHT NUMBER', 'String', 1_000);
    const [aircraftType] = useSimVar('TITLE', 'String', 1_000);
    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 500);
    const [heading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 500);
    const [latitude] = useSimVar('PLANE LATITUDE', 'degree latitude', 500);
    const [longitude] = useSimVar('PLANE LONGITUDE', 'degree longitude', 500);

    const calculateFlightTime = (flightETAInSeconds: string): string => {
        const timeInMinutes: number = parseInt(flightETAInSeconds) * 0.0166;
        if (timeInMinutes.toString() === 'NaN') {
            return '00:00';
        }

        const hours = (timeInMinutes / 60);
        const roundedHours = Math.floor(hours);
        const minutes = (hours - roundedHours) * 60;
        const roundedMinutes = Math.round(minutes);

        return `${(roundedHours <= 9 ? '0' : '') + roundedHours}:${roundedMinutes <= 9 ? '0' : ''}${roundedMinutes}`;
    };

    const handleGettingCurrentFlightData = (): CurrentFlight => ({
        flightNumber,
        aircraftType,
        altitude,
        heading,
        origin: '',
        destination: '',
        latitude,
        longitude,
    });

    return (
        <div className="w-full">
            <h1 className="text-3xl text-white">Dashboard</h1>
            <div className="flex w-full mt-6 h-efb">
                <FlightWidget
                name="todays"
                airline={props.airline}
                flightNum={props.flightNum}
                aircraftReg={props.aircraftReg}
                dep={props.departingAirport}
                depIata={props.depIata}
                arrIata={props.arrIata}
                arr={props.arrivingAirport}
                route={props.route}
                distance={props.flightDistance}
                eta={calculateFlightTime(props.flightETAInSeconds)}
                timeSinceStart={props.timeSinceStart}
                sta={props.schedIn}
                std={props.schedOut}
                fetchSimbrief={props.fetchSimbrief}
                altIcao={props.altIcao}
                costInd={props.costInd} />

                <div className="flex flex-col w-3/5">
                    <div className="h-2/5 bg-navy-medium rounded-xl ml-3 mb-3 shadow-lg p-6">
                        <div className="h-full rounded-lg overflow-hidden">

                        </div>
                    </div>

                    <div className="h-3/5 ml-3 mt-3 rounded-xl overflow-hidden shadow-lg">
                        <Map currentFlight={handleGettingCurrentFlightData} disableMenu hideOthers />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
