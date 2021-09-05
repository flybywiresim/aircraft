import React, { useState, useEffect, useContext } from 'react';
import { IconAccessPoint, IconBattery4, IconPower } from '@tabler/icons';
import { connect } from 'react-redux';
import { efbClearState } from '../Store/action-creator/efb';

import { PowerContext, ContentState } from '../index';

type StatusBarProps = {
    initTime: Date,
    updateTimeSinceStart: (newTimeSinceStart: string) => void,
    updateCurrentTime: (newCurrentTime: Date) => void,
    efbClearState: () => {}
}

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

const StatusBar = (props: StatusBarProps) => {
    const [currentTime, setCurrentTime] = useState(props.initTime);

    const Power = useContext(PowerContext);

    function calculateTimeSinceStart(currentTime: Date) {
        const diff = currentTime.getTime() - props.initTime.getTime();
        const minutes = Math.floor(diff / 1000 / 60);
        const diffMinusMinutes = diff - (minutes * 1000 * 60);
        const seconds = Math.floor(diffMinusMinutes / 1000);

        return formatTime(([minutes, seconds]));
    }

    useEffect(() => {
        setInterval(() => {
            const date = new Date();
            const timeSinceStart = calculateTimeSinceStart(date);
            props.updateCurrentTime(date);
            props.updateTimeSinceStart(timeSinceStart);
            setCurrentTime(date);
        }, 1000);

        return () => clearInterval();
    }, []);

    const { efbClearState } = props;

    return (
        <div className="fixed w-full py-2 px-8 flex items-center justify-between bg-navy-medium text-white font-medium leading-none text-lg">
            <div className="flex items-center">
                <IconAccessPoint className="mr-2 animate-pulse" size={30} stroke={1.5} strokeLinejoin="miter" />
                flyPad
            </div>
            <div>{`${formatTime(([currentTime.getUTCHours(), currentTime.getUTCMinutes()]))}z`}</div>
            <div className="flex items-center">
                100%

                {/* TODO find a way to use `setSimVar` here */}
                <IconBattery4
                    className="ml-2"
                    size={30}
                    stroke={1.5}
                    strokeLinejoin="miter"
                />
                <IconPower
                    onClick={() => {
                        efbClearState();
                        Power.setContent(ContentState.OFF);
                    }}
                    className="ml-6"
                    size={25}
                    stroke={1.5}
                    strokeLinejoin="miter"
                />
            </div>
        </div>
    );
};

export default connect(
    () => {},
    { efbClearState },
)(StatusBar);
