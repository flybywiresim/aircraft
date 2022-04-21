import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';

import todCalculatorReducer from './features/todCalculator';
import buttonsReducer from './features/buttons';
import simbriefReducer from './features/simBrief';
import performanceReducer from './features/performance';
import flightProgressReducer from './features/flightProgress';
import navigationTabReducer from './features/navigationPage';
import dashboardReducer from './features/dashboard';
import checklistsReducer from './features/checklists';
import keyboardReducer from './features/keyboard';
import dispatchPageReducer from './features/dispatchPage';
import failuresPageReducer from './features/failuresPage';

export const createRootReducer = (history) => combineReducers({
    router: connectRouter(history),
    todCalculator: todCalculatorReducer,
    buttons: buttonsReducer,
    simbrief: simbriefReducer,
    performance: performanceReducer,
    flightProgress: flightProgressReducer,
    navigationTab: navigationTabReducer,
    dashboard: dashboardReducer,
    trackingChecklists: checklistsReducer,
    keyboard: keyboardReducer,
    dispatchPage: dispatchPageReducer,
    failuresPage: failuresPageReducer,
});
