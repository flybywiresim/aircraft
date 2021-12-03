import { useSimVar } from '@instruments/common/simVars';

export const afterLandingChecklist = {
    name: 'AFTER LANDING',
    items: [
        {
            item: 'FLAPS',
            result: 'RETRACTED',
            condition: () => {
                const [v1] = useSimVar('FLAPS_SET', 'Number');
                return v1 === 0;
            },
        },
        {
            item: 'SPOILERS',
            result: 'DISARMED',
            condition: () => {
                const [v1] = useSimVar('SPOILERS ARMED', 'Number');
                return v1 === 0;
            },
        },
        {
            item: 'APU',
            result: 'START',
            condition: undefined,
        },
        {
            item: 'RADAR',
            result: 'OFF',
            condition: () => {
                const [v1] = useSimVar(
                    'L:XMLVAR_A320_WEATHERRADAR_SYS',
                    'Number',
                );
                return v1 === 1;
            },
        },
        {
            item: 'PREDICTIVE WINDSHEER SYSTEM',
            result: 'OFF',
            condition: () => {
                const [v1] = useSimVar(
                    'L:A32NX_SWITCH_RADAR_PWS_POSITION',
                    'Number',
                );
                return v1 === 0;
            },
        },
    ],
};
