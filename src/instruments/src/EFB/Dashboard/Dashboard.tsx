import React from 'react';
import { CurrentFlight, Map } from '@flybywiresim/react-components';
import FlightWidget from './Widgets/FlightWidget';
import { useSimVar } from '../../Common/simVars';
import WeatherWidget from './Widgets/WeatherWidget';
import { SimbriefData } from '../Efb';

type DashboardProps = {
    simbriefData: SimbriefData,
    fetchSimbrief: Function,
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const [flightNumber] = useSimVar('ATC FLIGHT NUMBER', 'String', 1_000);
    const [aircraftType] = useSimVar('TITLE', 'String', 1_000);
    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 500);
    const [heading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 500);
    const [latitude] = useSimVar('PLANE LATITUDE', 'degree latitude', 500);
    const [longitude] = useSimVar('PLANE LONGITUDE', 'degree longitude', 500);

    const getCurrentFlightData = (): CurrentFlight => ({
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
            <h1 className="text-3xl pt-6 text-white">Dashboard</h1>
            <div className="flex w-full mt-6 h-efb">
                <FlightWidget
                    simbriefData={props.simbriefData}
                    fetchSimbrief={props.fetchSimbrief}
                />

                <div className="flex flex-col w-3/5">
                    <div className="h-2/5 bg-navy-lighter rounded-2xl ml-3 mb-3 shadow-lg p-6">
                        <div className="h-full flex items-center">
                            <div className="w-1/2">
                                <WeatherWidget name="origin" editIcao="yes" icao={props.simbriefData.departingAirport} />
                            </div>
                            <div className="border border-gray-500 rounded-full h-48" />
                            <div className="w-1/2">
                                <WeatherWidget name="origin" editIcao="yes" icao={props.simbriefData.arrivingAirport} />
                            </div>
                        </div>
                    </div>

                    <div className="h-3/5 ml-3 mt-3 rounded-2xl shadow-lg">
                        <Map currentFlight={getCurrentFlightData} forceTileset="carto-dark" disableMenu hideOthers />
                        <small className="font-mono text-xs text-white opacity-40 block text-right mr-1">Leaflet OpenStreetMap CartoDB &copy;</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
