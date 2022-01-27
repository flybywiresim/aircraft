import React, { useState, useEffect } from 'react';
import { Wifi2, Power } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { usePersistentProperty, usePersistentNumberProperty } from '@instruments/common/persistence';
import { usePower, PowerStates } from '../Efb';

import { BatteryStatus } from './BatteryStatus';
import { useAppSelector } from '../Store/store';
import { initialState } from '../Store/features/simBrief';

type StatusBarProps = {
    batteryLevel: number;
    isCharging: boolean;
};

export const StatusBar = ({ batteryLevel, isCharging }: StatusBarProps) => {
    const [currentUTC] = useSimVar('E:ZULU TIME', 'seconds');
    const [currentLocalTime] = useSimVar('E:LOCAL TIME', 'seconds');
    const [dayOfWeek] = useSimVar('E:ZULU DAY OF WEEK', 'number');
    const [monthOfYear] = useSimVar('E:ZULU MONTH OF YEAR', 'number');
    const [dayOfMonth] = useSimVar('E:ZULU DAY OF MONTH', 'number');
    const [showStatusBarFlightProgress] = usePersistentNumberProperty('EFB_SHOW_STATUSBAR_FLIGHTPROGRESS', 1);

    const [timeDisplayed] = usePersistentProperty('EFB_TIME_DISPLAYED', 'utc');
    const [timeFormat] = usePersistentProperty('EFB_TIME_FORMAT', '12');

    const power = usePower();

    const getDayName = (day: number) => ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'][day];

    const getMonthName = (month: number) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1];

    const getZuluFormattedTime = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}z`;
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

    useEffect(() => {
        const interval = setInterval(() => {
            setShowSchedTimes((old) => !old);

            setTimeout(() => {
                setShowSchedTimes((old) => !old);
            }, 5_000);
        }, 30_000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex overflow-hidden fixed justify-between items-center px-6 w-full h-10 text-lg font-medium leading-none text-theme-text bg-theme-statusbar">
            <p>{`${getDayName(dayOfWeek)} ${getMonthName(monthOfYear)} ${dayOfMonth}`}</p>
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
                        className="flex overflow-hidden flex-row items-center space-x-4"
                        onClick={() => setShowSchedTimes((old) => !old)}
                    >
                        <div className={`${showSchedTimes ? '-translate-y-1/4' : 'translate-y-1/4'} transform transition text-right duration-100 flex flex-col space-y-1`}>
                            <p>{departingAirport}</p>
                            <p>{schedInParsed}</p>
                        </div>
                        <div className="flex flex-row w-32">
                            <div className="h-1 bg-theme-highlight" style={{ width: `${flightPlanProgress}%` }} />
                            <div className="h-1 bg-theme-text" style={{ width: `${100 - flightPlanProgress}%` }} />
                        </div>
                        <div className={`${showSchedTimes ? '-translate-y-1/4' : 'translate-y-1/4'} transform transition duration-100 flex flex-col space-y-1`}>
                            <p>{arrivingAirport}</p>
                            <p>{schedOutParsed}</p>
                        </div>
                    </div>
                )}

                <div className="mb-1.5">
                    <Wifi2 size={32} />
                </div>

                <BatteryStatus batteryLevel={batteryLevel} isCharging={isCharging} />

                {/* Show overlay to either power down or restart when this is held down, set to standby mode otherwise */}
                <Power size={26} onClick={() => power.setPowerState(PowerStates.SHUTOFF)} />
            </div>
        </div>
    );
};
