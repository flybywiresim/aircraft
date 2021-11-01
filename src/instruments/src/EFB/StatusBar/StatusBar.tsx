import React from 'react';
import { Wifi2, BatteryFull, Power } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { usePower, PowerStates } from '../Efb';

export const StatusBar = () => {
    const [currentUTC] = useSimVar('E:ZULU TIME', 'seconds');
    const [dayOfWeek] = useSimVar('E:ZULU DAY OF WEEK', 'number');
    const [monthOfYear] = useSimVar('E:ZULU MONTH OF YEAR', 'number');
    const [dayOfMonth] = useSimVar('E:ZULU DAY OF MONTH', 'number');

    const power = usePower();

    function getDayName(day: number) {
        const monthNames = ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
        return monthNames[day];
    }

    function getMonthName(month: number) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[month - 1];
    }

    function getHoursAndMinutes(seconds: number) {
        return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}z`;
    }

    return (
        <div className="flex fixed justify-between items-center px-6 w-full h-10 text-lg font-medium leading-none text-theme-text bg-theme-statusbar">
            <p>
                {`${getDayName(dayOfWeek)} ${getMonthName(monthOfYear)} ${dayOfMonth}`}
            </p>
            <p className="absolute inset-x-0 mx-auto w-min">
                {getHoursAndMinutes(currentUTC)}
            </p>
            <div className="flex items-center space-x-8">
                <div className="mb-1.5">
                    <Wifi2 size={32} />
                </div>

                <div className="flex items-center space-x-4">
                    <p>100%</p>

                    {/* TODO find a way to use `setSimVar` here */}
                    <BatteryFull size={28} />
                </div>

                {/* Show overlay to either power down or restart when this is held down, set to standby mode otherwise */}
                <Power size={26} onClick={() => power.setPowerState(PowerStates.SHUTOFF)} />
            </div>
        </div>
    );
};
