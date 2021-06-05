import React from 'react';
import { CurrentFlight, Map } from '@flybywiresim/react-components';
import FlightWidget from './Widgets/FlightWidget';
import WeatherWidget from './Widgets/WeatherWidget';
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
    route: string
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
        <div className="flex p-6 w-full">
            <div className="w-4/12 mr-4">
                <h1 className="text-white font-medium mb-4 text-2xl">Today's Flight</h1>

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
                    // @ts-ignore
                    eta={calculateFlightTime(props.flightETAInSeconds)}
                    timeSinceStart={props.timeSinceStart}
                    sta={props.schedIn}
                    std={props.schedOut}
                    fetchSimbrief={props.fetchSimbrief}
                />
            </div>

            <div className="w-3/12">
                <h1 className="text-white font-medium mb-4 text-2xl">Weather</h1>

                <WeatherWidget name="origin" editIcao="yes" icao={props.departingAirport} />
                <WeatherWidget name="dest" editIcao="yes" icao={props.arrivingAirport} />
            </div>

            <div className="w-5/12 ml-4">
                <h1 className="text-white font-medium mb-4 text-2xl">Map</h1>

                <div className="w-full h-map rounded-lg overflow-hidden">
                    <Map currentFlight={handleGettingCurrentFlightData} disableMenu hideOthers />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
