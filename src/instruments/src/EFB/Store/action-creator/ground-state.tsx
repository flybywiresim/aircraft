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

import { ADD_ACTIVE_BUTTON, ADD_DISABLED_BUTTON, REMOVE_ACTIVE_BUTTON, REMOVE_DISABLED_BUTTON, SET_ACTIVE_BUTTONS, SET_TUG_REQUEST_ONLY } from '../actions';

export const addActiveButton = (button) => ({
    type: ADD_ACTIVE_BUTTON,
    button,
});

export const removeActiveButton = (elementIndex) => ({
    type: REMOVE_ACTIVE_BUTTON,
    elementIndex,
});

export const setActiveButtons = (updatedButtons) => ({
    type: SET_ACTIVE_BUTTONS,
    updatedButtons,
});

export const addDisabledButton = (button) => ({
    type: ADD_DISABLED_BUTTON,
    button,
});

export const removeDisabledButton = (elementIndex) => ({
    type: REMOVE_DISABLED_BUTTON,
    elementIndex,
});

export const setTugRequestOnly = (tugRequest) => ({
    type: SET_TUG_REQUEST_ONLY,
    tugRequest,
});
