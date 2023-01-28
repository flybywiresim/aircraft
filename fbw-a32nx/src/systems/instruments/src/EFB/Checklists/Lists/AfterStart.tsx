import { ChecklistDefinition } from '../Checklists';

export const afterStartChecklist: ChecklistDefinition = {
    name: 'AFTER START',
    items: [
        {
            item: 'ANTI ICE',
            result: '_____',
        },
        {
            item: 'ECAM STATUS',
            result: 'CHECKED',
        },
        {
            item: 'PITCH TRIM',
            result: '_____%',
        },
        {
            item: 'RUDDER TRIM',
            result: 'NEUTRAL',
            condition: () => SimVar.GetSimVarValue('RUDDER TRIM PCT', 'percent') === 0,
        },
    ],
};
