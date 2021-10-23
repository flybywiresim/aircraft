import React, { useState, useEffect, useRef } from 'react';
import { Power, WifiOff, Wifi } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { usePersistentProperty, usePersistentNumberProperty } from '@instruments/common/persistence';
import { useLongPress } from 'use-long-press';
import { useHistory } from 'react-router-dom';
import useInterval from '@instruments/common/useInterval';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';
import { usePower, PowerStates } from '../Efb';

import { BatteryStatus } from './BatteryStatus';
import { useAppSelector } from '../Store/store';
import { initialState } from '../Store/features/simBrief';

interface StatusBarProps {
    batteryLevel: number;
    isCharging: boolean;
}

export const StatusBar = ({ batteryLevel, isCharging }: StatusBarProps) => {
    const [currentUTC] = useSimVar('E:ZULU TIME', 'seconds');
    const [currentLocalTime] = useSimVar('E:LOCAL TIME', 'seconds');
    const [dayOfWeek] = useSimVar('E:ZULU DAY OF WEEK', 'number');
    const [monthOfYear] = useSimVar('E:ZULU MONTH OF YEAR', 'number');
    const [dayOfMonth] = useSimVar('E:ZULU DAY OF MONTH', 'number');
    const [showStatusBarFlightProgress] = usePersistentNumberProperty('EFB_SHOW_STATUSBAR_FLIGHTPROGRESS', 1);

    const history = useHistory();

    const [timeDisplayed] = usePersistentProperty('EFB_TIME_DISPLAYED', 'utc');
    const [timeFormat] = usePersistentProperty('EFB_TIME_FORMAT', '24');

    const power = usePower();

    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'][dayOfWeek];

    const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthOfYear - 1];

    const getZuluFormattedTime = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2, '0')}${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}Z`;
    const getLocalFormattedTime = (seconds: number) => {
        if (timeFormat === '24') {
            return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}`;
        }
        const hours = Math.floor(seconds / 3600) % 12;
        const minutes = Math.floor((seconds % 3600) / 60);
        const ampm = Math.floor(seconds / 3600) >= 12 ? 'pm' : 'am';
        return `${hours === 0 ? 12 : hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
    };

    const { flightPlanProgress } = useAppSelector((state) => state.flightProgress);
    const { departingAirport, arrivingAirport, schedIn, schedOut } = useAppSelector((state) => state.simbrief.data);
    const { data } = useAppSelector((state) => state.simbrief);

    const [showSchedTimes, setShowSchedTimes] = useState(false);

    let schedInParsed = '';
    let schedOutParsed = '';

    if (!schedInParsed) {
        const sta = new Date(parseInt(schedIn) * 1000);
        schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}${sta.getUTCMinutes().toString().padStart(2, '0')}Z`;
    }

    if (!schedOutParsed) {
        const std = new Date(parseInt(schedOut) * 1000);
        schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}${std.getUTCMinutes().toString().padStart(2, '0')}Z`;
    }
    const [shutoffBarPercent, setShutoffBarPercent] = useState(0);
    const shutoffTimerRef = useRef<NodeJS.Timer | null>(null);

    // TODO FIXME: This is going to need some readjustment when the user config changes
    const setConnectedState = async () => {
        try {
            const healthRes = await fetch('http://localhost:8380/health');
            const healthJson = await healthRes.json();

            if (healthJson.info.api.status === 'up') {
                setLocalApiConnected(true);
            } else {
                setLocalApiConnected(false);
            }
        } catch (_) {
            setLocalApiConnected(false);
        }
    };

    const [localApiConnected, setLocalApiConnected] = useState(false);

    useInterval(() => {
        setConnectedState();
    }, 30_000);

    const bind = useLongPress(() => {}, {
        threshold: 100_000,
        onCancel: () => {
            if (shutoffTimerRef.current) {
                clearInterval(shutoffTimerRef.current);
            }
            history.push('/');
            power.setPowerState(PowerStates.STANDBY);
        },
        onStart: () => {
            shutoffTimerRef.current = setInterval(() => {
                setShutoffBarPercent((old) => old + 5);
            }, 100);
        },
    });

    useEffect(() => {
        if (shutoffBarPercent >= 120) {
            history.push('/');
            power.setPowerState(PowerStates.SHUTOFF);
        }
    }, [shutoffBarPercent]);

    useEffect(() => {
        setConnectedState();

        const interval = setInterval(() => {
            setShowSchedTimes((old) => !old);

            setTimeout(() => {
                setShowSchedTimes((old) => !old);
            }, 5_000);
        }, 30_000);

        return () => {
            clearInterval(interval);
            if (shutoffTimerRef.current) {
                clearInterval(shutoffTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="flex fixed z-40 justify-between items-center px-6 w-full h-10 text-lg font-medium leading-none text-theme-text bg-theme-statusbar">
            <div
                className="absolute inset-x-0 bottom-0 h-0.5 bg-theme-highlight"
                style={{ width: `${shutoffBarPercent}%`, transition: 'width 0.5s ease' }}
            />

            <p>{`${dayName} ${monthName} ${dayOfMonth}`}</p>
            <div className="flex absolute inset-x-0 flex-row justify-center items-center mx-auto space-x-4 w-min">
                {(timeDisplayed === 'utc' || timeDisplayed === 'both') && (
                    <p>{getZuluFormattedTime(currentUTC)}</p>
                )}
                {timeDisplayed === 'both' && (
                    <p>/</p>
                )}
                {(timeDisplayed === 'local' || timeDisplayed === 'both') && (
                    <p>{getLocalFormattedTime(currentLocalTime)}</p>
                )}
            </div>
            <div className="flex items-center space-x-8">
                {(!!showStatusBarFlightProgress && (data !== initialState.data)) && (
                    <div
                        className="flex overflow-hidden flex-row items-center space-x-4 h-10"
                        onClick={() => setShowSchedTimes((old) => !old)}
                    >
                        <div className={`${showSchedTimes ? '-translate-y-1/4' : 'translate-y-1/4'} transform transition text-right duration-100 flex flex-col space-y-1`}>
                            <p>{departingAirport}</p>
                            <p>{schedOutParsed}</p>
                        </div>
                        <div className="flex flex-row w-32">
                            <div className="h-1 bg-theme-highlight" style={{ width: `${flightPlanProgress}%` }} />
                            <div className="h-1 bg-theme-text" style={{ width: `${100 - flightPlanProgress}%` }} />
                        </div>
                        <div className={`${showSchedTimes ? '-translate-y-1/4' : 'translate-y-1/4'} transform transition duration-100 flex flex-col space-y-1`}>
                            <p>{arrivingAirport}</p>
                            <p>{schedInParsed}</p>
                        </div>
                    </div>
                )}

                <TooltipWrapper text={`${localApiConnected ? 'Connected to' : 'Disconnected from'} Local API`}>
                    {localApiConnected ? (
                        <Wifi size={26} />
                    ) : (
                        <WifiOff size={26} />
                    )}
                </TooltipWrapper>

                <BatteryStatus batteryLevel={batteryLevel} isCharging={isCharging} />

                <TooltipWrapper text="Turn off or Shutdown EFB">
                    <Power size={26} {...bind} />
                </TooltipWrapper>
            </div>
        </div>
    );
};
