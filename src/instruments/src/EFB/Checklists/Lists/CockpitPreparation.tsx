// https://docs.flybywiresim.com/pilots-corner/a32nx-briefing/a32nx_api/

import { ChecklistDefinition } from '../Checklists';

export const cockpitPreparationChecklist: ChecklistDefinition = {
    name: 'COCKPIT PREPARATION',
    items: [
        {
            item: 'GEAR PINS & COVERS',
            result: 'REMOVED',
        },
        {
            item: 'FUEL QUANTITY',
            result: '_____ KG/LB',
        },
        {
            item: 'SEAT BELTS',
            result: 'ON',
            condition: () => !!SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'Bool'),
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
            item: 'BARO REF',
            result: '_____ (BOTH)',
        },
    ],
};
