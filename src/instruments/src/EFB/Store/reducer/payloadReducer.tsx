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

type PayloadState = {[index: string]: Station};

const initialState: PayloadState = paxStations;

const PAYLOAD_SET_ROW16 = 'PAYLOAD_SET_ROW16';

export default typeToReducer(
    {
        [PAYLOAD_SET_ROW16]: (state, { payload }) => {
            const rows1_6 = { ...state.rows1_6 };
            rows1_6.pax = payload.value;

            return {
                ...state,
                rows1_6,
            };
        },
    },
    initialState,
);
