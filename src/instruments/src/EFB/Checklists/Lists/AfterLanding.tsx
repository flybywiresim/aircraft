import { ChecklistDefinition } from '../Checklists';

export const afterLandingChecklist: ChecklistDefinition = {
    name: 'AFTER LANDING',
    items: [
        {
            item: 'FLAPS',
            result: 'RETRACTED',
            condition: () => SimVar.GetSimVarValue('L:A32NX_FLAPS_CONF_INDEX', 'Number') === 0,
        },
        {
            item: 'SPOILERS',
            result: 'DISARMED',
            condition: () => !SimVar.GetSimVarValue('L:A32NX_SPOILERS_ARMED', 'Bool'),
        },
        {
            item: 'APU',
            result: 'START',
            condition: () => !!SimVar.GetSimVarValue('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool'),
        },
        {
            item: 'RADAR',
            result: 'OFF',
            condition: () => SimVar.GetSimVarValue('L:XMLVAR_A320_WEATHERRADAR_SYS', 'Number') === 1,
        },
        {
            item: 'PREDICTIVE WINDSHEER SYSTEM',
            result: 'OFF',
            condition: () => SimVar.GetSimVarValue('L:A32NX_SWITCH_RADAR_PWS_POSITION', 'Number') === 0,
        },
    ],
};
