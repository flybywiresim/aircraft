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
import { PopUp } from '@shared/popup';
import { CommitInfo, GitVersions, ReleaseInfo } from '@flybywiresim/api-client';
import { BuildInfo } from './Utils/BuildInfo';
import { Tooltip } from './UtilComponents/TooltipWrapper';
import { FbwLogo } from './UtilComponents/FbwLogo';
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
import { setFlightPlanProgress } from './Store/features/flightProgress';
import { Checklists, setAutomaticItemStates } from './Checklists/Checklists';
import { CHECKLISTS } from './Checklists/Lists';
import { setChecklistItems } from './Store/features/checklists';

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
    const [batteryLifeEnabled] = usePersistentNumberProperty('EFB_BATTERY_LIFE_ENABLED', 1);

    const [navigraph] = useState(() => new NavigraphClient());

    const dispatch = useAppDispatch();
    const simbriefData = useAppSelector((state) => state.simbrief.data);
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const [autoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT');

    const [dc2BusIsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'bool');
    const [batteryLevel, setBatteryLevel] = useState<BatteryStatus>({ level: 100, lastChangeTimestamp: absoluteTime, isCharging: dc2BusIsPowered });

    const [ac1BusIsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'number', 1000);
    const [, setLoadLightingPresetVar] = useSimVar('L:A32NX_LIGHTING_PRESET_LOAD', 'number', 200);
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

    // Aircraft Version check variables
    const [versionChecked, setVersionChecked] = useState(false);
    const [buildInfo, setBuildInfo] = useState<BuildInfo | undefined>(undefined);
    const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo[] | undefined>(undefined);
    const [newestCommit, setNewestCommit] = useState<CommitInfo | undefined>(undefined);
    const [newestExpCommit, setNewestExpCommit] = useState<CommitInfo | undefined>(undefined);
    const [, setOutdatedVersionFlag] = useSimVar('L:A32NX_OUTDATED_VERSION', 'boolean', 200);

    // Retrieves the various versions from the current aircraft and github
    const checkAircraftVersion = () => {
        GitVersions.getReleases(
            'flybywiresim',
            'a32nx',
            false,
            0,
            1,
        ).then((releases) => {
            setReleaseInfo(releases);
        }).catch((error) => {
            console.error('Checking latest released version failed: ', error);
        });

        GitVersions.getNewestCommit(
            'flybywiresim',
            'a32nx',
            'master',
        ).then((releases) => {
            setNewestCommit(releases);
        }).catch((error) => {
            console.error('Checking newest commit failed: ', error);
        });

        GitVersions.getNewestCommit(
            'flybywiresim',
            'a32nx',
            'experimental',
        ).then((releases) => {
            setNewestExpCommit(releases);
        }).catch((error) => {
            console.error('Checking newest experimental commit failed: ', error);
        });

        BuildInfo.getBuildInfo().then((buildInfo: BuildInfo) => {
            setBuildInfo(buildInfo);
        }).catch((error) => {
            console.error('Checking current aircraft version failed: ', error);
        });
    };

    // Show a version info modal if the aircraft version is outdated
    const showVersionPopup = (branchName, currentVersion, releaseVersion) => {
        const popup = new PopUp();
        popup.showInformation(
            'NEW VERSION AVAILABLE',
            `<div style="font-size: 100%; text-align: left;">
                     You are using ${branchName} version:<br/><strong>${currentVersion}</strong><br/><br/> 
                     Latest ${branchName} version is:<br /><strong>${releaseVersion}</strong><br/><br/>
                     Please update your aircraft using the FlyByWire Installer.
                     </div>`,
            'normal',
            () => {},
        );
    };

    // Adds a given number of days to a given Date
    const addDays = (date: Date, days): Date => {
        const result = new Date(date);
        result.setDate(date.getDate() + days);
        return result;
    };

    // Called when aircraft and github version information is available/changes
    useEffect(() => {
        // only check once per session
        if (versionChecked) {
            return;
        }

        // only run if we have all the information we need
        if (buildInfo && releaseInfo && newestCommit && newestExpCommit) {
            console.log('Checking aircraft version');

            // console.debug(`Current aircraft version: ${buildInfo.version}`);
            // console.debug('Latest Released Version: ', releaseInfo[0].name);
            // console.debug('Newest Commit: ', newestCommit.sha);
            // console.debug('Newest Experimental Commit: ', newestExpCommit.sha);

            try {
                const versionInfo = BuildInfo.getVersionInfo(buildInfo.version);

                // Set branchName to the long versions of the aircraft edition names
                let branchName = versionInfo.branch;
                switch (versionInfo.branch) {
                case 'rel': branchName = 'Stable'; break;
                case 'dev': branchName = 'Development'; break;
                case 'exp': branchName = 'Experimental'; break;
                default: break;
                }

                // If the users version is older than the latest release show notification
                if (BuildInfo.versionCompare(versionInfo.version, releaseInfo[0].name) < 0) {
                    console.log(`New version available: ${versionInfo.version} ==> ${releaseInfo[0].name}`);
                    showVersionPopup('', versionInfo.version, releaseInfo[0].name);
                    setOutdatedVersionFlag(true);
                } else {
                    // If the users version is equal or newer than the latest release then check if
                    // the edition is Development or Experimental and if the commit is older than
                    // {maxAge} days after the latest release

                    const maxAge = 3;
                    const timestampAircraft: Date = new Date(buildInfo.built);

                    if (versionInfo.branch.includes('rel')) {
                        // Stable
                        // console.debug('Stable version detected!');
                    } else if ((branchName === 'Development')) {
                        // Development
                        // console.debug(`branch "${branchName}" version detected!`);
                        if (versionInfo.commit !== newestCommit.sha) {
                            if (addDays(newestCommit.timestamp, maxAge) < timestampAircraft) {
                                const currentVersionStr = `${versionInfo.version}-${versionInfo.branch}.${versionInfo.commit} (${timestampAircraft.toUTCString()})`;
                                const releaseVersionStr = `${versionInfo.version}-${versionInfo.branch}.${newestCommit.shortSha} (${newestCommit.timestamp.toUTCString()})`;
                                console.log(`New commit available: ${currentVersionStr} ==> ${releaseVersionStr}`);
                                showVersionPopup(branchName, currentVersionStr, releaseVersionStr);
                                setOutdatedVersionFlag(true);
                            }
                        }
                    } else if ((branchName === 'Experimental')) {
                        // Experimental
                        // console.debug(`branch "${branchName}" version detected!`);
                        if (versionInfo.commit !== newestExpCommit.sha) {
                            if (addDays(newestExpCommit.timestamp, maxAge) < timestampAircraft) {
                                const currentVersionStr = `${versionInfo.version}-${versionInfo.branch}.${versionInfo.commit} (timestamp: ${timestampAircraft.toUTCString()})`;
                                const releaseVersionStr = `${versionInfo.version}-${versionInfo.branch}.${newestExpCommit.shortSha} (timestamp: ${newestExpCommit.timestamp.toUTCString()})`;
                                console.log(`New commit available: ${currentVersionStr} ==> ${releaseVersionStr}`);
                                showVersionPopup(branchName, currentVersionStr, releaseVersionStr);
                                setOutdatedVersionFlag(true);
                            }
                        }
                    } else {
                        // PR or any local build - no further version check
                        // console.debug(`branch "${branchName}" version detected!`);
                    }
                }

                setVersionChecked(true);
            } catch (error) {
                console.error('Version comparison failed: ', error);
            }
        }
    }, [buildInfo, releaseInfo, newestCommit, newestExpCommit]);

    useEffect(() => {
        document.documentElement.classList.add(`theme-${theme}`, 'animationsEnabled');
        setOutdatedVersionFlag(false);
        checkAircraftVersion();
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
    };

    useInteractionEvent('A32NX_EFB_POWER', () => {
        if (powerState === PowerStates.SHUTOFF) {
            offToLoaded();
        } else {
            history.push('/');
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
            setBrightness((calculateBrightness(lat, dayOfYear, localTime)));
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
