/* eslint-disable camelcase */
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

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconBox, IconMan, IconLifebuoy, IconFriends, IconScale } from '@tabler/icons';
import { Slider } from '@flybywiresim/react-components';
import nose from '../../Assets/320neo-outline-nose.svg';
import Fuselage from './Fuselage';
import { RootState } from '../../Store';

const MAX_SEAT_AVAILABLE = 174;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

const PayloadPage = () => {
    const dispatch = useDispatch();

    const payload = useSelector((state: RootState) => state.payload);

    const zfwcg = getZfwcg().toFixed(2);
    const totalPax = Object.values(payload).map((station) => station.pax).reduce((acc, cur) => acc + cur);

    function setPax(numberOfPax) {
        let paxRemaining = parseInt(numberOfPax);

        function fillStation(stationKey, paxToFill) {
            const pax = Math.min(paxToFill, payload[stationKey].seats);
            changeStationPax(pax, stationKey);
            paxRemaining -= pax;
        }

        fillStation('rows21_27', paxRemaining);
        fillStation('rows14_20', paxRemaining);

        const remainingByTwo = Math.trunc(paxRemaining / 2);
        fillStation('rows1_6', remainingByTwo);
        fillStation('rows7_13', paxRemaining);

        // setPayload(numberOfPax);
    }

    function setSeatColors() {
        function paintSeat(id: string, clear: boolean = false) {
            const seatGroupElement = document.getElementById(id);
            if (seatGroupElement === null) {
                return null;
            }
            const seatPolygon = seatGroupElement.children[0] as HTMLElement;

            if (clear) {
                seatPolygon.style.fill = 'inherit';
            } else {
                seatPolygon.style.fill = '#00AFB7';
            }
            return null;
        }

        Object.values(payload).forEach((station) => {
            const [min, max] = station.seatsRange;
            for (let seatNumber = min; seatNumber <= max; seatNumber++) {
                paintSeat(seatNumber.toString(), true);
            }
        });

        Object.values(payload).forEach((station) => {
            const [min] = station.seatsRange;
            for (let seatNumber = min; seatNumber < min + station.pax; seatNumber++) {
                paintSeat(seatNumber.toString());
            }
        });
    }

    setSeatColors();

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

    const changeStationPax = useCallback((value: number, stationKey: string) => {
        dispatch({
            type: 'PAYLOAD_SET_STATION_PAX',
            payload: { value, stationKey },
        });
    }, [dispatch]);

    function renderStations() {
        return Object.entries(payload).map(([stationKey, station], index) => (
            <div id={`${stationKey}-slider`}>
                <h3 className={`text-xl font-medium flex items-center ${index !== 0 && 'mt-6'}`}>
                    <IconFriends className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                    {' '}
                    {station.name}
                </h3>
                <p className="mt-2 text-lg">
                    {station.pax}
                    {' '}
                    /
                    {' '}
                    {station.seats}
                </p>
                <span className="mt-2 text-lg">
                    <Slider
                        min={0}
                        max={station.seats}
                        value={station.pax}
                        onInput={(value) => changeStationPax(value, stationKey)}
                    />
                </span>
            </div>
        ));
    }

    return (
        <div className="px-6">
            <div className="flex w-full">
                <div className="w-1/2 bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden">
                    <h2 className="text-2xl font-medium">Airbus A320neo</h2>
                    <span>FlyByWire Simulations</span>
                    <img className="flip-vertical mt-6 h-24 -ml-24" src={nose} />
                    <div className="flex mt-8">
                        <div className="w-1/2">
                            {renderStations()}
                        </div>
                        <div className="w-1/2">
                            <h3 className="text-xl font-medium flex items-center">
                                <IconFriends className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                PAX NO
                            </h3>
                            <p className="mt-2 text-lg">
                                {totalPax}
                                {' '}
                                /
                                {' '}
                                {MAX_SEAT_AVAILABLE}
                            </p>
                            <span className="mt-2 text-lg">
                                <Slider
                                    min="0"
                                    max={MAX_SEAT_AVAILABLE}
                                    value={totalPax}
                                    className="slider"
                                    id="pax-no-slider"
                                    onInput={(value) => {
                                        setPax(value);
                                    }}
                                />
                            </span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconMan className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                PAX Weight
                            </h3>
                            <p className="mt-2 text-lg">
                                {PAX_WEIGHT}
                                {' '}
                            </p>
                            <span className="mt-2 text-lg">
                                <Slider
                                    min="0"
                                    max={150}
                                    value={PAX_WEIGHT}
                                    className="slider"
                                    id="pax-weight-slider"
                                    onInput={() => {}}
                                />
                            </span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconBox className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                Baggage Weight
                            </h3>
                            <span className="mt-2 text-lg">
                                {BAG_WEIGHT}
                                {' '}
                                [kg]
                            </span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconLifebuoy className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                ZFWCG %MAC
                            </h3>
                            <span className="mt-2 text-lg">{zfwcg}</span>

                            <h3 className="text-xl font-medium flex items-center mt-6">
                                <IconScale className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                                {' '}
                                ZFW
                            </h3>
                            <span className="mt-2 text-lg">40900 [kg]</span>
                        </div>
                    </div>
                </div>
                <div className="w-1/2 text-white" style={{ position: 'relative' }}>
                    <Fuselage />
                    <div className="gradient-overlay" />
                </div>
            </div>
        </div>
    );
};

export default PayloadPage;
