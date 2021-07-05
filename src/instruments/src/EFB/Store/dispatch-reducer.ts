import React from 'react';
import { produce } from 'immer';

export const dispatchInitialState: DispatchStateType = { currentView: 0 };

export enum DispatchActions {
    SET_CURRENT_VIEW,
}

export type DispatchStateType = {
    currentView: number
}

export type DispatchContextType = {
    dispatchState: DispatchStateType;
    dispatchDispatch: React.Dispatch<any>;
}

const Reducer = (state, action) => {
    switch (action.type) {
    case DispatchActions.SET_CURRENT_VIEW: {
        return produce(state, (draft) => {
            draft.currentView = action.payload.currentView;
        });
    }

    default: {
        throw new Error('No valid action provided');
    }
    }
};

// Curried
export const DispatchReducer = produce(Reducer);
