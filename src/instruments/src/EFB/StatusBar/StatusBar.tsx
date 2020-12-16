/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
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

import React from "react";
import { IconBatteryCharging } from '@tabler/icons';

type TimeProps = {
    initTime: Date,
    updateTimeSinceStart: Function,
    updateCurrentTime: Function,
}
type TimeState = {
    currentTime: Date,
    timeSinceStart: string
}

export default class StatusBar extends React.Component<TimeProps, any> {
    state: TimeState = {
        currentTime: this.props.initTime,
        timeSinceStart: "",
    }

    interval: any;

    componentDidMount() {
        this.interval = setInterval(() => {
            const date = new Date();
            const timeSinceStart = this.timeSinceStart(date);
            this.props.updateCurrentTime(date);
            this.props.updateTimeSinceStart(timeSinceStart);
            this.setState({
                currentTime: date,
                timeSinceStart: timeSinceStart,
            });
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
        return (
            <div className="status-bar">
                <div className="status-bar-item">
                    flyPad
                </div>
                <div className="status-bar-item">
                    {formatTime(([this.state.currentTime.getUTCHours(), this.state.currentTime.getMinutes()])) + 'z'}
                </div>
                <div className="status-bar-item">
                    100% <IconBatteryCharging className="battery-icon" size={25} color="yellow" stroke={1.5} strokeLinejoin="miter" />
                </div>
            </div>
        );
    }
}

export function formatTime(numbers: number[]) {
    if (numbers.length === 2) {
        return (numbers[0] <= 9 ? "0" : "") + numbers[0] + ":" + (numbers[1] <= 9 ? "0" : "") + numbers[1];
    } else if (numbers.length === 3) {
        return (numbers[0] <= 9 ? "0" : "") + numbers[0] + ":" + (numbers[1] <= 9 ? "0" : "") + numbers[1] + ":" + (numbers[2] <= 9 ? "0" : "") + numbers[2];
    } else {
        return "N/A";
    }
}

export function dateFormat(date: number): string {
    let numberWithSuffix = "0";
    const dateRemOf10 = date % 10;
    const dateRemOf100 = date % 100;

    if ((dateRemOf10 === 1) && (dateRemOf100 !== 11)) {
        numberWithSuffix = date + "st";
    } else if ((dateRemOf10 === 2) && (dateRemOf100 !== 12)) {
        numberWithSuffix = date + "nd";
    } else if ((dateRemOf10 === 3) && (dateRemOf100 !== 13)) {
        numberWithSuffix = date + "rd";
    } else {
        numberWithSuffix = date + "th";
    }

    return numberWithSuffix;
}
