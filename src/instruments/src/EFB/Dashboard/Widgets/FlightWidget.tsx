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

import React, { useState } from 'react';
import { IconPlane } from '@tabler/icons';
import { IconPlaneDeparture } from '@tabler/icons';
import { IconPlaneArrival } from '@tabler/icons';

type FlightWidgetProps = {
    name: string,
    dep: string,
    arr: string,
    std: string,
    sta: string,
    elapsedTime: string,
    distance: string,
    eta: string,
    timeSinceStart: string,
}

const FlightWidget = (props: FlightWidgetProps) => {

    const std = new Date(parseInt(props.std) * 1000);
    const sta = new Date(parseInt(props.sta) * 1000);

    return (
        <div className="flight-widget">
            <div id={'flight-' + props.name} className="flight-card">
                <div className="flight-widget-toolbar">
                    <a
                        id="primary-button"
                        href="/dashboard/primary"
                        style={props.name === "todays" ? {borderBottom: "solid #00C2CB .1em"} : {borderBottom: "none"}}
                    >
                        Primary
                    </a>
                    <a
                        id="secondary-button"
                        href="/dashboard/secondary"
                        style={props.name !== "todays" ? {borderBottom: "solid #00C2CB .1em"} : {borderBottom: "none"}}
                    >
                        Secondary
                    </a>
                </div>

                <div className="origin-destination">
                    <span>{props.dep}</span>
                    &nbsp;&nbsp;
                    <IconPlane size={40} stroke={1.5} strokeLinejoin="miter" />
                    &nbsp;&nbsp;
                    <span>{props.arr}</span>
                </div>

                <div className="flight-schedule">
                    <div id="std">
                        <h5 className="title">
                            STD &nbsp; <IconPlaneDeparture size={25} stroke={1.5} strokeLinejoin="miter" />
                        </h5>
                        <span>{std.getUTCHours().toString().padStart(2, '0') + ":" + std.getUTCMinutes().toString().padStart(2, '0') + "z"}</span>
                    </div>
                    <div id="sta">
                        <h5 className="title">
                            <IconPlaneArrival size={25} stroke={1.5} strokeLinejoin="miter" /> &nbsp; STA
                        </h5>
                        <span>{sta.getUTCHours().toString().padStart(2, '0') + ":" + sta.getUTCMinutes().toString().padStart(2, '0') + "z"}</span>
                    </div>
                </div>

                <div className="flight-times">

                </div>
            </div>
        </div>
    );
};

export default FlightWidget;