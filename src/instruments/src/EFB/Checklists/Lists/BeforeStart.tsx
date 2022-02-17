// https://docs.flybywiresim.com/pilots-corner/a32nx-briefing/a32nx_api/

import { ChecklistDefinition } from '../Checklists';

export const beforeStartChecklist: ChecklistDefinition = {
    name: 'BEFORE START',
    items: [
        {
            item: 'COCKPIT PREP',
            result: 'COMPLETED (BOTH)',
            condition: undefined,
        },
        {
            item: 'GEAR PINS and COVERS',
            result: 'REMOVED',
            condition: undefined,
        },
        {
            item: 'SIGNS',
            result: 'ON/AUTO',
            condition: () => {
                // TODO: This is not working 😻
                const seatbeltsOn = SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_SEATBELT_Position', 'Number') === 1;
                const noSmokingPos = SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'Number');
                return seatbeltsOn && (noSmokingPos === 0 || noSmokingPos === 1);
            },
        },
        {
            item: 'ADIRS',
            result: 'NAV',
            condition: () => {
                const ir1 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'Number');
                const ir2 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB', 'Number');
                const ir3 = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB', 'Number');
                return ir1 === 1 && ir2 === 1 && ir3 === 1;
            },
        },
        {
            item: 'FUEL QUANTITY',
            result: '___ KG.LB',
            condition: undefined,
        },
        {
            item: 'TO DATA',
            result: 'SET',
            condition: undefined,
        },
        {
            item: 'BARO REF',
            result: 'SET (BOTH)',
            condition: undefined,
        },
        {
            item: '',
            result: '',
            condition: undefined,
            divider: true,
        },
        {
            item: 'WINDOWS/DOORS',
            result: 'CLOSED (BOTH)',
            condition: undefined,
        },
        {
            item: 'BEACON',
            result: 'ON',
            condition: () => SimVar.GetSimVarValue('LIGHT BEACON', 'Number') === 1,
        },
        {
            item: 'THR LEVERS',
            result: 'IDLE',
            // TODO: check idle values
            condition: undefined,
        },
        {
            item: 'PARKING BREAK',
            result: 'AS RQRD',
            condition: undefined,
        },
    ],
};
