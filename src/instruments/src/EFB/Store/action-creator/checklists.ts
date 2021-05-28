import { SET_CHECKLIST_DATA } from '../actions';

export const setChecklist = (checks) => ({
    type: SET_CHECKLIST_DATA,
    checks,
});
