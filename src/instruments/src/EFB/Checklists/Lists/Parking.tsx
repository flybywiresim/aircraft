import { ChecklistDefinition } from '../Checklists';

export const parkingChecklist: ChecklistDefinition = {
    name: 'PARKING',
    items: [
        {
            item: 'APU BLEED',
            result: 'ON',
            condition: () => !!SimVar.GetSimVarValue('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool'),
        },
        {
            item: 'ENGINES',
            result: 'OFF',
            condition: () => {
                const engOneN2 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:1', 'Number');
                const engTwoN2 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:2', 'Number');

                return engOneN2 === 0 && engTwoN2 === 0;
            },
        },
        {
            item: 'SEAT BELTS',
            result: 'OFF',
            condition: () => !SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'Bool'),
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
                const pumpOneOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:1', 'Number');
                const pumpTwoOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:2', 'Number');
                const pumpThreeOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:3', 'Number');
                const pumpFourOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:4', 'Number');
                const pumpFiveOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:5', 'Number');
                const pumpSixOff = !SimVar.GetSimVarValue('FUELSYSTEM PUMP ACTIVE:6', 'Number');

                return (
                    pumpOneOff
                    && pumpTwoOff
                    && pumpThreeOff
                    && pumpFourOff
                    && pumpFiveOff
                    && pumpSixOff
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
