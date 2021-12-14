import { useSimVar } from '@instruments/common/simVars';

export const parkingChecklist = {
    name: 'PARK',
    items: [
        {
            item: 'APU BLEED',
            result: 'ON',
            condition: () => {
                const [v1] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Number');
                return v1 === 1;
            },
        },
        {
            item: 'EGINES',
            result: 'OFF',
            condition: undefined,
        },
        {
            item: 'SEAT BELTS',
            result: 'OFF',
            condition: () => {
                const [v1] = useSimVar('A:CABIN SEATBELTS ALERT SWITCH', 'Bool');
                return v1 === 0;
            },
        },
        {
            item: 'EXT LT',
            result: 'AS RQRD',
            condition: undefined,
        },
        {
            item: 'FUEL PUMPS',
            result: 'OFF',
            condition: () => {
                const [v1] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_PUMP1_Pressed', 'Number');
                const [v2] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_PUMP2_Pressed', 'Number');
                const [v3] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_LTKPUMPS1_Pressed', 'Number');
                const [v4] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_LTKPUMPS2_Pressed', 'Number');
                const [v5] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_RTKPUMPS1_Pressed', 'Number');
                const [v6] = useSimVar('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_RTKPUMPS2_Pressed', 'Number');
                return (
                    v1 === 0
                    && v2 === 0
                    && v3 === 0
                    && v4 === 0
                    && v5 === 0
                    && v6 === 0
                );
            },
        },
        {
            item: 'PARK BREAK and CHOCKS',
            result: 'AS RQRD',
            condition: undefined,
        },
    ],
};
