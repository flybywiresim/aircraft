import React from 'react';
import FlightWidget from './Widgets/FlightWidget';
import WeatherWidget from './Widgets/WeatherWidget';
import { SimbriefData } from '../Efb';

type DashboardProps = {
    simbriefData: SimbriefData,
    fetchSimbrief: Function,
}

const Dashboard = ({ simbriefData, fetchSimbrief }: DashboardProps) => (
    <div className="w-full">
        <h1 className="text-white">Dashboard</h1>
        <div className="flex w-full mt-4 h-efb">
            <FlightWidget
                simbriefData={simbriefData}
                fetchSimbrief={fetchSimbrief}
            />
            <div className="flex flex-col w-3/5">
                <div className="h-2/5 bg-navy-lighter rounded-lg ml-3 mb-3 p-6">
                    <div className="h-full flex items-center">
                        <div className="w-1/2">
                            <WeatherWidget name="origin" editIcao="yes" icao={simbriefData.departingAirport} />
                        </div>
                        <div className="border border-gray-500 rounded-full h-48" />
                        <div className="w-1/2">
                            <WeatherWidget name="origin" editIcao="yes" icao={simbriefData.arrivingAirport} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default Dashboard;
