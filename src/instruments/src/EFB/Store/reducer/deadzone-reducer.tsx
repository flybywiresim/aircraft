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
import { NXDataStore } from '../../../Common/persistence';
import { SET_DEADZONE } from '../actions';

export type DeadZoneState = {
    deadZone: number[],
};

const getDefault = (key) => {
    const val = NXDataStore.get(key);
    console.log(`ASDASD${val}`);
    if (!val) {
        return 0.5;
    }
    return parseFloat(val);
};

const initialState: DeadZoneState = { deadZone: [getDefault('D0'), getDefault('D1'), getDefault('D2'), getDefault('D3'), getDefault('D4'), getDefault('D5')] };

export const deadZoneReducer = typeToReducer(

    {
        [SET_DEADZONE]: (state, { deadZone, key }) => {
            // const detent = [...state.deadZone];
            // state.deadZone[key] = 0.5;
            const stateGroundSpeed = [...state.deadZone];
            if (stateGroundSpeed) {
                // console.log(`AYOO${stateGroundSpeed}`);
                state.deadZone[key] = deadZone;
            }

            return { ...state, ...stateGroundSpeed };
        },

    },
    initialState,
);
