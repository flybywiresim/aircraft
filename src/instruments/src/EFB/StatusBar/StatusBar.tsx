/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import { IconAccessPoint, IconBattery4, IconBatteryCharging, IconWifi } from '@tabler/icons';
import { connect } from 'react-redux';
import { efbClearState } from '../Store/action-creator/efb';

declare const SimVar;

type Props = {
    initTime: Date,
    updateTimeSinceStart: Function,
    updateCurrentTime: Function,
    efbClearState: () => {}
}

type TimeState = {
    currentTime: Date,
    timeSinceStart: string
}

class StatusBar extends React.Component<Props, TimeState> {
    interval: any;

    constructor(props: Props) {
        super(props);
        this.state = {
            currentTime: this.props.initTime,
            timeSinceStart: '',
        };
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            const date = new Date();
            const timeSinceStart = this.timeSinceStart(date);
            this.props.updateCurrentTime(date);
            this.props.updateTimeSinceStart(timeSinceStart);
            this.setState({ currentTime: date });
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    timeSinceStart(currentTime: Date) {
        const diff = currentTime.getTime() - this.props.initTime.getTime();
        const minutes = Math.floor(diff / 1000 / 60);
        const diffMinusMinutes = diff - (minutes * 1000 * 60);
        const seconds = Math.floor(diffMinusMinutes / 1000);

        return formatTime(([minutes, seconds]));
    }

    render() {
        const { efbClearState } = this.props;

        return (
            <div className="fixed w-full py-2 px-8 flex items-center justify-between bg-navy-medium text-white font-medium leading-none">
                <div className="flex items-center">
                    <IconAccessPoint className="mr-2" size={22} stroke={1.5} strokeLinejoin="miter" />
                    flyPad
                </div>
                <div>{`${formatTime(([this.state.currentTime.getUTCHours(), this.state.currentTime.getUTCMinutes()]))}z`}</div>
                <div className="flex items-center">
                    100%

                    {/* TODO find a way to use `setSimVar` here */}
                    <IconBattery4
                        onClick={() => {
                            efbClearState();
                            SimVar.SetSimVarValue('L:A32NX_EFB_TURNED_ON', 'number', 0);
                        }}
                        className="ml-2"
                        size={25}
                        stroke={1.5}
                        strokeLinejoin="miter"
                    />
                </div>
            </div>
        );
    }
}

export default connect(
    () => {},
    { efbClearState },
)(StatusBar);

export function formatTime(numbers: number[]) {
    if (numbers.length === 2) {
        return `${(numbers[0] <= 9 ? '0' : '') + numbers[0]}:${numbers[1] <= 9 ? '0' : ''}${numbers[1]}`;
    } if (numbers.length === 3) {
        return `${(numbers[0] <= 9 ? '0' : '') + numbers[0]}:${numbers[1] <= 9 ? '0' : ''}${numbers[1]}:${numbers[2] <= 9 ? '0' : ''}${numbers[2]}`;
    }
    return 'N/A';
}

export function dateFormat(date: number): string {
    let numberWithSuffix = '0';
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
