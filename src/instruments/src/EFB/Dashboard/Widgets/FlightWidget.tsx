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
    airline: string,
    flightNum: string,
    aircraftReg: string,
    dep: string,
    arr: string,
    std: string,
    sta: string,
    elapsedTime: string,
    distance: string,
    eta: string,
    timeSinceStart: string,
    fetchSimbrief: Function
}

const FlightWidget = (props: FlightWidgetProps) => {
    return (
        <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg text-base">
            <div id={'flight-' + props.name}>
                <div className="text-center mb-6">
                    <h1 className="text-xl leading-5">{props.airline + props.flightNum}</h1>
                    <span className="text-sm">{props.aircraftReg}</span>
                </div>

                <div className="flex items-center justify-center mb-6 text-base">
                    [BOM] <span className="mx-3 text-3xl">{props.dep}</span>
                    <IconPlane size={35} stroke={1.5} strokeLinejoin="miter" />
                    <span className="mx-3 text-3xl">{props.arr}</span> [DEL]
                </div>

                <div className="flex mb-6">
                    <div className="w-1/2 mr-4">
                        <div className="flex justify-end">
                            STD <IconPlaneDeparture className="ml-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                        </div>
                        <div className="text-right mt-1">{props.std}z</div>
                    </div>
                    <div className="w-1/2 ml-4">
                        <div className="flex justify-start">
                            <IconPlaneArrival className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" /> STA
                        </div>
                        <div className="text-left mt-1">{props.sta}z</div>
                    </div>
                </div>

                <div className="flex justify-center text-center font-mono mb-6 max-w-md text-sm">
                    AKRIB Q23 INTIL W19 IKAVA Q23 IBANI W19 BPL W20 HIA W71 LURGI Q21 TELUV [{props.distance}]
                </div>

                <div className="text-sm">
                    <button onClick={() => props.fetchSimbrief()} className="w-full bg-blue-500 p-2 text-white flex items-center justify-center rounded-lg mb-2 focus:outline-none">
                        FROM SIMBRIEF
                    </button>
                    <button className="w-full bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none">
                        MCDU LINK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlightWidget;
