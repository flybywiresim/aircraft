import typeToReducer from 'type-to-reducer';
import { SET_CHECKLIST_DATA } from '../actions';

export const checklistReducer = typeToReducer({
    [SET_CHECKLIST_DATA]: (state, { data }) => (
        {
            ...state,
            ...data,
        }),
}, {});
