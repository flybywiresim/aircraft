import React, { useEffect, useState } from 'react';

import { Redirect, Route, Switch } from 'react-router-dom';
import { useSimVar, useSimVarValue } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { Battery, BatteryCharging } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { distanceTo } from 'msfs-geo';
import NavigraphClient, { NavigraphContext } from './ChartsApi/Navigraph';
import 'react-toastify/dist/ReactToastify.css';
import './toast.css';

import { StatusBar } from './StatusBar/StatusBar';
import { ToolBar } from './ToolBar/ToolBar';

import { Dashboard } from './Dashboard/Dashboard';
import { Dispatch } from './Dispatch/Dispatch';
import { Ground } from './Ground/Ground';
import { Performance } from './Performance/Performance';
import { Navigation } from './Navigation/Navigation';
import { ATC } from './ATC/ATC';
import { Settings } from './Settings/Settings';
import { Failures } from './Failures/Failures';

import { clearEfbState, useAppDispatch, useAppSelector } from './Store/store';

import { fetchSimbriefDataAction, initialState as simbriefInitialState } from './Store/features/simBrief';

import { FbwLogo } from './UtilComponents/FbwLogo';
import { setFlightPlanProgress } from './Store/features/flightProgress';

const BATTERY_DURATION_CHARGE_MIN = 180;
const BATTERY_DURATION_DISCHARGE_MIN = 240;

const navigraph = new NavigraphClient();

const ScreenLoading = () => (
    <div className="flex justify-center items-center w-screen h-screen bg-theme-statusbar">
        <FbwLogo width={128} height={120} className="text-theme-text" />
    </div>
);

const ScreenEmpty = ({ isCharging }: { isCharging: boolean }) => (
    <div className="flex justify-center items-center w-screen h-screen bg-theme-statusbar">
        {!isCharging && (
            <Battery size={128} className="text-red-500" />
        )}
        {isCharging && (
            <BatteryCharging size={128} className="text-red-500" />
        )}
    </div>
);

export enum PowerStates {
    SHUTOFF,
    STANDBY,
    LOADING,
    LOADED,
    EMPTY,
}

interface PowerContextInterface {
    powerState: PowerStates,
    setPowerState: (PowerState) => void
}

export const PowerContext = React.createContext<PowerContextInterface>(undefined as any);

interface BatteryStatus {
    level: number;
    lastChangeTimestamp: number;
    isCharging: boolean;
}

export const usePower = () => React.useContext(PowerContext);

const Efb = () => {
    // TODO: CHANGE ME
    const [powerState, setPowerState] = useState<PowerStates>(PowerStates.LOADED);

    const [currentLocalTime] = useSimVar('E:LOCAL TIME', 'seconds', 3000);
    const [absoluteTime] = useSimVar('E:ABSOLUTE TIME', 'seconds', 3000);
    const [, setBrightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number');
    const [brightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [usingAutobrightness] = useSimVar('L:A32NX_EFB_USING_AUTOBRIGHTNESS', 'bool', 300);
    const [dayOfYear] = useSimVar('E:ZULU DAY OF YEAR', 'number');
    const [latitude] = useSimVar('PLANE LATITUDE', 'degree latitude');

    const dispatch = useAppDispatch();
    const simbriefData = useAppSelector((state) => state.simbrief.data);
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const [autoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT');

    const [dc2BusIsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'bool');
    const [batteryLevel, setBatteryLevel] = useState<BatteryStatus>({ level: 100, lastChangeTimestamp: absoluteTime, isCharging: dc2BusIsPowered });

    const lat = useSimVarValue('PLANE LATITUDE', 'degree latitude', 2000);
    const long = useSimVarValue('PLANE LONGITUDE', 'degree longitude', 2000);

    const { arrivingPosLat, arrivingPosLong, departingPosLat, departingPosLong } = useAppSelector((state) => state.simbrief.data);

    useEffect(() => {
        const remainingDistance = distanceTo(
            { lat, long },
            { lat: arrivingPosLat, long: arrivingPosLong },
        );

        const totalDistance = distanceTo(
            { lat: departingPosLat, long: departingPosLong },
            { lat: arrivingPosLat, long: arrivingPosLong },
        );

        const flightPlanProgress = totalDistance ? Math.max(((totalDistance - remainingDistance) / totalDistance) * 100, 0) : 0;

        console.log('remainingDistance', remainingDistance);
        console.log('totalDistance', totalDistance);
        console.log('flightPlanProgress', flightPlanProgress);

        dispatch(setFlightPlanProgress(flightPlanProgress));
    }, [lat, long, arrivingPosLat, arrivingPosLong, departingPosLat, departingPosLong]);

    useEffect(() => {
        setBatteryLevel((oldLevel:BatteryStatus) => {
            const deltaTs = absoluteTime - oldLevel.lastChangeTimestamp;
            const batteryDurationSec = oldLevel.isCharging ? BATTERY_DURATION_CHARGE_MIN * 60 : -BATTERY_DURATION_DISCHARGE_MIN * 60;

            let level = oldLevel.level + 100 * deltaTs / batteryDurationSec;
            if (level > 100) level = 100;
            if (level < 0) level = 0;
            const lastChangeTimestamp = absoluteTime;
            const isCharging = oldLevel.isCharging;

            return { level, lastChangeTimestamp, isCharging };
        });
    }, [absoluteTime]);

    useEffect(() => {
        setBatteryLevel((oldLevel) => {
            if (oldLevel.isCharging !== dc2BusIsPowered) {
                return { level: oldLevel.level, lastChangeTimestamp: absoluteTime, isCharging: dc2BusIsPowered };
            }
            return oldLevel;
        });
    }, [absoluteTime, dc2BusIsPowered]);

    useEffect(() => {
        if (batteryLevel.level <= 0) {
            setPowerState(PowerStates.EMPTY);
        }

        if (batteryLevel.level > 2 && powerState === PowerStates.EMPTY) {
            offToLoaded();
        }
    }, [batteryLevel, powerState]);

    useEffect(() => {
        if (powerState === PowerStates.SHUTOFF) {
            dispatch(clearEfbState());
        } else if (powerState === PowerStates.LOADED) {
            if ((!simbriefData || simbriefData === simbriefInitialState.data) && autoSimbriefImport === 'ENABLED') {
                fetchSimbriefDataAction(simbriefUserId ?? '').then((action) => {
                    dispatch(action);
                }).catch((e) => {
                    toast.error(e.message);
                });
            }
        }
    }, [powerState]);

    const offToLoaded = () => {
        setPowerState(PowerStates.LOADING);
        setTimeout(() => {
            setPowerState(PowerStates.LOADED);
        }, 2500);
    };

    useInteractionEvent('A32NX_EFB_POWER', () => {
        if (powerState === PowerStates.SHUTOFF) {
            offToLoaded();
        } else {
            setPowerState(PowerStates.SHUTOFF);
        }
    });

    /**
     * Returns a brightness value between 0 and 100 inclusive based on the ratio of the solar altitude to the solar zenith
     * @param {number} latitude - The latitude of the location (-90 to 90)
     * @param {number} dayOfYear - The day of the year (0 to 365)
     * @param {number} timeOfDay - The time of day in hours (0 to 24)
     */
    const calculateBrightness = (latitude: number, dayOfYear: number, timeOfDay: number) => {
        const solarTime = timeOfDay + (dayOfYear - 1) * 24;
        const solarDeclination = 0.409 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365);
        const solarAltitude = Math.asin(
            Math.sin(latitude * Math.PI / 180) * Math.sin(solarDeclination) + Math.cos(latitude * Math.PI / 180) * Math.cos(solarDeclination) * Math.cos(2 * Math.PI * solarTime / 24),
        );
        const solarZenith = 90 - (latitude - solarDeclination);

        return Math.min(Math.max((-solarAltitude * (180 / Math.PI)) / solarZenith * 100, 0), 100);
    };

    useEffect(() => {
        if (usingAutobrightness) {
            const localTime = currentLocalTime / 3600;
            setBrightness((calculateBrightness(latitude, dayOfYear, localTime)));
        } else {
            setBrightness(brightnessSetting);
        }
    }, [currentLocalTime, usingAutobrightness]);

    switch (powerState) {
    case PowerStates.SHUTOFF:
        return <div className="w-screen h-screen" onClick={() => offToLoaded()} />;
    case PowerStates.LOADING:
        return <ScreenLoading />;
    case PowerStates.EMPTY:
        return <ScreenEmpty isCharging={dc2BusIsPowered === 1} />;
    case PowerStates.LOADED:
        return (
            <NavigraphContext.Provider value={navigraph}>
                <PowerContext.Provider value={{ powerState, setPowerState }}>
                    <div className="bg-theme-body">
                        <ToastContainer
                            position="top-center"
                            draggableDirection="y"
                            limit={2}
                        />
                        <StatusBar
                            batteryLevel={batteryLevel.level}
                            isCharging={dc2BusIsPowered === 1}
                        />
                        <div className="flex flex-row">
                            <ToolBar />
                            <div className="pt-14 pr-6 w-screen h-screen text-gray-700">
                                <Switch>
                                    <Route exact path="/">
                                        <Redirect to="/dashboard" />
                                    </Route>
                                    <Route path="/dashboard" component={Dashboard} />
                                    <Route path="/dispatch" component={Dispatch} />
                                    <Route path="/ground" component={Ground} />
                                    <Route path="/performance" component={Performance} />
                                    <Route path="/navigation" component={Navigation} />
                                    <Route path="/atc" component={ATC} />
                                    <Route path="/failures" component={Failures} />
                                    <Route path="/settings" component={Settings} />
                                </Switch>
                            </div>
                        </div>
                    </div>
                </PowerContext.Provider>
            </NavigraphContext.Provider>
        );
    default:
        throw new Error('Invalid content state provided');
    }
};

export default Efb;
