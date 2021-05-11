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

import React, { useCallback, useState } from 'react';
import round from 'lodash/round';
import { IconPlayerPlay, IconHandStop, IconLoader } from '@tabler/icons';
import { useSimVar, useSplitSimVar } from '../../../Common/simVars';
import { useSimVarSyncedPersistentProperty } from '../../../Common/persistence';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import TargetSelector from './TargetSelector';
import { getSimbriefData } from '../../SimbriefApi';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import '../Styles/Payload.scss';

const MAX_SEAT_AVAILABLE = 174;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

interface PaxStation {
    name: string;
    seats: number;
    weight: number;
    stationIndex: number;
    position: number;
    seatsRange: Array<number>;
    paxTotalRows: number;
    paxTargetRows: number;
    setPaxTargetRows: (newValueOrSetter: any) => void;
    setPaxTotalRow: (newValueOrSetter: any) => void;
}

interface CargoStation {
    name: string;
    weight: number;
    currentWeight: number;
    stationIndex: number;
    position: number;
    setPayload: (newValueOrSetter: any) => void;
    visible: boolean;
}

const PayloadPage = () => {
    const [boardingStartedByUser, setBoardingStartedByUser] = useSimVar('L:A32NX_BOARDING_STARTED_BY_USR', 'Bool');
    const [boardingRate, setBoardingRate] = useSimVarSyncedPersistentProperty('L:A32NX_BOARDING_RATE_SETTING', 'Number', 'BOARDING_RATE_SETTING');

    const [paxTargetRows1_6, setPaxTargetRows1_6] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6_DESIRED', 'Number');
    const [paxTotalRows1_6, _setPaxTotalRows1_6] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number');

    const [paxTargetRows7_13, setPaxTargetRows7_13] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13_DESIRED', 'Number');
    const [paxTotalRows7_13, _setPaxTotalRows7_13] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number');

    const [paxTargetRows14_20, setPaxTargetRows14_20] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_20_DESIRED', 'Number');
    const [paxTotalRows14_20, _setPaxTotalRows14_20] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_20', 'Number');

    const [paxTargetRows21_27, setPaxTargetRows21_27] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_21_27_DESIRED', 'Number');
    const [paxTotalRows21_27, _setPaxTotalRows21_27] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_21_27', 'Number');

    const [pilot, setPilot] = useSimVar('PAYLOAD STATION WEIGHT:1', 'kilograms');
    const [firstOfficer, setFirstOfficer] = useSimVar('PAYLOAD STATION WEIGHT:2', 'kilograms');
    const [fwdBag, setFwdBag] = useSimVar('PAYLOAD STATION WEIGHT:7', 'kilograms');
    const [aftCont, setAftCont] = useSimVar('PAYLOAD STATION WEIGHT:8', 'kilograms');
    const [aftBag, setAftBag] = useSimVar('PAYLOAD STATION WEIGHT:9', 'kilograms');
    const [aftBulk, setAftBulk] = useSimVar('PAYLOAD STATION WEIGHT:10', 'kilograms');

    const [jetWayActive, setJetWayActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 'K:TOGGLE_JETWAY', 'bool', 1000);
    const [_rampActive, setRampActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 'K:TOGGLE_RAMPTRUCK', 'bool', 1000);
    // const [cargoActive, setCargoActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:5', 'Percent over 100', 'K:REQUEST_LUGGAGE', 'bool', 1000);
    // const [cateringActive, setCateringActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:3', 'Percent over 100', 'K:REQUEST_CATERING', 'bool', 1000);

    const [fetchingFromSimBrief, setFetchingFromSimBrief] = useState<boolean>(false);

    const paxStations: {[index: string]: PaxStation} = {
        rows1_6: {
            name: 'ECONOMY ROWS 1-6',
            seats: 36,
            weight: 3024,
            stationIndex: 2 + 1,
            position: 21.98,
            seatsRange: [1, 36],
            paxTotalRows: paxTotalRows1_6,
            paxTargetRows: paxTargetRows1_6,
            setPaxTotalRow: setPaxTargetRows1_6,
            setPaxTargetRows: setPaxTargetRows1_6,
        },
        rows7_13: {
            name: 'ECONOMY ROWS 7-13',
            seats: 42,
            weight: 3530,
            stationIndex: 3 + 1,
            position: 2.86,
            seatsRange: [37, 78],
            paxTotalRows: paxTotalRows7_13,
            paxTargetRows: paxTargetRows7_13,
            setPaxTotalRow: setPaxTargetRows7_13,
            setPaxTargetRows: setPaxTargetRows7_13,
        },
        rows14_20: {
            name: 'ECONOMY ROWS 14-20',
            seats: 48,
            weight: 4032,
            stationIndex: 4 + 1,
            position: -15.34,
            seatsRange: [79, 126],
            paxTotalRows: paxTotalRows14_20,
            paxTargetRows: paxTargetRows14_20,
            setPaxTotalRow: setPaxTargetRows14_20,
            setPaxTargetRows: setPaxTargetRows14_20,
        },
        rows21_27: {
            name: 'ECONOMY ROWS 21-27',
            seats: 48,
            weight: 4032,
            stationIndex: 5 + 1,
            position: -32.81,
            seatsRange: [127, 174],
            paxTotalRows: paxTotalRows21_27,
            paxTargetRows: paxTargetRows21_27,
            setPaxTotalRow: setPaxTargetRows21_27,
            setPaxTargetRows: setPaxTargetRows21_27,
        },
    };

    const payloadStations: {[index: string]: CargoStation} = {
        pilot: {
            name: 'PILOT',
            weight: 84,
            stationIndex: 0 + 1,
            position: 42.36,
            currentWeight: pilot,
            setPayload: setPilot,
            visible: false,
        },
        firstOfficer: {
            name: 'FIRST OFFICER',
            weight: 84,
            stationIndex: 1 + 1,
            position: 42.36,
            currentWeight: firstOfficer,
            setPayload: setFirstOfficer,
            visible: false,
        },
        fwdBag: {
            name: 'FWD BAGGAGE/CONTAINER',
            weight: 3402,
            stationIndex: 6 + 1,
            position: 18.28,
            currentWeight: fwdBag,
            setPayload: setFwdBag,
            visible: true,
        },
        aftCont: {
            name: 'AFT CONTAINER',
            weight: 2426,
            stationIndex: 7 + 1,
            position: -15.96,
            currentWeight: aftCont,
            setPayload: setAftCont,
            visible: true,
        },
        aftBag: {
            name: 'AFT BAGGAGE',
            weight: 2110,
            stationIndex: 8 + 1,
            position: -27.10,
            currentWeight: aftBag,
            setPayload: setAftBag,
            visible: true,
        },
        aftBulk: {
            name: 'COMP 5 - AFT BULK/LOOSE',
            weight: 1497,
            stationIndex: 9 + 1,
            position: -37.35,
            currentWeight: aftBulk,
            setPayload: setAftBulk,
            visible: true,
        },
    };

    const [busDC2] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', 1_000);
    const [busDCHot1] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'Bool', 1_000);
    const [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 1_000);
    const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'Bool', 1_000);
    const [eng2Running] = useSimVar('ENG COMBUSTION:2', 'Bool', 1_000);

    const zfwcg = getZfwcg().toFixed(2);

    const totalPax = Object.values(paxStations).map((station) => station.paxTotalRows).reduce((acc, cur) => acc + cur);
    const totalPaxTarget = Object.values(paxStations).map((station) => station.paxTargetRows).reduce((acc, cur) => acc + cur);

    const [usingMetrics, setUsingMetrics] = useSimVarSyncedPersistentProperty('L:A32NX_CONFIG_USING_METRIC_UNIT', 'Number', 'CONFIG_USING_METRIC_UNIT');

    const currentUnit = () => {
        if (usingMetrics === 1) {
            return 'KG';
        }
        return 'LB';
    };

    const convertUnit = (unitInMetrics) => {
        if (usingMetrics === 1) {
            return unitInMetrics;
        }
        return unitInMetrics * 2.20462;
    };

    const lbsToKg = (value: number) => value * 0.453592;

    async function fetchSimbriefData() {
        console.log('fetchSimbriefData');

        const simbriefUsername = window.localStorage.getItem('SimbriefUsername');

        if (!simbriefUsername) {
            return;
        }

        setFetchingFromSimBrief(true);

        const simbriefData = await getSimbriefData(simbriefUsername);

        const { weights, units } = simbriefData;
        const { passengerCount } = weights;

        let cargo = units === 'kgs' ? weights.cargo : round(lbsToKg(weights.cargo));
        const passengerWeight = units === 'kgs' ? weights.passengerWeight : round(lbsToKg(weights.passengerWeight));

        if (passengerWeight < 104) {
            // Passenger weight is too low. TODO display an error message
            // In this case, we consider 104kg and the weights values
            // from simbrief will be different from the simulator
        } else if (passengerWeight > 104) {
            // If the passenger weight is greater than 104kg, we use the excess as cargo
            cargo += (+passengerWeight - 104) * passengerCount;
        }

        await setCargo(cargo);
        await setPax(passengerCount);

        setFetchingFromSimBrief(false);
    }

    async function setCargo(cargoWeight) {
        console.log('setCargo', cargoWeight);

        let weightRemaining = parseInt(cargoWeight);

        async function fillStation(station: CargoStation, weightToFill) {
            const weight = Math.min(weightToFill, station.weight);

            await station.setPayload(weight);

            weightRemaining -= weight;
        }

        for (const station of Object.values(payloadStations).reverse()) {
            // We want strictly to wait until each iteration is finished before start another
            // eslint-disable-next-line no-await-in-loop
            await fillStation(station, weightRemaining);
        }
    }

    async function setPax(numberOfPax) {
        console.log('setPax', numberOfPax);

        let paxRemaining = parseInt(numberOfPax);

        async function fillStation(station: PaxStation, paxToFill) {
            const pax = Math.min(paxToFill, station.seats);

            await station.setPaxTargetRows(pax);

            paxRemaining -= pax;
        }

        await fillStation(paxStations.rows21_27, paxRemaining);
        await fillStation(paxStations.rows14_20, paxRemaining);

        const remainingByTwo = Math.trunc(paxRemaining / 2);
        await fillStation(paxStations.rows1_6, remainingByTwo);
        await fillStation(paxStations.rows7_13, paxRemaining);
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
        // TODO : REMOVE THIS IF WHENEVER PERSISTANCE IS IMPLEMENTED
        if (usingMetrics !== 1) {
            setUsingMetrics(1);
        }
        if (simGroundSpeed > 0.1 || eng1Running || eng2Running || !isOnGround || (!busDC2 && !busDCHot1)) {
            return false;
        }
        return true;
    }

    function totalCurrentPax() {
        return totalPax;
    }

    function formatBoardingStatusClass(baseClass:string, text:boolean) {
        let suffix = '';
        if (text) {
            suffix = '-text';
        }
        if (airplaneCanRefuel()) {
            if (totalPaxTarget === totalCurrentPax() || !boardingStartedByUser) {
                if (boardingStartedByUser) {
                    // setBoardingStartedByUser(false);
                }
                return `${baseClass} completed${suffix}`;
            }
            return ((totalPaxTarget) > (totalCurrentPax())) ? `${baseClass} refuel${suffix}` : `${baseClass} defuel${suffix}`;
        }
        return `${baseClass} disabled${suffix}`;
    }

    function formatBoardingStatusLabel() {
        if (airplaneCanRefuel()) {
            if (round(totalPaxTarget) === totalCurrentPax()) {
                return '(Completed)';
            }
            if (boardingStartedByUser) {
                return ((totalPaxTarget) > (totalCurrentPax())) ? '(Boarding...)' : '(Disembarking...)';
            }
            return '(Ready to start)';
        }
        if (boardingStartedByUser) {
            setBoardingStartedByUser(false);
        }
        return '(Unavailable)';
    }

    function toggleBoardingState() {
        if (airplaneCanRefuel()) {
            if (!boardingStartedByUser) {
                if (jetWayActive < 0.5) {
                    setJetWayActive(1);
                    setRampActive(1);
                }
            } else if (jetWayActive > 0.5) {
                setJetWayActive(1);
                setRampActive(1);
            }
            setBoardingStartedByUser(!boardingStartedByUser);
        }
    }

    function calculateEta() {
        if (round(totalPaxTarget) === totalCurrentPax() || boardingRate === 2) {
            return 0;
        }

        let msDelay = 1000;
        if (boardingRate === 1) {
            msDelay = 500;
        }

        const estimatedTimeSeconds = totalPaxTarget / (1000 / msDelay);
        return Math.round(estimatedTimeSeconds / 60);
    }

    /**
     * Calculate %MAC ZWFCG of all stations
     */
    function getZfwcg() {
        const currentPaxWeight = PAX_WEIGHT + BAG_WEIGHT;

        const leMacZ = -5.39; // Value from Debug Weight
        const macSize = 13.45; // Value from Debug Aircraft Sim Tunning

        const emptyWeight = 90400 * 0.453592; // Value from flight_model.cfg to kgs
        const emptyPosition = -8.75; // Value from flight_model.cfg
        const emptyMoment = emptyPosition * emptyWeight;

        const paxTotalMass = Object.values(paxStations).map((station) => station.paxTargetRows * currentPaxWeight).reduce((acc, cur) => acc + cur, 0);
        const paxTotalMoment = Object.values(paxStations).map((station) => (station.paxTargetRows * currentPaxWeight) * station.position).reduce((acc, cur) => acc + cur, 0);

        const payloadTotalMass = Object.values(payloadStations).map((station) => station.currentWeight).reduce((acc, cur) => acc + cur, 0);
        const payloadTotalMoment = Object.values(payloadStations).map((station) => station.currentWeight * station.position).reduce((acc, cur) => acc + cur, 0);

        const totalMass = emptyWeight + paxTotalMass + payloadTotalMass;
        const totalMoment = emptyMoment + paxTotalMoment + payloadTotalMoment;

        const cgPosition = totalMoment / totalMass;
        const cgPositionToLemac = cgPosition - leMacZ;
        const cgPercentMac = -100 * (cgPositionToLemac / macSize);

        return cgPercentMac;
    }

    function getTotalCargo() {
        const cargoTotalMass = Object.values(payloadStations).filter((station) => station.visible).map((station) => station.currentWeight).reduce((acc, cur) => acc + cur, 0);

        return cargoTotalMass;
    }

    function getTotalPayload() {
        const currentPaxWeight = PAX_WEIGHT + BAG_WEIGHT;

        const paxTotalMass = Object.values(paxStations).map((station) => station.paxTargetRows * currentPaxWeight).reduce((acc, cur) => acc + cur, 0);
        const cargoTotalMass = getTotalCargo();

        return paxTotalMass + cargoTotalMass;
    }

    function getZfw() {
        const emptyWeight = 90400 * 0.453592; // Value from flight_model.cfg to kgs
        return emptyWeight + getTotalPayload();
    }

    function renderPayloadStations() {
        const entries = Object.entries(payloadStations).filter(([_, station]) => station.visible);
        return entries.map(([stationKey, station], index) => (
            <>
                <TargetSelector
                    key={stationKey}
                    name={station.name}
                    placeholder={round(station.currentWeight).toString()}
                    max={station.weight}
                    value={round(station.currentWeight)}
                    current={round(station.currentWeight)}
                    onChange={(value) => {
                        station.setPayload(value);
                    }}
                />
                {index !== (entries.length - 1) && <div className="station-separation-line" />}
            </>
        ));
    }

    function renderPaxStations() {
        const entries = Object.entries(paxStations);
        return entries.map(([stationKey, station], index) => (
            <div className="my-4">
                <TargetSelector
                    key={stationKey}
                    name={station.name}
                    placeholder={station.paxTargetRows.toString()}
                    max={station.seats}
                    value={station.paxTargetRows}
                    current={station.paxTotalRows}
                    onChange={(value) => {
                        station.setPaxTargetRows(value);
                    }}
                />
                {index !== (entries.length - 1) && <div className="station-separation-line" />}
            </div>
        ));
    }

    return (
        <div style={{ position: 'relative' }}>
            <div
                className="bg-gray-800 rounded-xl text-white shadow-lg overflow-x-hidden justify-center align-middle items-center boarding-time-panel"
            >
                <div className="mb-3.5 flex flex-row justify-between items-center px-4">
                    <span className="text-lg text-gray-300">Boarding Time</span>
                    <SelectGroup>
                        <SelectItem selected={boardingRate === 2} onSelect={() => setBoardingRate(2)}>Instant</SelectItem>
                        <SelectItem selected={boardingRate === 1} onSelect={() => setBoardingRate(1)}>Fast</SelectItem>
                        <SelectItem selected={boardingRate === 0} onSelect={() => setBoardingRate(0)}>Real</SelectItem>
                    </SelectGroup>
                </div>
            </div>
            <button
                type="button"
                onClick={() => fetchSimbriefData()}
                className="w-full text-lg text-white font-medium bg-blue-500 p-2 flex items-center justify-center rounded-lg mb-2 focus:outline-none simbrief-button"
            >
                {fetchingFromSimBrief && <IconLoader className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />}
                {' '}
                FROM SIMBRIEF
            </button>
            <div className="px-6">
                <div className="flex w-full">
                    <div className="w-1/2">

                        <div className="text-white px-6 mb-4">
                            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden boarding-panel-info">
                                <TargetSelector
                                    key="boarding"
                                    name="Boarding"
                                    placeholder=""
                                    max={MAX_SEAT_AVAILABLE}
                                    value={totalPaxTarget}
                                    current={totalPax}
                                    onChange={(value) => {
                                        setPax(value);
                                    }}
                                />
                                <div className="separation-line-refuel" />
                                <div className="manage-refuel">
                                    <div className={formatBoardingStatusClass('refuel-icon', false)}>
                                        <Button className="refuel-button" onClick={() => toggleBoardingState()} type={BUTTON_TYPE.NONE}>
                                            <IconPlayerPlay className={boardingStartedByUser ? 'hidden' : ''} />
                                            <IconHandStop className={boardingStartedByUser ? '' : 'hidden'} />
                                        </Button>
                                    </div>
                                    <span className="eta-label">
                                        Est:
                                        {calculateEta().toString()}
                                        {' '}
                                        min
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-white px-6">
                            <div className="bg-gray-800 rounded-xl px-6 text-white shadow-lg mr-4 overflow-x-hidden boarding-panel-info">
                                {renderPaxStations()}
                            </div>
                        </div>
                    </div>
                    <div className="w-1/2">
                        <div className="flex flex-wrap -mx-3 overflow-hidden mb-4">

                            <div className="px-3 w-1/4 overflow-hidden">
                                <div className="bg-gray-800 rounded-xl text-white shadow-lg weights-panel-info p-6 overflow-hidden">
                                    <h3 className="text-xl font-medium flex items-center">ZFW CG:</h3>
                                    <span className="mt-2 text-lg">
                                        {zfwcg}
                                        {' '}
                                        %
                                    </span>
                                </div>
                            </div>

                            <div className="px-3 w-1/4 overflow-hidden">
                                <div className="bg-gray-800 rounded-xl text-white shadow-lg weights-panel-info p-6 overflow-hidden">
                                    <h3 className="text-xl font-medium flex items-center">ZFW:</h3>
                                    <span className="mt-2 text-lg">
                                        {round(convertUnit(getZfw()))}
                                        {' '}
                                        {currentUnit()}
                                    </span>
                                </div>
                            </div>

                            <div className="px-3 w-1/4 overflow-hidden">
                                <div className="bg-gray-800 rounded-xl text-white shadow-lg weights-panel-info p-6 overflow-hidden">
                                    <h3 className="text-xl font-medium flex items-center">PAYLOAD:</h3>
                                    <span className="mt-2 text-lg">
                                        {round(convertUnit(getTotalPayload()))}
                                        {' '}
                                        {currentUnit()}
                                    </span>
                                </div>
                            </div>

                            <div className="px-3 w-1/4 overflow-hidden">
                                <div className="bg-gray-800 rounded-xl text-white shadow-lg weights-panel-info p-6 overflow-hidden">
                                    <h3 className="text-xl font-medium flex items-center">CARGO:</h3>
                                    <span className="mt-2 text-lg">
                                        {round(convertUnit(getTotalCargo()))}
                                        {' '}
                                        {currentUnit()}
                                    </span>
                                </div>
                            </div>

                        </div>

                        <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg overflow-x-hidden">
                            {renderPayloadStations()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayloadPage;
