// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { FlightWidget } from './Widgets/FlightWidget';
import { RemindersWidget } from './Widgets/RemindersWidget';
import { WeatherWidget } from './Widgets/WeatherWidget';
import { useAppSelector } from '../Store/store';

export const Dashboard = () => {
    const { departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const { userDepartureIcao, userDestinationIcao } = useAppSelector((state) => state.dashboard);

    return (
        <div className="w-full">
            <h1 className="font-bold">Dashboard</h1>

            <div className="flex mt-4 w-full h-efb">
                <FlightWidget />

                <div className="flex flex-col w-3/5">
                    <div className="p-6 mb-3 ml-3 h-2/5 rounded-lg border-2 border-theme-accent shadow-md">
                        <div className="flex items-center h-full">
                            <div className="w-1/2">
                                <WeatherWidget name="origin" simbriefIcao={departingAirport} userIcao={userDepartureIcao} />
                            </div>
                            <div className="h-60 rounded-full border border-gray-500" />
                            <div className="w-1/2">
                                <WeatherWidget name="destination" simbriefIcao={arrivingAirport} userIcao={userDestinationIcao} />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden p-6 ml-3 h-3/5 rounded-lg border-2 border-theme-accent">
                        <RemindersWidget />
                    </div>
                </div>
            </div>
        </div>
    );
};
