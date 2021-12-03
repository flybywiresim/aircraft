import { useSimVar } from '@instruments/common/simVars';

export const afterStartChecklist = {
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
            result: '___ % SET',
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
