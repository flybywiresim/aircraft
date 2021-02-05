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

import {ADD_TOD_GROUND_SPEED, REMOVE_TOD_GROUND_SPEED, SET_TOD_DATA, SET_TOD_GROUND_SPEED} from "../actions";

export const setTodData = (data) => ({
    type: SET_TOD_DATA,
    data
});

export const addTodGroundSpeed = (groundSpeed) => ({
    type: ADD_TOD_GROUND_SPEED,
    groundSpeed
});

export const removeTodGroundSpeed = (elementIndex) => ({
    type: REMOVE_TOD_GROUND_SPEED,
    elementIndex
});

export const setTodGroundSpeed = (elementIndex, groundSpeed) => ({
    type: SET_TOD_GROUND_SPEED,
    elementIndex,
    groundSpeed
});
