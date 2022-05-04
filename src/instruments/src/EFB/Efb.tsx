// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useRef, useState } from 'react';

import { Redirect, Route, Switch } from 'react-router-dom';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { Battery } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { distanceTo } from 'msfs-geo';
import useInterval from '@instruments/common/useInterval';
import { Tooltip } from './UtilComponents/TooltipWrapper';
import { AlertModal, ModalContainer, useModals } from './UtilComponents/Modals/Modals';
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
import { Presets } from './Presets/Presets';

import { clearEfbState, useAppDispatch, useAppSelector } from './Store/store';

import { fetchSimbriefDataAction, isSimbriefDataLoaded } from './Store/features/simBrief';

import { FbwLogo } from './UtilComponents/FbwLogo';
import { setFlightPlanProgress } from './Store/features/flightProgress';
import { Checklists, setAutomaticItemStates } from './Checklists/Checklists';
import { CHECKLISTS } from './Checklists/Lists';
import { setChecklistItems } from './Store/features/checklists';
import {
    setUpdateIntervalID,
    setUpdateDeltaTime,
    setLastTimestamp,
    setTugCommandedHeading, setTugCommandedSpeed,
} from './Store/features/pushback';

const BATTERY_DURATION_CHARGE_MIN = 180;
const BATTERY_DURATION_DISCHARGE_MIN = 540;

const LoadingScreen = () => (
    <div className="flex justify-center items-center w-screen h-screen bg-theme-statusbar">
        <FbwLogo width={128} height={120} className="text-theme-text" />
    </div>
);

const EmptyBatteryScreen = () => (
    <div className="flex justify-center items-center w-screen h-screen bg-theme-statusbar">
        <Battery size={128} className="text-utility-red" />
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
    const [powerState, setPowerState] = useState<PowerStates>(PowerStates.SHUTOFF);
    const [currentLocalTime] = useSimVar('E:LOCAL TIME', 'seconds', 3000);
    const [absoluteTime] = useSimVar('E:ABSOLUTE TIME', 'seconds', 3000);
    const [, setBrightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number');
    const [brightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [usingAutobrightness] = useSimVar('L:A32NX_EFB_USING_AUTOBRIGHTNESS', 'bool', 300);
    const [dayOfYear] = useSimVar('E:ZULU DAY OF YEAR', 'number');
    const [latitude] = useSimVar('PLANE LATITUDE', 'degree latitude');
    const [batteryLifeEnabled] = usePersistentNumberProperty('EFB_BATTERY_LIFE_ENABLED', 1);

    const [navigraph] = useState(() => new NavigraphClient());

    const dispatch = useAppDispatch();
    const simbriefData = useAppSelector((state) => state.simbrief.data);
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const [autoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT');

    const [dc2BusIsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'bool');
    const [batteryLevel, setBatteryLevel] = useState<BatteryStatus>({ level: 100, lastChangeTimestamp: absoluteTime, isCharging: dc2BusIsPowered });

    const [lat] = useSimVar('PLANE LATITUDE', 'degree latitude', 4000);
    const [long] = useSimVar('PLANE LONGITUDE', 'degree longitude', 4000);

    const { arrivingPosLat, arrivingPosLong, departingPosLat, departingPosLong } = useAppSelector((state) => state.simbrief.data);

    const [theme] = usePersistentProperty('EFB_UI_THEME', 'blue');

    const { showModal } = useModals();

    useEffect(() => {
        document.documentElement.classList.add(`theme-${theme}`, 'animationsEnabled');
    }, []);

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

        dispatch(setFlightPlanProgress(flightPlanProgress));
    }, [lat.toFixed(2), long.toFixed(2), arrivingPosLat, arrivingPosLong, departingPosLat, departingPosLong]);

    useEffect(() => {
        if (powerState !== PowerStates.LOADED || !batteryLifeEnabled) return;

        setBatteryLevel((oldLevel) => {
            const deltaTs = Math.max(absoluteTime - oldLevel.lastChangeTimestamp, 0);
            const batteryDurationSec = oldLevel.isCharging ? BATTERY_DURATION_CHARGE_MIN * 60 : -BATTERY_DURATION_DISCHARGE_MIN * 60;

            let level = oldLevel.level + 100 * deltaTs / batteryDurationSec;
            if (level > 100) level = 100;
            if (level < 0) level = 0;
            const lastChangeTimestamp = absoluteTime;
            const isCharging = oldLevel.isCharging;

            if (oldLevel.level > 20 && level <= 20) {
                showModal(
                    <AlertModal
                        title="Battery Low"
                        bodyText="The battery is getting very low. Please charge the battery soon."
                    />,
                );
            }

            return { level, lastChangeTimestamp, isCharging };
        });
    }, [absoluteTime, powerState]);

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

    const [autoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);
    const { checklists } = useAppSelector((state) => state.trackingChecklists);

    useEffect(() => {
        if (powerState === PowerStates.SHUTOFF) {
            dispatch(clearEfbState());
        } else if (powerState === PowerStates.LOADED) {
            const checklistItemsEmpty = checklists.every((checklist) => !checklist.items.length);

            if (checklistItemsEmpty) {
                CHECKLISTS.forEach((checklist, index) => {
                    dispatch(setChecklistItems({
                        checklistIndex: index,
                        itemArr: checklist.items.map((item) => ({ completed: false, hasCondition: item.condition !== undefined })),
                    }));
                });
            }

            if ((!simbriefData || !isSimbriefDataLoaded()) && autoSimbriefImport === 'ENABLED') {
                fetchSimbriefDataAction(simbriefUserId ?? '').then((action) => {
                    dispatch(action);
                }).catch((e) => {
                    toast.error(e.message);
                });
            }
        }
    }, [powerState]);

    useInterval(() => {
        if (!autoFillChecklists) return;

        setAutomaticItemStates();
    }, 1000);

    const offToLoaded = () => {
        const shouldWait = powerState === PowerStates.SHUTOFF || powerState === PowerStates.EMPTY;
        setPowerState(PowerStates.LOADING);

        if (shouldWait) {
            setTimeout(() => {
                setPowerState(PowerStates.LOADED);
            }, 2500);
        } else {
            setPowerState(PowerStates.LOADED);
        }
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

    const { posX, posY, shown, text } = useAppSelector((state) => state.tooltip);

    useEffect(() => {
        if (usingAutobrightness) {
            const localTime = currentLocalTime / 3600;
            setBrightness((calculateBrightness(latitude, dayOfYear, localTime)));
        }
    }, [Math.ceil(currentLocalTime / 5), usingAutobrightness]);

    useEffect(() => {
        if (!usingAutobrightness) {
            setBrightness(brightnessSetting);
        }
    }, [usingAutobrightness]);

    useEffect(() => {
        setBrightness(brightnessSetting);
    }, [powerState]);

    // =========================================================================
    // <Pushback>
    const [pushbackSystemEnabled] = useSimVar('L:A32NX_PUSHBACK_SYSTEM_ENABLED', 'bool', 100);
    const [pushBackAttached] = useSimVar('Pushback Attached', 'bool', 100);

    const {
        pushbackPaused,
        updateIntervalID,
        lastTimeStamp,
        tugCommandedHeadingFactor,
        tugCommandedSpeedFactor,
        tugInertiaFactor,
    } = useAppSelector((state) => state.pushback.pushbackState);

    // Required so these can be used inside the setInterval callback function
    // for the pushback movement update
    const pushbackSystemEnabledRef = useRef(pushbackSystemEnabled);
    pushbackSystemEnabledRef.current = pushbackSystemEnabled;
    const lastTimeStampRef = useRef(lastTimeStamp);
    lastTimeStampRef.current = lastTimeStamp;
    const pushbackPausedRef = useRef(pushbackPaused);
    pushbackPausedRef.current = pushbackPaused;
    const tugCommandedHeadingFactorRef = useRef(tugCommandedHeadingFactor);
    tugCommandedHeadingFactorRef.current = tugCommandedHeadingFactor;
    const tugCommandedSpeedFactorRef = useRef(tugCommandedSpeedFactor);
    tugCommandedSpeedFactorRef.current = tugCommandedSpeedFactor;
    const tugInertiaFactorRef = useRef(tugInertiaFactor);
    tugInertiaFactorRef.current = tugInertiaFactor;

    // Callback function for the setInterval to update the movement of the aircraft independent of
    // the refresh rate of the Glass Cockpit Refresh Rate in internal and external view.
    const movementUpdate = () => {
        if (!pushbackSystemEnabledRef.current) {
            return;
        }

        const startTime = Date.now();
        dispatch(setUpdateDeltaTime(startTime - lastTimeStampRef.current));
        dispatch(setLastTimestamp(startTime));

        const pushbackAttached = SimVar.GetSimVarValue('Pushback Attached', 'bool');
        const simOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'bool');

        if (pushbackAttached && simOnGround) {
            // Stop the pushback movement when paused
            if (pushbackPausedRef.current) {
                SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', 0);
                SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', 0);
                SimVar.SetSimVarValue('ACCELERATION BODY Z', 'feet per second squared', 0);
                SimVar.SetSimVarValue('ROTATION VELOCITY BODY Y', 'Number', 0);
                SimVar.SetSimVarValue('ROTATION ACCELERATION BODY Y', 'radians per second squared', 0);
                SimVar.SetSimVarValue('Pushback Wait', 'bool', true);
                return;
            }

            // compute heading and speed
            const parkingBrakeEngaged = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
            const aircraftHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');

            const computedTugHeading = (aircraftHeading - (50 * tugCommandedHeadingFactorRef.current)) % 360;
            dispatch(setTugCommandedHeading(computedTugHeading)); // debug

            // K:KEY_TUG_HEADING expects an unsigned integer scaling 360° to 0 to 2^32-1 (0xffffffff / 360)
            const convertedComputedHeading = (computedTugHeading * (0xffffffff / 360)) & 0xffffffff;
            const computedRotationVelocity = (tugCommandedSpeedFactorRef.current <= 0 ? -1 : 1)
                * tugCommandedHeadingFactorRef.current * (parkingBrakeEngaged ? 0.008 : 0.08);

            const tugCommandedSpeed = tugCommandedSpeedFactorRef.current
                * (parkingBrakeEngaged ? 0.8 : 8) * tugInertiaFactorRef.current;
            dispatch(setTugCommandedSpeed(tugCommandedSpeed)); // debug

            SimVar.SetSimVarValue('Pushback Wait', 'bool', false);
            // Set tug heading
            SimVar.SetSimVarValue('K:KEY_TUG_HEADING', 'Number', convertedComputedHeading);
            SimVar.SetSimVarValue('ROTATION VELOCITY BODY X', 'Number', 0);
            SimVar.SetSimVarValue('ROTATION VELOCITY BODY Y', 'Number', computedRotationVelocity);
            SimVar.SetSimVarValue('ROTATION VELOCITY BODY Y', 'Number', computedRotationVelocity);
            SimVar.SetSimVarValue('ROTATION VELOCITY BODY Z', 'Number', 0);
            // Set tug speed
            SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', tugCommandedSpeed);
            SimVar.SetSimVarValue('VELOCITY BODY X', 'Number', 0);
            SimVar.SetSimVarValue('VELOCITY BODY Y', 'Number', 0);
            // SimVar.SetSimVarValue('ACCELERATION BODY Z', 'feet per second squared', tugCommandedSpeed);
            SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', tugCommandedSpeed); SimVar.SetSimVarValue('ACCELERATION BODY Z', 'Number', 0);
        }
    };

    // Set up an update interval to ensure smooth movement independent of
    // Glass Cockpit Refresh Rate. This is required as the refresh rate is
    // 10x lower in external view which leads to jerky movements otherwise.
    useEffect(() => {
        if (pushbackSystemEnabled && pushBackAttached && updateIntervalID === 0) {
            const interval = setInterval(movementUpdate, 50);
            dispatch(setUpdateIntervalID(Number(interval)));
        } else if (!pushBackAttached) {
            clearInterval(updateIntervalID);
            dispatch(setUpdateIntervalID(0));
        }
    }, [pushBackAttached, pushbackSystemEnabled]);

    // </Pushback>
    // =========================================================================

    const { offsetY } = useAppSelector((state) => state.keyboard);

    switch (powerState) {
    case PowerStates.SHUTOFF:
    case PowerStates.STANDBY:
        return <div className="w-screen h-screen" onClick={offToLoaded} />;
    case PowerStates.LOADING:
        return <LoadingScreen />;
    case PowerStates.EMPTY:
        if (dc2BusIsPowered === 1) {
            return offToLoaded();
        }
        return <EmptyBatteryScreen />;
    case PowerStates.LOADED:
        return (
            <NavigraphContext.Provider value={navigraph}>
                <ModalContainer />
                <PowerContext.Provider value={{ powerState, setPowerState }}>
                    <div className="bg-theme-body" style={{ transform: `translateY(-${offsetY}px)` }}>
                        <Tooltip posX={posX} posY={posY} shown={shown} text={text} />

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
                            <div className="pt-14 pr-6 w-screen h-screen">
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
                                    <Route path="/checklists" component={Checklists} />
                                    <Route path="/presets" component={Presets} />
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
