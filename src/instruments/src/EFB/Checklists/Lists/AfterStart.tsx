import { ChecklistDefinition } from '../Checklists';

export const afterStartChecklist: ChecklistDefinition = {
    name: 'AFTER START',
    items: [
        {
            item: 'ANTI ICE',
            result: 'AS RQRD',
            condition: undefined,
        },
        {
            item: 'ECAM STATUS',
            result: 'CHECKED',
            condition: undefined,
        },
        {
            item: 'PITCH TRIM',
            result: '_____ % SET',
            condition: undefined,
        },
        {
            item: 'RUDDER TRIM',
            result: 'ZERO',
            condition: () => SimVar.GetSimVarValue('RUDDER TRIM PCT', 'percent') === 0,
        },
    ],
};
