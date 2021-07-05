import React, { Context, createContext } from 'react';
import { performanceInitialState, PerformanceStateType } from './performance-reducer';
import { dispatchInitialState, DispatchStateType } from './dispatch-reducer';

export type GlobalContextType = {
    performanceState: PerformanceStateType;
    performanceDispatch: React.Dispatch<any>;
    dispatchState: DispatchStateType;
    dispatchDispatch: React.Dispatch<any>;
}

const defaultValue = {
    performanceState: performanceInitialState,
    performanceDispatch: () => {},
    dispatchState: dispatchInitialState,
    dispatchDispatch: () => {},
};

export const GlobalContext:Context<GlobalContextType> = createContext<GlobalContextType>(defaultValue);
