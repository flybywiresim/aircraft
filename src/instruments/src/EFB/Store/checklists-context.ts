import React, { createContext } from 'react';
import { produce } from 'immer';

export enum EChecklistActions {
    SET_CHECKLIST
}

export type TChecklistItem = {
    isCompleted: boolean
};

export type TChecklist = {
    items: Array<TChecklistItem>
    isComplete: boolean
};

export type TChecklistContext = {
    checklistState: object;
    checklistDispatch: React.Dispatch<any>;
}

export const ChecklistReducer = (state, action: EChecklistActions) => {
    console.log('1', state, action);
    switch (action.type) {
    case EChecklistActions.SET_CHECKLIST:

        console.log('2', state);

        const newState = produce(state.checklistState, (draft) => {
            draft.team.teamFoo.matthew = {};

            draft.team.newTeam = {
                joel: {},
                adam: {},
            };
        });
        return newState;
    default:
        throw new Error();
    }
};

export const ChecklistContext = createContext<TChecklistContext>({ checklistState: {}, checklistDispatch: () => {} });
