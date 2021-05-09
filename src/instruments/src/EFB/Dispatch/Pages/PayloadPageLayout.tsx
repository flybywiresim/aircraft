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

import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconBox, IconMan, IconLifebuoy, IconFriends, IconScale, IconPlayerPlay, IconHandStop } from '@tabler/icons';
import { round } from 'lodash';
import { Slider } from '../../Components/Form/Slider';
import nose from '../../Assets/320neo-outline-nose.svg';
import Fuselage from './Fuselage';
import { RootState } from '../../Store';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import { useSimVarSyncedPersistentProperty } from '../../../Common/persistence';
import { ProgressBar } from '../../Components/Progress/Progress';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import '../Styles/Payload.scss';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import TargetSelector from './TargetSelector';

const MAX_SEAT_AVAILABLE = 174;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

interface PaxStation {
    name: string;
    seats: number;
    weight: number;
    pax: number;
    paxTarget: number;
    stationIndex: number;
    position: number;
    seatsRange: Array<number>;
}

interface PayloadStation {
    name: string;
    weight: number;
    currentWeight: number;
    stationIndex: number;
    position: number;
}

const PayloadPage = () => {
    const paxStations: {[index: string]: PaxStation} = {
        rows1_6: {
            name: 'ECONOMY ROWS 1-6',
            seats: 36,
            weight: 3024,
            pax: 0,
            paxTarget: 0,
            stationIndex: 2 + 1,
            position: 21.98,
            seatsRange: [1, 36],
        },
        rows7_13: {
            name: 'ECONOMY ROWS 7-13',
            seats: 42,
            weight: 3530,
            pax: 0,
            paxTarget: 0,
            stationIndex: 3 + 1,
            position: 2.86,
            seatsRange: [37, 78],
        },
        rows14_20: {
            name: 'ECONOMY ROWS 14-20',
            seats: 48,
            weight: 4032,
            pax: 0,
            paxTarget: 0,
            stationIndex: 4 + 1,
            position: -15.34,
            seatsRange: [79, 126],
        },
        rows21_27: {
            name: 'ECONOMY ROWS 21-27',
            seats: 48,
            weight: 4032,
            pax: 0,
            paxTarget: 0,
            stationIndex: 5 + 1,
            position: -32.81,
            seatsRange: [127, 174],
        },
    };

    const payloadStations: {[index: string]: PayloadStation} = {
        fwdBag: {
            name: 'FWD BAGGAGE/CONTAINER',
            weight: 3402,
            currentWeight: 0,
            stationIndex: 6 + 1,
            position: 18.28,
        },
        aftCont: {
            name: 'AFT CONTAINER',
            weight: 2426,
            currentWeight: 0,
            stationIndex: 7 + 1,
            position: -15.96,
        },
        aftBag: {
            name: 'AFT BAGGAGE',
            weight: 2110,
            currentWeight: 0,
            stationIndex: 8 + 1,
            position: -27.10,
        },
        aftBulk: {
            name: 'COMP 5 - AFT BULK/LOOSE',
            weight: 1497,
            currentWeight: 0,
            stationIndex: 9 + 1,
            position: -37.35,
        },
    };

    const dispatch = useDispatch();

    const payload = useSelector((state: RootState) => state.payload);

    const zfwcg = getZfwcg().toFixed(2);

    // const totalPax = Object.values(payload).map((station) => station.pax).reduce((acc, cur) => acc + cur);
    const totalPaxTarget = Object.values(payload).map((station) => station.paxTarget).reduce((acc, cur) => acc + cur);

    const currentUnit = () => 'KG';
    const convertUnit = () => 1;

    function setPax(numberOfPax) {

    }

    function getPayload() {
        return 15000;
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

    function airplaneCanRefuel() {
        return true;
    }

    function totalCurrentPax() {
        return 100;
    }

    function formatBoardingStatusClass(baseClass:string, text:boolean) {
        return `${baseClass} disabled-text`;
    }

    function formatBoardingStatusLabel() {
        return '(Unavailable)';
    }

    function toggleBoardingState() {

    }

    function calculateEta() {

    }

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

    function renderPayloadStations() {
        return Object.entries(payloadStations).map(([stationKey, station]) => (
            <>
                <TargetSelector
                    key={stationKey}
                    name={station.name}
                    placeholder={station.totalPaxTarget}
                    max={station.weight}
                    value={station.currentWeight}
                    completed={(100 / station.weight) * 100}
                    onChange={() => {}}
                />
                <div className="station-separation-line" />
            </>
        ));
    }

    function renderPaxStations() {
        return Object.entries(paxStations).map(([stationKey, station]) => (
            <>
                <TargetSelector
                    key={stationKey}
                    name={station.name}
                    placeholder={station.totalPaxTarget}
                    max={station.seats}
                    value={station.paxTargetRows}
                    completed={(100 / station.seats) * 100}
                    onChange={() => {}}
                />
                <div className="station-separation-line" />
            </>
        ));
    }

    return (
        <div className="px-6">
            <div className="flex w-full">
                <div className="w-1/2">

                    <div className="text-white px-6">
                        <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden boarding-panel-info">
                            <TargetSelector
                                key="boarding"
                                name="Boarding"
                                placeholder={totalPaxTarget}
                                max={MAX_SEAT_AVAILABLE}
                                value={totalPaxTarget}
                                completed={(100 / MAX_SEAT_AVAILABLE) * 100}
                            />
                            <div className="separation-line-refuel" />
                            <div className="manage-refuel">
                                <div className={formatBoardingStatusClass('refuel-icon', false)}>
                                    <Button className="refuel-button" onClick={() => toggleBoardingState()} type={BUTTON_TYPE.NONE}>
                                        <IconPlayerPlay className={false ? 'hidden' : ''} />
                                        <IconHandStop className={false ? '' : 'hidden'} />
                                    </Button>
                                </div>
                                <span className="eta-label">
                                    Est:
                                    {calculateEta()}
                                    min
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-white px-6">
                        <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden mt-4 boarding-panel-info">
                            {renderPaxStations()}
                        </div>
                    </div>

                </div>
                <div className="w-1/2">
                    <div className="flex flex-wrap -mx-3 overflow-hidden mb-4">

                        <div className="px-3 w-1/4 overflow-hidden">
                            <div className="bg-gray-800 rounded-xl text-white shadow-lg weights-panel-info p-6 overflow-hidden">
                                <h3 className="font-medium">ZFW CG:</h3>
                                <div className="flex py-3">
                                    30.0% MAC
                                </div>
                            </div>
                        </div>

                        <div className="px-3 w-1/4 overflow-hidden">
                            <div className="bg-gray-800 rounded-xl text-white shadow-lg weights-panel-info p-6 overflow-hidden">
                                <h3 className="font-medium">ZFW:</h3>
                                <div className="flex py-3">
                                    44.500 KG
                                </div>
                            </div>
                        </div>

                        <div className="px-3 w-1/4 overflow-hidden">
                            <div className="bg-gray-800 rounded-xl text-white shadow-lg weights-panel-info p-6 overflow-hidden">
                                <h3 className="font-medium">PAYLOAD:</h3>
                                <div className="flex py-3">
                                    44.500 KG
                                </div>
                            </div>
                        </div>

                        <div className="px-3 w-1/4 overflow-hidden">
                            <div className="bg-gray-800 rounded-xl text-white shadow-lg weights-panel-info p-6 overflow-hidden">
                                <h3 className="font-medium">CARGO:</h3>
                                <div className="flex py-3">
                                    44.500 KG
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg overflow-x-hidden">
                        {renderPayloadStations()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayloadPage;
