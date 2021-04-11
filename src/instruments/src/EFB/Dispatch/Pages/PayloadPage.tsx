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
import '../Styles/Fuel.scss';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import { useSimVar } from '../../../Common/simVars';

const MAX_SEAT_AVAILABLE = 174;
const PAX_WEIGHT = 84;
const BAG_WEIGHT = 20;

const PayloadPage = () => {
    const [boardingStartedByUser, setBoardingStartedByUser] = useSimVar('L:A32NX_BOARDING_STARTED_BY_USR', 'Bool');
    const [boardingRate, setBoardingRate] = useSimVarSyncedPersistentProperty('L:A32NX_BOARDING_RATE_SETTING', 'Number', 'BOARDING_RATE_SETTING');
    const [busDC2] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', 1_000);
    const [busDCHot1] = useSimVar('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', 'Bool', 1_000);
    const [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool', 1_000);
    const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'Bool', 1_000);
    const [eng2Running] = useSimVar('ENG COMBUSTION:2', 'Bool', 1_000);
    const [paxTarget, setPaxTarget] = useSimVar('L:A32NX_PAX_TOTAL_DESIRED', 'Number');

    const dispatch = useDispatch();

    const payload = useSelector((state: RootState) => state.payload);

    const zfwcg = getZfwcg().toFixed(2);

    const totalPax = Object.values(payload).map((station) => station.pax).reduce((acc, cur) => acc + cur);
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
        // setPaxTarget(Number(numberOfPax));

        let paxRemaining = parseInt(numberOfPax);

        function fillStation(stationKey, paxToFill) {
            const pax = Math.min(paxToFill, payload[stationKey].seats);
            // changeStationPax(pax, stationKey);
            changeStationPaxTarget(pax, stationKey);
            paxRemaining -= pax;
        }

        fillStation('rows21_27', paxRemaining);
        fillStation('rows14_20', paxRemaining);

        const remainingByTwo = Math.trunc(paxRemaining / 2);
        fillStation('rows1_6', remainingByTwo);
        fillStation('rows7_13', paxRemaining);

        // setPayload(numberOfPax);
    }

    function getPayload() {
        const weightPerPax = PAX_WEIGHT + BAG_WEIGHT;

        const payload = weightPerPax * totalPax;

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
        return Object.entries(payload).map(([stationKey, station], index) => (
            <div id={`${stationKey}-slider`}>
                <h3 className={`text-xl font-medium flex items-center ${index !== 0 && 'mt-6'}`}>
                    <IconFriends className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
                    {' '}
                    {station.name}
                </h3>
                <p className="mt-2 text-lg">
                    {station.paxTarget}
                    {' '}
                    /
                    {' '}
                    {station.seats}
                </p>
                <span className="mt-2 text-lg">
                    <Slider
                        min={0}
                        max={station.seats}
                        value={station.paxTarget}
                        onInput={(value) => changeStationPax(value, stationKey)}
                        className="w-48"
                    />
                    <ProgressBar height="10px" width="200px" displayBar={false} isLabelVisible={false} bgcolor="#3b82f6" completed={(station.pax / station.seats) * 100} />
                </span>
            </div>
        ));
    }

    return (
        <div className="flex mt-8">
            <div className="w-1/2">

                <div className="text-white px-6">
                    <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden">

                        <div className="text-white px-6">
                            <div className="bg-gray-800 rounded-xl p-6 text-white shadow-lg mr-4 overflow-x-hidden fuel-tank-info refuel-info">
                                <h2 className="text-2xl font-medium">Boarding</h2>
                                <label htmlFor="fuel-label" className={formatBoardingStatusClass('fuel-truck-avail', true)}>{formatBoardingStatusLabel()}</label>
                                <div className="flex mt-n5">
                                    <div className="fuel-progress">
                                        <Slider
                                            min={0}
                                            max={MAX_SEAT_AVAILABLE}
                                            value={totalPaxTarget}
                                            onInput={(value) => {
                                                setPax(value);
                                            }}
                                            className="w-48"
                                        />

                                    </div>
                                    <div className="fuel-label pad15">
                                        <p className="mt-2 text-lg">
                                            {totalPaxTarget}
                                            {' '}
                                            /
                                            {' '}
                                            {MAX_SEAT_AVAILABLE}
                                        </p>
                                    </div>
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
                                <span className="fuel-content-label">Current passengers :</span>
                                <div className="flex mt-n5 current-fuel-line">
                                    <ProgressBar height="10px" width="200px" displayBar={false} isLabelVisible={false} bgcolor="#3b82f6" completed={(totalPax / MAX_SEAT_AVAILABLE) * 100} />
                                    <div className="fuel-label">
                                        <label className="fuel-content-label" htmlFor="fuel-label">
                                            {totalPax}
                                            {' '}
                                            /
                                            {' '}
                                            {MAX_SEAT_AVAILABLE}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {renderStations()}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default PayloadPage;
