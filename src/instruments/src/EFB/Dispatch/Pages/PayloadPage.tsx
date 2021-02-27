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

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconAlignRight, IconBox, IconBolt, IconBoxPadding } from '@tabler/icons';
import nose from '../../Assets/320neo-outline-nose.svg';
import fuselage from '../../Assets/320neo-outline-fuselage.svg';
import { RootState } from '../../Store';

const MAX_SEAT_AVAILABLE = 162;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

interface Station {
    name: string;
    seats: number;
    weight: number;
    pax: number;
    stationIndex: number,
    position: number,
}

const paxStations: {[index: string]: Station} = {
    rows1_6: {
        name: 'ECONOMY ROWS 1-6',
        seats: 36,
        weight: 3024,
        pax: 0,
        stationIndex: 2 + 1,
        position: 21.98,
    },
    rows7_13: {
        name: 'ECONOMY ROWS 7-13',
        seats: 42,
        weight: 3530,
        pax: 0,
        stationIndex: 3 + 1,
        position: 2.86,
    },
    rows14_20: {
        name: 'ECONOMY ROWS 14-20',
        seats: 42,
        weight: 3530,
        pax: 0,
        stationIndex: 4 + 1,
        position: -15.34,
    },
    rows21_27: {
        name: 'ECONOMY ROWS 21-27',
        seats: 42,
        weight: 3530,
        pax: 0,
        stationIndex: 5 + 1,
        position: -32.81,
    },
};
const payloadStations = {
    fwdBag: {
        name: 'FWD BAGGAGE/CONTAINER',
        seats: 0,
        weight: 3402,
        currentWeight: 0,
        stationIndex: 6 + 1,
        position: 18.28,
    },
    aftCont: {
        name: 'AFT CONTAINER',
        seats: 0,
        weight: 2426,
        currentWeight: 0,
        stationIndex: 7 + 1,
        position: -15.96,
    },
    aftBag: {
        name: 'AFT BAGGAGE',
        seats: 0,
        weight: 2110,
        currentWeight: 0,
        stationIndex: 8 + 1,
        position: -27.10,
    },
    aftBulk: {
        name: 'COMP 5 - AFT BULK/LOOSE',
        seats: 0,
        weight: 1497,
        currentWeight: 0,
        stationIndex: 9 + 1,
        position: -37.35,
    },
};

const PayloadPage = () => {
    const dispatch = useDispatch();

    const payload = useSelector((state: RootState) => state.payload);

    const { rows1_6: rows16 } = payload;

    /**
     * Calculate %MAC ZWFCG of all stations
     */
    function getZfwcg() {
        const currentPaxWeight = PAX_WEIGHT;

        const leMacZ = -5.233333; // Value from Debug Weight
        const macSize = 14.0623; // Value from Debug Aircraft Sim Tunning

        const emptyWeight = 90400 * 0.453592; // Value from flight_model.cfg to kgs
        const emptyPosition = -8.75; // Value from flight_model.cfg
        const emptyMoment = emptyPosition * emptyWeight;

        const paxTotalMass = Object.values(payload).map((station) => station.pax * currentPaxWeight).reduce((acc, cur) => acc + cur, 0);
        const paxTotalMoment = Object.values(payload).map((station) => (station.pax * currentPaxWeight) * station.position).reduce((acc, cur) => acc + cur, 0);

        // const payloadTotalMass = Object.values(payloadStations).map((station) => station.currentWeight).reduce((acc, cur) => acc + cur, 0);
        // const payloadTotalMoment = Object.values(payloadStations).map((station) => station.currentWeight * station.position).reduce((acc, cur) => acc + cur, 0);

        const totalMass = emptyWeight + paxTotalMass;
        const totalMoment = emptyMoment + paxTotalMoment;

        const cgPosition = totalMoment / totalMass;
        const cgPositionToLemac = cgPosition - leMacZ;
        const cgPercentMac = -100 * (cgPositionToLemac / macSize);

        return cgPercentMac;
    }

    // const [rows16, setRows16] = useState(0);
    const [rows713, setRows713] = useState(0);

    const handleChange16 = useCallback((event) => {
        const { value } = event.target;
        // setRows16(value);
        dispatch({
            type: 'PAYLOAD_SET_ROW16',
            payload: { value },
        });
    }, [dispatch]);

    function handleChange713(event) {
        setRows713(event.target.value);
    }

    const zfwcg = getZfwcg();

    return (
        <div className="px-6">
            <div className="flex w-full">
                <div className="w-1/2 bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden">
                    <h2 className="text-2xl font-medium">Airbus A320neo</h2>
                    <span>FlyByWire Simulations</span>
                    <img className="flip-vertical mt-6 h-24 -ml-24" src={nose} />
                    <div className="flex mt-8">
                        <div className="w-1/2">
                            <h3 className="text-xl font-medium flex items-center">
                                <IconBoxPadding className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                {rows16.name}
                            </h3>
                            <p className="mt-2 text-lg">
                                {rows16.pax}
                                {' '}
                                / 36
                            </p>
                            <span className="mt-2 text-lg">
                                <input
                                    type="range"
                                    min="0"
                                    max={paxStations.rows1_6.seats}
                                    value={rows16.pax}
                                    className="slider"
                                    id="slider-rows1-6"
                                    onChange={handleChange16}
                                />
                            </span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBoxPadding className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                {paxStations.rows7_13.name}
                            </h3>
                            <p className="mt-2 text-lg">
                                {rows713}
                                {' '}
                                / 36
                            </p>
                            <span className="mt-2 text-lg">
                                <input
                                    type="range"
                                    min="0"
                                    max={paxStations.rows7_13.seats}
                                    value={rows713}
                                    className="slider"
                                    id="slider-rows7-13"
                                    onChange={handleChange713}
                                />
                            </span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBoxPadding className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Rows [1-7]
                            </h3>
                            <p className="mt-2 text-lg">
                                {rows16.pax}
                                {' '}
                                / 36
                            </p>
                            <span className="mt-2 text-lg">
                                <input type="range" min="1" max="36" value={rows16.pax} className="slider" id="myRange" onChange={handleChange16} />
                            </span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBoxPadding className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Rows [1-7]
                            </h3>
                            <p className="mt-2 text-lg">
                                {rows16.pax}
                                {' '}
                                / 36
                            </p>
                            <span className="mt-2 text-lg">
                                <input type="range" min="1" max="36" value={rows16.pax} className="slider" id="myRange" onChange={handleChange16} />
                            </span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBoxPadding className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Rows [1-7]
                            </h3>
                            <p className="mt-2 text-lg">
                                {rows16.pax}
                                {' '}
                                / 36
                            </p>
                            <span className="mt-2 text-lg">
                                <input type="range" min="1" max="36" value={rows16.pax} className="slider" id="myRange" onChange={handleChange16} />
                            </span>
                        </div>
                        <div className="w-1/2">
                            <h3 className="text-xl font-medium flex items-center">
                                <IconBolt className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                ZFWCG %MAC
                            </h3>
                            <span className="mt-2 text-lg">{zfwcg}</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconAlignRight className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Mmo
                            </h3>
                            <span className="mt-2 text-lg">0.82</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                MTOW
                            </h3>
                            <span className="mt-2 text-lg">79,000 [kg]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Max Fuel Capacity
                            </h3>
                            <span className="mt-2 text-lg">23,721 [l]</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Max Cargo
                            </h3>
                            <span className="mt-2 text-lg">9,435 [kg]</span>
                        </div>
                    </div>
                </div>
                <div className="w-1/2 text-white overflow-hidden">
                    <img className="-ml-6 transform rotate-45" src={fuselage} />
                </div>
            </div>
        </div>
    );
};

export default PayloadPage;
