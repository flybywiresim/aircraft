import { useSimVar } from '@instruments/common/simVars';

export const afterTakeoffClimbChecklist = {
    name: 'AFTER TO/, CLMB',
    items: [
        {
            item: 'LDG GEAR',
            result: 'UP',
            condition: undefined,
        },
        {
            item: 'FLAPS',
            result: 'RETRACTED',
            condition: () => {
                const [v1] = useSimVar('L:A32NX_FLAPS_HANDLE_INDEX', 'Number');
                const [v2] = useSimVar('L:A32NX_FLAPS_IN_MOTION', 'Number');
                return v1 === 0 && v2 === 0;
            },
        },
        {
            item: 'PACKS-NEW',
            result: 'ON',
            condition: () => {
                const [v1] = useSimVar('L:A32NX_PACKS_1_IS_SUPPLYING', 'Number');
                const [v2] = useSimVar('L:A32NX_PACKS_2_IS_SUPPLYING', 'Number');
                return v1 === 1 && v2 === 1;
            },
        },
        {
            item: '',
            result: '',
            condition: undefined,
        },
        {
            item: 'BARO REF',
            result: '___ SET (BOTH)',
            condition: undefined,
        },
    ],
};
