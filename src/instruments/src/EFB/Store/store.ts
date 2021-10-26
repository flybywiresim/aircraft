import { configureStore, combineReducers, Reducer, AnyAction, createAction } from '@reduxjs/toolkit';

import thunk from 'redux-thunk';

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import todCalculatorReducer from './features/todCalculator';
import buttonsReducer from './features/buttons';
import simbriefReducer from './features/simbrief';

export type TypedAction<T> = { type: string, payload: T };
export type RootState = ReturnType<typeof combinedReducer>;
export type AppDispatch = typeof store.dispatch;

export const EFB_CLEAR_STATE = 'EFB_CLEAR_STATE';

const combinedReducer = combineReducers({
    todCalculator: todCalculatorReducer,
    buttons: buttonsReducer,
    simbrief: simbriefReducer,
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
