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

import React, { useState } from 'react';
import { IconPlane } from '@tabler/icons';
import { IconPlaneDeparture } from '@tabler/icons';
import { IconPlaneArrival } from '@tabler/icons';

type FlightWidgetProps = {
    name: string,
    airline: string,
    flightNum: string,
    aircraftReg: string,
    dep: string,
    depIata: string,
    arr: string,
    arrIata: string,
    std: string,
    sta: string,
    distance: string,
    eta: string,
    timeSinceStart: string,
    fetchSimbrief: Function,
    route: string
}

const FlightWidget = (props: FlightWidgetProps) => {
    return (
        <div id={'flight-' + props.name} className="bg-gray-800 rounded-xl p-6 text-white shadow-lg">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-medium">{props.airline + props.flightNum}</h1>
                <span>{props.aircraftReg}</span>
            </div>

            <div className="flex items-center justify-center mb-6 text-lg">
                [{props.depIata}] <span className="mx-3 text-3xl">{props.dep}</span>
                <IconPlane size={35} stroke={1.5} strokeLinejoin="miter" />
                <span className="mx-3 text-3xl">{props.arr}</span> [{props.arrIata}]
            </div>

            <div className="flex mb-6">
                <div className="w-1/2 mr-4">
                    <div className="flex justify-end text-lg">
                        STD <IconPlaneDeparture className="ml-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                    </div>
                    <div className="text-right mt-1 text-2xl">{props.std}</div>
                </div>
                <div className="w-1/2 ml-4">
                    <div className="flex justify-start text-lg">
                        <IconPlaneArrival className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> STA
                    </div>
                    <div className="text-left mt-1 text-2xl">{props.sta}</div>
                </div>
            </div>

            <div className="flex justify-center text-center font-medium mb-6 max-w-md uppercase">
                {props.route} [{props.distance}]
            </div>

            <div className="mt-8">
                <button onClick={() => props.fetchSimbrief()} className="w-full font-medium bg-blue-500 p-2 text-white flex items-center justify-center rounded-lg mb-2 focus:outline-none">
                    FROM SIMBRIEF
                </button>
                <button className="w-full font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none">
                    LINK MCDU
                </button>
            </div>
        </div>
    );
};

export default FlightWidget;
