import React, { Context, createContext } from 'react';
import { performanceInitialState, TPerformanceState } from './performance-reducer';
import { TChecklistState, checklistInitialState } from './checklists-reducer';

export type TGlobalContext = {
    checklistState: TChecklistState;
    checklistDispatch: React.Dispatch<any>;
    performanceState: TPerformanceState;
    performanceDispatch: React.Dispatch<any>;
}

const defaultValue: TGlobalContext = {
    checklistState: checklistInitialState,
    checklistDispatch: () => {},
    performanceState: performanceInitialState,
    performanceDispatch: () => {},

};

export const GlobalContext:Context<TGlobalContext> = createContext<TGlobalContext>(defaultValue);
