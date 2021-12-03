import { useSimVar } from '@instruments/common/simVars';

export const approachChecklist = {
    name: 'APPROACH',
    items: [
        {
            item: 'BRIEFING',
            result: 'CONFIRMED',
            condition: undefined,
        },
        {
            item: 'ECAM STATUS',
            result: 'CHECKED',
            condition: undefined,
        },
        {
            item: 'SEAT BELTS',
            result: 'ON',
            condition: () => {
                const [v1] = useSimVar(
                    'CABIN SEATBELTS ALERT SWITCH',
                    'Number',
                );
                return v1 === 1;
            },
        },
        {
            item: 'BARO REF',
            result: '___ SET (BOTH)',
            condition: undefined,
        },
        {
            item: 'MINIMUM',
            result: '___ SET (BOTH)',
            condition: undefined,
        },
        {
            item: 'ENG MODE SEL',
            result: 'AS RQRD',
            condition: undefined,
        },
    ],
};
