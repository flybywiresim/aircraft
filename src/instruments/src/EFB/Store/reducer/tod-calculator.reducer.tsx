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
import {ADD_TOD_GROUND_SPEED, REMOVE_TOD_GROUND_SPEED, SET_TOD_DATA, SET_TOD_GROUND_SPEED} from '../actions';
import {TOD_CALCULATION_TYPE} from "../../Enum/TODCalculationType.enum";

type state = {
    groundSpeed: {from: number, groundSpeed?: number}[],
    currentAltitude?: number,
    targetAltitude?: number,
    calculation: {
        input?: number,
        type?: TOD_CALCULATION_TYPE
    }
};

const initialState: state = {
    groundSpeed: [{from: 0, groundSpeed: undefined}, {from: 10000, groundSpeed: undefined}],
    currentAltitude: undefined,
    targetAltitude: undefined,
    calculation: {
        input: undefined,
        type: undefined
    }
};

export const todCalculatorReducer = typeToReducer(
    {
        [SET_TOD_DATA]: (state, { data }) => ({
            ...state,
            ...data
        }),
        [ADD_TOD_GROUND_SPEED]: (state, { groundSpeed }) => ({
            ...state,
            groundSpeed: [...state.groundSpeed, groundSpeed]
        }),
        [REMOVE_TOD_GROUND_SPEED]: (state, { elementIndex }) => {
            const groundSpeed = [...state.groundSpeed];
            groundSpeed.splice(elementIndex, 1);

            return {
                ...state,
                groundSpeed: groundSpeed
            }
        },
        [SET_TOD_GROUND_SPEED]: (state, { elementIndex, groundSpeed }) => {
            const stateGroundSpeed = [...state.groundSpeed];
            stateGroundSpeed[elementIndex] = {...stateGroundSpeed[elementIndex], ...groundSpeed};

            return {
                ...state,
                groundSpeed: stateGroundSpeed
            }
        }
    },
    initialState
);
