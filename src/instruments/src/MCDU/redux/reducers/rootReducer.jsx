import { combineReducers } from 'redux';
import { mcduReducer } from './mcduReducer';

import { scratchpadReducer } from './scratchpadReducer';
import { titlebarReducer } from './titlebarReducer';

const rootReducer = combineReducers({
    titlebar: titlebarReducer,
    scratchpad: scratchpadReducer,
    mcduData: mcduReducer,
});

export default rootReducer;
