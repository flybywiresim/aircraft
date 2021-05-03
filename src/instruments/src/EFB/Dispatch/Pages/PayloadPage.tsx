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
import { useSimVar } from '../../../Common/simVars';
import TargetSelector from './TargetSelector';

const MAX_SEAT_AVAILABLE = 174;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

const PayloadPage = () => {
    const [boardingStartedByUser, setBoardingStartedByUser] = useSimVar('L:A32NX_BOARDING_STARTED_BY_USR', 'Bool');
    const [boardingRate, setBoardingRate] = useSimVarSyncedPersistentProperty('L:A32NX_BOARDING_RATE_SETTING', 'Number', 'BOARDING_RATE_SETTING');

    const [paxTarget, setPaxTarget] = useSimVar('L:A32NX_PAX_TOTAL_DESIRED', 'Number');
    const [paxTotal, setPaxTotal] = useSimVar('L:A32NX_PAX_TOTAL', 'Number');

    const [paxTargetRows1_6, setPaxTargetRows1_6] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6_DESIRED', 'Number');
    const [paxTotalRows1_6, setPaxTotalRows1_6] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number');

    const [paxTargetRows7_13, setPaxTargetRows7_13] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13_DESIRED', 'Number');
    const [paxTotalRows7_13, setPaxTotalRows7_13] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number');

    const [paxTargetRows14_20, setPaxTargetRows14_20] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_20_DESIRED', 'Number');
    const [paxTotalRows14_20, setPaxTotalRows14_20] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_14_20', 'Number');

    const [paxTargetRows21_27, setPaxTargetRows21_27] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_21_27_DESIRED', 'Number');
    const [paxTotalRows21_27, setPaxTotalRows21_27] = useSimVar('L:A32NX_PAX_TOTAL_ROWS_21_27', 'Number');

    const paxStations: {[index: string]: Station} = {
        rows1_6: {
            name: 'ECONOMY ROWS 1-6',
            seats: 36,
            weight: 3024,
            pax: 0,
            paxTarget: 0,
            stationIndex: 2 + 1,
            position: 21.98,
            seatsRange: [1, 36],
            paxTotalRows: paxTotalRows1_6,
            paxTargetRows: paxTargetRows1_6,
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
            paxTotalRows: paxTotalRows7_13,
            paxTargetRows: paxTargetRows7_13,
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
            paxTotalRows: paxTotalRows14_20,
            paxTargetRows: paxTargetRows14_20,
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
            paxTotalRows: paxTotalRows21_27,
            paxTargetRows: paxTargetRows21_27,
        },
    };

    const [busDC2] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', 1_000);
    const [busDCHot1] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'Bool', 1_000);
    const [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 1_000);
    const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'Bool', 1_000);
    const [eng2Running] = useSimVar('ENG COMBUSTION:2', 'Bool', 1_000);

    const dispatch = useDispatch();

    const payload = useSelector((state: RootState) => state.payload);

    const zfwcg = getZfwcg().toFixed(2);

    // const totalPax = Object.values(payload).map((station) => station.pax).reduce((acc, cur) => acc + cur);
    const totalPaxTarget = Object.values(payload).map((station) => station.paxTarget).reduce((acc, cur) => acc + cur);

    const [usingMetrics, setUsingMetrics] = useSimVarSyncedPersistentProperty('L:A32NX_CONFIG_USING_METRIC_UNIT', 'Number', 'CONFIG_USING_METRIC_UNIT');
    const currentUnit = () => {
        if (usingMetrics === 1) {
            return 'KG';
        }
        return 'LB';
    };
    const convertUnit = () => {
        if (usingMetrics === 1) {
            return 1;
        }
        return 2.20462;
    };

    function setPax(numberOfPax) {
        console.log('setPax', numberOfPax);
        setPaxTarget(Number(numberOfPax));

        let paxRemaining = parseInt(numberOfPax);

        function fillStation(stationKey, paxToFill, setPaxTargetRows) {
            const pax = Math.min(paxToFill, payload[stationKey].seats);
            // changeStationPax(pax, stationKey);

            setPaxTargetRows(pax);

            changeStationPaxTarget(pax, stationKey);
            paxRemaining -= pax;
        }

        fillStation('rows21_27', paxRemaining, setPaxTargetRows21_27);
        fillStation('rows14_20', paxRemaining, setPaxTargetRows14_20);

        const remainingByTwo = Math.trunc(paxRemaining / 2);
        fillStation('rows1_6', remainingByTwo, setPaxTargetRows1_6);
        fillStation('rows7_13', paxRemaining, setPaxTargetRows7_13);

        // setPayload(numberOfPax);
    }

    function getPayload() {
        const weightPerPax = PAX_WEIGHT + BAG_WEIGHT;

        const payload = weightPerPax * paxTotal;

        return payload;
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
        return paxTotal;
    }

    function formatBoardingStatusClass(baseClass:string, text:boolean) {
        let suffix = '';
        if (text) {
            suffix = '-text';
        }
        if (airplaneCanRefuel()) {
            if (totalPaxTarget === totalCurrentPax() || !boardingStartedByUser) {
                if (boardingStartedByUser) {
                    setBoardingStartedByUser(false);
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
            setBoardingStartedByUser(!boardingStartedByUser);
        }
    }

    function calculateEta() {
        if (round(totalPaxTarget) === totalCurrentPax() || boardingRate === 2) {
            return ' 0';
        }
        const estimatedTimeSeconds = 0;
        return ` ${Math.round(estimatedTimeSeconds / 60)}`;
    }

    // useEffect(() => {
    //     setSeatColors();
    // }, []);

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

    const changeStationPaxTarget = useCallback((value: number, stationKey: string) => {
        dispatch({
            type: 'PAYLOAD_SET_STATION_PAX_TARGET',
            payload: { value, stationKey },
        });
    }, [dispatch]);

    function renderStations() {
        return Object.entries(paxStations).map(([stationKey, station], index) => (
            <div id={`${stationKey}-slider`}>
                <h3 className={`text-xl font-medium flex items-center ${index !== 0 && 'mt-6'}`}>
                    <IconFriends className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                    {' '}
                    {station.name}
                </h3>
                <p className="mt-2 text-lg">
                    {station.paxTargetRows}
                    {' '}
                    /
                    {' '}
                    {station.seats}
                </p>
                <span className="mt-2 text-lg">
                    <Slider
                        min={0}
                        max={station.seats}
                        value={station.paxTargetRows}
                        onInput={(value) => changeStationPax(value, stationKey)}
                        className="w-48"
                    />
                    <span className="fuel-content-label">Current passengers :</span>
                    <ProgressBar height="10px" width="200px" displayBar={false} isLabelVisible={false} bgcolor="#3b82f6" completed={(station.paxTotalRows / station.seats) * 100} />
                </span>
            </div>
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
                    onChange={(value) => {
                        setPax(value);
                    }}
                />
                <div className="station-separation-line" />
            </>
        ));
    }

    return (
        <div className="flex mt-8">
            <div className="w-1/2">

                <div className="text-white px-6">
                    <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden">

                        <div className="text-white px-6">
                            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info refuel-info">
                                <TargetSelector
                                    key="boarding"
                                    name="Boarding"
                                    placeholder=""
                                    max={MAX_SEAT_AVAILABLE}
                                    value={totalPaxTarget.toString()}
                                    completed={(paxTotal / MAX_SEAT_AVAILABLE) * 100}
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
                                        {calculateEta()}
                                        min
                                    </span>
                                </div>
                            </div>
                        </div>

                        {renderPaxStations()}

                    </div>
                </div>

            </div>
            <div className="w-1/2">
                <div className="text-white px-6">
                    <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden" />
                </div>
            </div>
        </div>
    );
};

export default PayloadPage;
