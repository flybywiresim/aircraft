import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import { todCalculatorReducer } from './reducer/tod-calculator.reducer';
import { EFB_CLEAR_STATE } from './actions';
import { buttonsReducer } from './reducer/ground-reducer';

export const TOD_CALCULATOR_REDUCER = 'todCalculatorReducer';
export const BUTTON_STATE_REDUCER = 'buttonsReducer';
export const DEADZONE_REDUCER = 'deadZoneReducer';
export default createStore(
    (state: any, action) => {
        if (action.type === EFB_CLEAR_STATE) {
            state = undefined;
        }

        return combineReducers({ [TOD_CALCULATOR_REDUCER]: todCalculatorReducer, [BUTTON_STATE_REDUCER]: buttonsReducer })(state, action);
    },
    composeWithDevTools(applyMiddleware(thunk)),
);
