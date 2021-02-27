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

import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import { todCalculatorReducer } from './reducer/tod-calculator.reducer';
import payloadReducer from './reducer/payloadReducer';
import { EFB_CLEAR_STATE } from './actions';
import { buttonsReducer } from './reducer/ground-reducer';

export const TOD_CALCULATOR_REDUCER = 'todCalculatorReducer';
export const BUTTON_STATE_REDUCER = 'buttonsReducer';

export const rootReducer = combineReducers({
    [TOD_CALCULATOR_REDUCER]: todCalculatorReducer,
    [BUTTON_STATE_REDUCER]: buttonsReducer,
    payload: payloadReducer
});

export type RootState = ReturnType<typeof rootReducer>

export default createStore(
    (state: any, action) => {
        if (action.type === EFB_CLEAR_STATE) {
            state = undefined;
        }

        return rootReducer(state, action);
    },
    composeWithDevTools(applyMiddleware(thunk)),
);
