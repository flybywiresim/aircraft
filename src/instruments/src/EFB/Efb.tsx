import React, { useEffect, useState, useReducer } from 'react';

import { Provider } from 'react-redux';
import { Route, Switch, useHistory } from 'react-router-dom';
import { useSimVar } from '@instruments/common/simVars';
import { usePersistentNumberProperty, usePersistentProperty } from '../Common/persistence';
import NavigraphClient, { NavigraphContext } from './ChartsApi/Navigraph';
import { getSimbriefData, IFuel, IWeights } from './SimbriefApi';
import StatusBar from './StatusBar/StatusBar';
import ToolBar from './ToolBar/ToolBar';
import Dashboard from './Dashboard/Dashboard';
import Dispatch from './Dispatch/Dispatch';
import Ground from './Ground/Ground';
import Performance from './Performance/Performance';
import Navigation from './Navigation/Navigation';
import Settings from './Settings/Settings';

import { PerformanceContext, PerformanceReducer, performanceInitialState } from './Store/performance-context';
import store from './Store';
import ATC from './ATC/ATC';
import { Failures } from './Failures/Failures';

type TimeState = {
    currentTime: Date,
    initTime: Date,
    timeSinceStart: string,
}

export type SimbriefData = {
    departingAirport: string,
    departingIata: string,
    arrivingAirport: string,
    arrivingIata: string,
    flightDistance: string,
    flightETAInSeconds: string,
    cruiseAltitude: number,
    weights: IWeights,
    fuels: IFuel,
    weather: {
        avgWindDir: string,
        avgWindSpeed: string,
    }
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

const emptySimbriefData: SimbriefData = {
    airline: '---',
    flightNum: '----',
    departingAirport: '----',
    departingIata: '---',
    arrivingAirport: '----',
    arrivingIata: '---',
    aircraftReg: '-----',
    flightDistance: '---NM',
    route: '---------------------',
    flightETAInSeconds: 'N/A',
    cruiseAltitude: 0,
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
    weather: {
        avgWindDir: '---',
        avgWindSpeed: '---',
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
};

const navigraph = new NavigraphClient();

const Efb = () => {
    const history = useHistory();

    const [currentLocalTime] = useSimVar('E:LOCAL TIME', 'seconds', 3000);
    const [, setBrightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number');
    const [brightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [usingAutobrightness] = useSimVar('L:A32NX_EFB_USING_AUTOBRIGHTNESS', 'bool', 5000);

    // handle setting brightness if user is using autobrightness
    useEffect(() => {
        if (usingAutobrightness) {
            const localTime = currentLocalTime / 3600;
            // the below code defines a semicircular function.
            // eslint-disable-next-line no-restricted-properties
            setBrightness(((Math.sqrt(48 - Math.pow((localTime - 14), 2))) * 14.431) || 0);
        } else {
            setBrightness(brightnessSetting);
        }
    }, [currentLocalTime, usingAutobrightness]);

    const [performanceState, performanceDispatch] = useReducer(PerformanceReducer, performanceInitialState);
    const [simbriefData, setSimbriefData] = useState<SimbriefData>(emptySimbriefData);
    const [simbriefUsername, setSimbriefUsername] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');

    const [timeState, setTimeState] = useState<TimeState>({
        currentTime: new Date(),
        initTime: new Date(),
        timeSinceStart: '00:00',
    });
    const [currentPageIndex, setCurrentPageIndex] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>(0);

    useEffect(() => {
        switch (currentPageIndex) {
        case 1:
            history.push('/dispatch');
            break;
        case 2:
            history.push('/ground');
            break;
        case 3:
            history.push('/performance');
            break;
        case 4:
            history.push('/navigation');
            break;
        case 5:
            history.push('/atc');
            break;
        case 6:
            history.push('/settings');
            break;
        case 7:
            history.push('/failures');
            break;
        default:
            history.push('/dashboard');
            break;
        }
    }, [currentPageIndex]);

    const fetchSimbriefData = async () => {
        if (!simbriefUsername) {
            return;
        }

        const returnedSimbriefData = await getSimbriefData(simbriefUsername);
        setSimbriefData({
            airline: returnedSimbriefData.airline,
            flightNum: returnedSimbriefData.flightNumber,
            departingAirport: returnedSimbriefData.origin.icao,
            departingIata: returnedSimbriefData.origin.iata,
            arrivingAirport: returnedSimbriefData.destination.icao,
            arrivingIata: returnedSimbriefData.destination.iata,
            aircraftReg: returnedSimbriefData.aircraftReg,
            flightDistance: returnedSimbriefData.distance,
            flightETAInSeconds: returnedSimbriefData.flightETAInSeconds,
            cruiseAltitude: returnedSimbriefData.cruiseAltitude,
            route: returnedSimbriefData.route,
            weights: {
                cargo: returnedSimbriefData.weights.cargo,
                estLandingWeight: returnedSimbriefData.weights.estLandingWeight,
                estTakeOffWeight: returnedSimbriefData.weights.estTakeOffWeight,
                estZeroFuelWeight: returnedSimbriefData.weights.estZeroFuelWeight,
                maxLandingWeight: returnedSimbriefData.weights.maxLandingWeight,
                maxTakeOffWeight: returnedSimbriefData.weights.maxTakeOffWeight,
                maxZeroFuelWeight: returnedSimbriefData.weights.maxZeroFuelWeight,
                passengerCount: returnedSimbriefData.weights.passengerCount,
                passengerWeight: returnedSimbriefData.weights.passengerWeight,
                payload: returnedSimbriefData.weights.payload,
            },
            fuels: {
                avgFuelFlow: returnedSimbriefData.fuel.avgFuelFlow,
                contingency: returnedSimbriefData.fuel.contingency,
                enrouteBurn: returnedSimbriefData.fuel.enrouteBurn,
                etops: returnedSimbriefData.fuel.etops,
                extra: returnedSimbriefData.fuel.extra,
                maxTanks: returnedSimbriefData.fuel.maxTanks,
                minTakeOff: returnedSimbriefData.fuel.minTakeOff,
                planLanding: returnedSimbriefData.fuel.planLanding,
                planRamp: returnedSimbriefData.fuel.planRamp,
                planTakeOff: returnedSimbriefData.fuel.planTakeOff,
                reserve: returnedSimbriefData.fuel.reserve,
                taxi: returnedSimbriefData.fuel.taxi,
            },
            weather: {
                avgWindDir: returnedSimbriefData.weather.avgWindDir.toString(),
                avgWindSpeed: returnedSimbriefData.weather.avgWindSpeed.toString(),
            },
            units: returnedSimbriefData.units,
            altIcao: returnedSimbriefData.alternate.icao,
            altIata: returnedSimbriefData.alternate.iata,
            altBurn: returnedSimbriefData.alternate.burn,
            tripTime: returnedSimbriefData.times.estTimeEnroute,
            contFuelTime: returnedSimbriefData.times.contFuelTime,
            resFuelTime: returnedSimbriefData.times.reserveTime,
            taxiOutTime: returnedSimbriefData.times.taxiOut,
            schedOut: returnedSimbriefData.times.schedOut,
            schedIn: returnedSimbriefData.times.schedIn,
            loadsheet: returnedSimbriefData.text,
            costInd: returnedSimbriefData.costIndex,
        });
    };

    const updateCurrentTime = (currentTime: Date) => {
        setTimeState({ ...timeState, currentTime });
    };

    const updateTimeSinceStart = (timeSinceStart: string) => {
        setTimeState({ ...timeState, timeSinceStart });
    };

    return (
        <Provider store={store}>
            <PerformanceContext.Provider value={{ performanceState, performanceDispatch }}>
                <NavigraphContext.Provider value={navigraph}>
                    <div className="flex flex-col">
                        <StatusBar initTime={timeState.initTime} updateCurrentTime={updateCurrentTime} updateTimeSinceStart={updateTimeSinceStart} />
                        <div className="flex flex-row">
                            <ToolBar setPageIndex={(index) => setCurrentPageIndex(index)} />
                            <div className="py-16 px-8 text-gray-700 bg-navy-regular h-screen w-screen">
                                <Switch>
                                    <Route path="/dashboard">
                                        <Dashboard
                                            simbriefData={simbriefData}
                                            fetchSimbrief={fetchSimbriefData}
                                        />
                                    </Route>
                                    <Route path="/dispatch">
                                        <Dispatch
                                            loadsheet={simbriefData.loadsheet}
                                            weights={simbriefData.weights}
                                            fuels={simbriefData.fuels}
                                            units={simbriefData.units}
                                            arrivingAirport={simbriefData.arrivingAirport}
                                            arrivingIata={simbriefData.arrivingIata}
                                            departingAirport={simbriefData.departingAirport}
                                            departingIata={simbriefData.departingIata}
                                            altBurn={simbriefData.altBurn}
                                            altIcao={simbriefData.altIcao}
                                            altIata={simbriefData.altIata}
                                            tripTime={simbriefData.tripTime}
                                            contFuelTime={simbriefData.contFuelTime}
                                            resFuelTime={simbriefData.resFuelTime}
                                            taxiOutTime={simbriefData.taxiOutTime}
                                        />
                                    </Route>
                                    <Route path="/ground">
                                        <Ground />
                                    </Route>
                                    <Route path="/performance">
                                        <Performance />
                                    </Route>
                                    <Route path="/navigation">
                                        <Navigation />
                                    </Route>
                                    <Route path="/atc">
                                        <ATC />
                                    </Route>
                                    <Route path="/failures">
                                        <Failures />
                                    </Route>
                                    <Route path="/settings">
                                        <Settings simbriefUsername={simbriefUsername} setSimbriefUsername={setSimbriefUsername} />
                                    </Route>
                                </Switch>
                            </div>
                        </div>
                    </div>
                </NavigraphContext.Provider>
            </PerformanceContext.Provider>
        </Provider>
    );
};

export default Efb;
