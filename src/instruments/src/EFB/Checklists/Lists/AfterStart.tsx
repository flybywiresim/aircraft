import { useSimVar } from '@instruments/common/simVars';
import { Checklist } from '../Checklists';

export const afterStartChecklist: Checklist = {
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
            condition: () => {
                const [v1] = useSimVar('RUDDER TRIM PCT', 'Number');
                return Math.abs(v1) < 0.01;
            },
        },
    ],
};
