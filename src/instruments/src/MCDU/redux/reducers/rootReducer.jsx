import { combineReducers } from 'redux';

import { scratchpadReducer } from './scratchpadReducer';
import { titlebarReducer } from './titlebarReducer';

const rootReducer = combineReducers({ titlebar: titlebarReducer, scratchpad: scratchpadReducer });

export default rootReducer;
