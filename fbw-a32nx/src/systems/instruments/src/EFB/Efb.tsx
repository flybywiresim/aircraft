// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';

import useInterval from '@instruments/common/useInterval';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';

import { Battery } from 'react-bootstrap-icons';
import { toast, ToastContainer } from 'react-toastify';
import { distanceTo } from 'msfs-geo';
import { Tooltip } from './UtilComponents/TooltipWrapper';
import { FbwLogo } from './UtilComponents/FbwLogo';
import { AlertModal, ModalContainer, useModals } from './UtilComponents/Modals/Modals';
import NavigraphClient, { NavigraphContext } from './Apis/Navigraph/Navigraph';
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
import { setFlightPlanProgress } from './Store/features/flightProgress';
import { Checklists, setAutomaticItemStates } from './Checklists/Checklists';
import { CHECKLISTS } from './Checklists/Lists';
import { setChecklistItems } from './Store/features/checklists';
import { FlyPadPage } from './Settings/Pages/FlyPadPage';

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
    SHUTDOWN,
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
    const [absoluteTime] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [, setBrightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number');
    const [brightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [usingAutobrightness] = useSimVar('L:A32NX_EFB_USING_AUTOBRIGHTNESS', 'bool', 300);
    const [batteryLifeEnabled] = usePersistentNumberProperty('EFB_BATTERY_LIFE_ENABLED', 1);

    const [navigraph] = useState(() => new NavigraphClient());

    const dispatch = useAppDispatch();
    const simbriefData = useAppSelector((state) => state.simbrief.data);
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const [autoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT');

    const [dc2BusIsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'bool');
    const [batteryLevel, setBatteryLevel] = useState<BatteryStatus>({
        level: 100,
        lastChangeTimestamp: absoluteTime,
        isCharging: dc2BusIsPowered,
    });

    const [ac1BusIsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'number', 1000);
    const [, setLoadLightingPresetVar] = useSimVar('L:A32NX_LIGHTING_PRESET_LOAD', 'number', 200);
    const [autoDisplayBrightness] = useSimVar('GLASSCOCKPIT AUTOMATIC BRIGHTNESS', 'percent', 1000);
    const [timeOfDay] = useSimVar('E:TIME OF DAY', 'number', 5000);
    const [autoLoadLightingPresetEnabled] = usePersistentNumberProperty('LIGHT_PRESET_AUTOLOAD', 0);
    const [autoLoadDayLightingPresetID] = usePersistentNumberProperty('LIGHT_PRESET_AUTOLOAD_DAY', 0);
    const [autoLoadDawnDuskLightingPresetID] = usePersistentNumberProperty('LIGHT_PRESET_AUTOLOAD_DAWNDUSK', 0);
    const [autoLoadNightLightingPresetID] = usePersistentNumberProperty('LIGHT_PRESET_AUTOLOAD_NIGHT', 0);

    const [lat] = useSimVar('PLANE LATITUDE', 'degree latitude', 4000);
    const [long] = useSimVar('PLANE LONGITUDE', 'degree longitude', 4000);

    const { arrivingPosLat, arrivingPosLong, departingPosLat, departingPosLong } = useAppSelector((state) => state.simbrief.data);

    const [theme] = usePersistentProperty('EFB_UI_THEME', 'blue');

    const { showModal } = useModals();

    const history = useHistory();

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

    // Automatically load a lighting preset
    useEffect(() => {
        if (ac1BusIsPowered && autoLoadLightingPresetEnabled) {
            switch (timeOfDay) {
            case 1:
                if (autoLoadDayLightingPresetID !== 0) {
                    setLoadLightingPresetVar(autoLoadDayLightingPresetID);
                }
                break;
            case 2:
                if (autoLoadDawnDuskLightingPresetID !== 0) {
                    setLoadLightingPresetVar(autoLoadDawnDuskLightingPresetID);
                }
                break;
            case 3:
                if (autoLoadNightLightingPresetID !== 0) {
                    setLoadLightingPresetVar(autoLoadNightLightingPresetID);
                }
                break;
            default:
                break;
            }
        }
    }, [ac1BusIsPowered, autoLoadLightingPresetEnabled]);

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
        return (<></>);
    };

    useInteractionEvent('A32NX_EFB_POWER', () => {
        if (powerState === PowerStates.STANDBY) {
            offToLoaded();
        } else {
            history.push('/');
            setPowerState(PowerStates.STANDBY);
        }
    });

    const { posX, posY, shown, text } = useAppSelector((state) => state.tooltip);

    useEffect(() => {
        if (powerState !== PowerStates.LOADED && powerState !== PowerStates.SHUTDOWN) {
            // die, retinas!
            setBrightness(100);
        } else if (usingAutobrightness) {
            setBrightness(autoDisplayBrightness);
        } else {
            setBrightness(brightnessSetting);
        }
    }, [powerState, brightnessSetting, autoDisplayBrightness, usingAutobrightness]);

    // =========================================================================
    // <Pushback>
    const [nwStrgDisc] = useSimVar('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool', 100);

    // Required to fully release the tug and restore steering capabilities
    // Must not be fired too early after disconnect therefore we wait until
    // ECAM "NW STRG DISC" message also disappears.
    useEffect(() => {
        if (!nwStrgDisc) {
            SimVar.SetSimVarValue('K:TUG_DISABLE', 'Bool', 1);
        }
    }, [nwStrgDisc]);

    // </Pushback>
    // =========================================================================

    const { offsetY } = useAppSelector((state) => state.keyboard);

    switch (powerState) {
    case PowerStates.SHUTOFF:
    case PowerStates.STANDBY:
        return <div className="w-screen h-screen" onClick={offToLoaded} />;
    case PowerStates.LOADING:
    case PowerStates.SHUTDOWN:
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
                                    <Route path="/checklists" component={Checklists} />
                                    <Route path="/presets" component={Presets} />
                                    <Route path="/settings" component={Settings} />
                                    <Route path="/settings/flypad" component={FlyPadPage} />
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
