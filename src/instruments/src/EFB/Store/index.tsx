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
