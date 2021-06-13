import { produce } from 'immer';

export enum EChecklistActions {
    SET_LIST_CHECK,
    SET_STEP_CHECK
}

export type TChecklistItem = {
    isCompleted: boolean
};

export type TChecklist = {
    items: Array<TChecklistItem>
    isComplete: boolean
};

export const checklistInitialState = {};

export type TChecklistState = {};

const Reducer = (state, action) => {
    const { checklistIndex, stepIndex } = action.payload;

    switch (action.type) {
    case EChecklistActions.SET_LIST_CHECK: {
        const newState = produce(state, (draft) => {
            draft[checklistIndex].isCompleted = !draft[checklistIndex].isCompleted;
        });
        return newState;
    }

    case EChecklistActions.SET_STEP_CHECK: {
        const newState = produce(state, (draft) => {
            if (!draft[checklistIndex]) draft[checklistIndex] = { isCompleted: false };
            if (!draft[checklistIndex][stepIndex]) {
                draft[checklistIndex][stepIndex] = { isCompleted: true };
            } else {
                draft[checklistIndex][stepIndex].isCompleted = !draft[checklistIndex][stepIndex].isCompleted;
            }
        });
        return newState;
    }

    default: {
        throw new Error('No valid action provided');
    }
    }
};

// Curried
export const ChecklistReducer = produce(Reducer);
