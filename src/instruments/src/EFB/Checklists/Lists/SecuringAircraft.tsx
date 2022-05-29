import { ChecklistDefinition } from '../Checklists';

export const securingAircraftChecklist: ChecklistDefinition = {
    name: 'SECURING AIRCRAFT',
    items: [
        {
            item: 'OXYGEN',
            result: 'OFF',
            condition: () => !!SimVar.GetSimVarValue('L:PUSH_OVHD_OXYGEN_CREW', 'bool'),
        },
        {
            item: 'EMER EXIT LT',
            result: 'OFF',
            condition: () => SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_EMEREXIT_POSITION', 'Number') === 2,
        },
        {
            item: 'BATTERIES',
            result: 'OFF',
            condition: () => {
                const batOneOff = SimVar.GetSimVarValue(
                    'L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO',
                    'Number',
                ) === 0;
                const batTwoOff = SimVar.GetSimVarValue(
                    'L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO',
                    'Number',
                ) === 0;

                return batOneOff && batTwoOff;
            },
        },
        {
            item: 'EFBs',
            result: 'OFF',
        },
    ],
};
