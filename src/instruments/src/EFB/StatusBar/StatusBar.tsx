import React from 'react';
import { Wifi2, BatteryFull, Power } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
// FIXME import { efbClearState } from '../Store/action-creator/efb';
import { usePower, ContentState } from '../index';

export function formatTime(numbers: number[]) {
    if (numbers.length === 2) {
        return `${(numbers[0] <= 9 ? '0' : '') + numbers[0]}:${numbers[1] <= 9 ? '0' : ''}${numbers[1]}`;
    } if (numbers.length === 3) {
        return `${(numbers[0] <= 9 ? '0' : '') + numbers[0]}:${numbers[1] <= 9 ? '0' : ''}${numbers[1]}:${numbers[2] <= 9 ? '0' : ''}${numbers[2]}`;
    }
    return 'N/A';
}

export function dateFormat(date: number): string {
    let numberWithSuffix;
    const dateRemOf10 = date % 10;
    const dateRemOf100 = date % 100;

    if ((dateRemOf10 === 1) && (dateRemOf100 !== 11)) {
        numberWithSuffix = `${date}st`;
    } else if ((dateRemOf10 === 2) && (dateRemOf100 !== 12)) {
        numberWithSuffix = `${date}nd`;
    } else if ((dateRemOf10 === 3) && (dateRemOf100 !== 13)) {
        numberWithSuffix = `${date}rd`;
    } else {
        numberWithSuffix = `${date}th`;
    }

    return numberWithSuffix;
}

const StatusBar = () => {
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
        return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}
        :${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}z`;
    }

    return (
        <div className="flex fixed justify-between items-center px-6 w-full h-10 text-lg font-medium leading-none text-white bg-navy-medium">
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

                <Power size={26} onClick={() => power.setContent(ContentState.OFF)} />
            </div>
        </div>
    );
};

export default StatusBar;
