import { configureStore, combineReducers, Reducer, AnyAction, createAction } from '@reduxjs/toolkit';

import thunk from 'redux-thunk';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
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
import tooltipReducer from './features/tooltip';

export type RootState = ReturnType<typeof combinedReducer>;
export type AppDispatch = typeof store.dispatch;

export const EFB_CLEAR_STATE = 'EFB_CLEAR_STATE';

const combinedReducer = combineReducers({
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
    tooltip: tooltipReducer,
});

const rootReducer: Reducer = (state: RootState, action: AnyAction) => {
    if (action.type === EFB_CLEAR_STATE) {
        state = {} as RootState;
    }

    return combinedReducer(state, action);
};

export const clearEfbState = createAction(EFB_CLEAR_STATE);

export const store = configureStore({
    reducer: rootReducer,
    middleware: [thunk],
});

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
