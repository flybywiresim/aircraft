import { useSimVar } from '@instruments/common/simVars';

export const afterLandingChecklist = {
    name: 'AFTER LDG',
    items: [
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
            item: 'SPOILERS',
            result: 'DISARMED',
            condition: () => {
                const [v1] = useSimVar('L:A32NX_SPOILERS_ARMED', 'Number');
                const [v2] = useSimVar('L:A32NX_SPOILERS_HANDLE_POSITION', 'Number');
                return v1 === 0 && v2 < 0.001;
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
                const [v1] = useSimVar('L:XMLVAR_A320_WEATHERRADAR_MODE', 'Number');
                return v1 === 0;
            },
        },
        {
            item: 'PREDICTIVE WINDSHEER SYSTEM',
            result: 'OFF',
            condition: () => {
                const [v1] = useSimVar('L:A32NX_SWITCH_RADAR_PWS_Position', 'Number');
                return v1 === 0;
            },
        },
    ],
};
