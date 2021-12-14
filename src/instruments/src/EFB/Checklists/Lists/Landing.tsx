import { useSimVar } from '@instruments/common/simVars';

export const landingChecklist = {
    name: 'LDG',
    items: [
        {
            item: 'CABIN CREW',
            result: 'ADVISED',
            condition: undefined,
        },
        {
            item: 'A/THR',
            result: 'SPEED / OFF',
            condition: () => {
                const [v1] = useSimVar('L:A32NX_AUTOTHRUST_MODE', 'Number');
                return v1 === 7 || v1 === 0;
            },
        },
        {
            item: 'AUTOBRAKE',
            result: 'AS RQRD',
            condition: undefined,
        },
        {
            item: 'ECAM MEMO',
            result: 'LDG NO BLUE',
            condition: undefined,
        },
    ],
};
