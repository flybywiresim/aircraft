import { combineReducers } from 'redux';

import { scratchpadReducer } from './scratchpadRedcuer';
import { titlebarReducer } from './titlebarReducer';

const rootReducer = combineReducers({ titlebar: titlebarReducer, scratchpad: scratchpadReducer });

export default rootReducer;
