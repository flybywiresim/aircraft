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

import typeToReducer from 'type-to-reducer';

interface Station {
    name: string;
    seats: number;
    weight: number;
    pax: number;
    paxTarget: number;
    stationIndex: number;
    position: number;
    seatsRange: Array<number>;
}

// station_load.0 = 185, 42.36, 0, 0, PILOT, 1
// station_load.1 = 185, 42.36, 0, 0, FIRST OFFICER, 2
// station_load.2 = 3300, 21.98, 0, 0, ECONOMY ROWS 1-6 (seats: 36 max: 6670lbs/3024kg), 0
// station_load.3 = 3850, 2.86, 0, 0, ECONOMY ROWS 7-13 (seats: 42 max: 7780lb/3530kg), 0
// station_load.4 = 4400, -15.34, 0, 0, ECONOMY ROWS 14-21 (seats: 48 max: 8880lb/4032kg), 0
// station_load.5 = 6600, -32.81, 0, 0, ECONOMY ROWS 22-29 (seats: 48 max: 8880lb/4032kg), 0
// station_load.6 = 3300, 18.28, 0, 0, FWD BAGGAGE/CONTAINER (max: 7500lb/3402kg), 0
// station_load.7 = 2650, -15.96, 0, 0, AFT CONTAINER (max: 5350lb/2426kg), 0
// station_load.8 = 2200, -27.10, 0, 0, AFT BAGGAGE (max: 4650lb/2110kg), 0
// station_load.9 = 1650, -37.35, 0, 0, COMP 5 - AFT BULK/LOOSE (max: 3300lb/1497kg), 0

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
        name: 'ECONOMY ROWS 14-21',
        seats: 48,
        weight: 4032,
        pax: 0,
        paxTarget: 0,
        stationIndex: 4 + 1,
        position: -15.34,
        seatsRange: [79, 126],
    },
    rows21_27: {
        name: 'ECONOMY ROWS 22-29',
        seats: 48,
        weight: 4032,
        pax: 0,
        paxTarget: 0,
        stationIndex: 5 + 1,
        position: -32.81,
        seatsRange: [127, 174],
    },
};

type PayloadState = {[index: string]: Station};

const initialState: PayloadState = paxStations;

const PAYLOAD_SET_STATION_PAX = 'PAYLOAD_SET_STATION_PAX';
const PAYLOAD_SET_STATION_PAX_TARGET = 'PAYLOAD_SET_STATION_PAX_TARGET';

export default typeToReducer(
    {
        [PAYLOAD_SET_STATION_PAX]: (state, { payload }) => {
            const { value, stationKey } = payload;
            const station = { ...state[stationKey] };
            station.pax = value;

            return {
                ...state,
                [stationKey]: station,
            };
        },
        [PAYLOAD_SET_STATION_PAX_TARGET]: (state, { payload }) => {
            const { value, stationKey } = payload;
            const station = { ...state[stationKey] };
            station.paxTarget = value;

            return {
                ...state,
                [stationKey]: station,
            };
        },
    },
    initialState,
);
