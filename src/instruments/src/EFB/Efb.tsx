import React, { useEffect, useState } from 'react';

import { Redirect, Route, Switch } from 'react-router-dom';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';
import { UIMessagesProvider, useUIMessages } from './UIMessages/Provider';
import { usePersistentNumberProperty, usePersistentProperty } from '../Common/persistence';
import NavigraphClient, { NavigraphContext } from './ChartsApi/Navigraph';

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

import { fetchSimbriefDataAction, initialState as simbriefInitialState } from './Store/features/simbrief';

import { NotificationsContainer, NotificationTypes, Notification } from './UIMessages/Notification';
import { FbwLogo } from './Assets/FbwLogo';
import { Checklists } from './Checklists/Checklists';

const navigraph = new NavigraphClient();

const ApplicationNotifications = () => {
    const firstNotification = useUIMessages().notifications[0];

    return (
        <NotificationsContainer>
            {firstNotification}
        </NotificationsContainer>
    );
};

const ScreenLoading = () => (
    <div className="flex justify-center items-center w-screen h-screen bg-theme-statusbar">
        <FbwLogo width={128} height={120} className="text-theme-text" />
    </div>
);

export enum PowerStates {
    SHUTOFF,
    STANDBY,
    LOADING,
    LOADED,
}

interface PowerContextInterface {
    powerState: PowerStates,
    setPowerState: (PowerState) => void
}

export const PowerContext = React.createContext<PowerContextInterface>(undefined as any);
export const usePower = () => React.useContext(PowerContext);

const Efb = () => {
    const uiMessages = useUIMessages();

    const [powerState, setPowerState] = useState<PowerStates>(PowerStates.SHUTOFF);

    const [currentLocalTime] = useSimVar('E:LOCAL TIME', 'seconds', 3000);
    const [, setBrightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number');
    const [brightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [usingAutobrightness] = useSimVar('L:A32NX_EFB_USING_AUTOBRIGHTNESS', 'bool', 300);
    const [dayOfYear] = useSimVar('E:ZULU DAY OF YEAR', 'number');
    const [latitude] = useSimVar('PLANE LATITUDE', 'degree latitude');

    const dispatch = useAppDispatch();
    const simbriefData = useAppSelector((state) => state.simbrief.data);
    const [simbriefUserId] = usePersistentProperty('CONFIG_SIMBRIEF_USERID');
    const [autoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT');

    useEffect(() => {
        if (powerState === PowerStates.SHUTOFF) {
            dispatch(clearEfbState());
        } else if (powerState === PowerStates.LOADED) {
            if ((!simbriefData || simbriefData === simbriefInitialState.data) && autoSimbriefImport === 'ENABLED') {
                fetchSimbriefDataAction(simbriefUserId ?? '').then((action) => {
                    dispatch(action);
                }).catch(() => {
                    uiMessages.pushNotification(
                        <Notification
                            type={NotificationTypes.ERROR}
                            title="SimBrief Error"
                            message="An error occurred when trying to fetch your SimBrief data."
                        />,
                    );
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

    // handle setting brightness if user is using autobrightness
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
    case PowerStates.LOADED:
        return (
            <NavigraphContext.Provider value={navigraph}>
                <PowerContext.Provider value={{ powerState, setPowerState }}>
                    <UIMessagesProvider>
                        <div className="bg-theme-body">
                            <ApplicationNotifications />
                            <StatusBar />
                            <div className="flex flex-row">
                                <ToolBar />
                                <div className="pt-14 pr-6 w-screen h-screen text-gray-700">
                                    <Switch>
                                        <Route exact path="/">
                                            <Redirect to="/dashboard" />
                                        </Route>
                                        <Route path="/dashboard">
                                            <Dashboard />
                                        </Route>
                                        <Route path="/dispatch">
                                            <Dispatch />
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
                                        <Route path="/checklists">
                                            <Checklists />
                                        </Route>
                                        <Route path="/settings">
                                            <Settings />
                                        </Route>
                                    </Switch>
                                </div>
                            </div>
                        </div>
                    </UIMessagesProvider>
                </PowerContext.Provider>
            </NavigraphContext.Provider>
        );
    default:
        throw new Error('Invalid content state provided');
    }
};

export default Efb;
