import { ChecklistDefinition } from '../Checklists';

export const securingAircraftChecklist: ChecklistDefinition = {
    name: 'SECURING AIRCRAFT',
    items: [
        {
            item: 'ADIRS',
            result: 'OFF',
            condition: () => {
                const v1 = SimVar.GetSimVarValue(
                    'L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB',
                    'Number',
                );
                const v2 = SimVar.GetSimVarValue(
                    'L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB',
                    'Number',
                );
                const v3 = SimVar.GetSimVarValue(
                    'L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB',
                    'Number',
                );
                return v1 === 0 && v2 === 0 && v3 === 0;
            },
        },
        {
            item: 'OXYGEN',
            result: 'OFF',
            condition: () => !!SimVar.GetSimVarValue('L:PUSH_OVHD_OXYGEN_CREW', 'bool'),
        },
        {
            item: 'APU BLEED',
            result: 'OFF',
            condition: () => !SimVar.GetSimVarValue('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Number'),
        },
        {
            item: 'EMER EXIT LT',
            result: 'OFF',
            condition: () => {
                const v1 = SimVar.GetSimVarValue(
                    'L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION',
                    'Number',
                );
                return v1 === 2;
            },
        },
        {
            item: 'SIGNS',
            result: 'OFF',
            condition: () => {
                const seatbeltsOn = !SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'Bool');
                const noSmokingPos = SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'Number');
                return seatbeltsOn && noSmokingPos === 2;
            },
        },
        {
            item: 'APU and BAT',
            result: 'OFF',
            condition: () => {
                const v1 = SimVar.GetSimVarValue(
                    'L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON',
                    'Number',
                );
                const v2 = SimVar.GetSimVarValue(
                    'L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO',
                    'Number',
                );
                const v3 = SimVar.GetSimVarValue(
                    'L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO',
                    'Number',
                );
                return v1 === 0 && v2 === 0 && v3 === 0;
            },
        },
    ],
};
