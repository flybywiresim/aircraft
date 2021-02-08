import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import { todCalculatorReducer } from './reducer/tod-calculator.reducer';

export const TOD_CALCULATOR_REDUCER = 'todCalculatorReducer';

export default createStore(
    combineReducers({
        [TOD_CALCULATOR_REDUCER]: todCalculatorReducer
    }),
    composeWithDevTools(applyMiddleware(thunk))
);
