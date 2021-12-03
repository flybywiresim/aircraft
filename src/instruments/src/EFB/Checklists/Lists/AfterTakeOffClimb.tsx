import { useSimVar } from '@instruments/common/simVars';

export const afterTakeoffClimbChecklist = {
    name: 'AFTER TAKEOFF / CLIMB',
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
                const [v1] = useSimVar('FLAPS_SET', 'Number');
                return v1 === 0;
            },
        },
        {
            item: 'PACKS-NEW',
            result: 'ON',
            condition: () => {
                // TODO - does not seem to work in sim
                const [v1] = useSimVar('A32NX_AIRCOND_PACK1_TOGGLE', 'Number');
                const [v2] = useSimVar('A32NX_AIRCOND_PACK2_TOGGLE', 'Number');
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
