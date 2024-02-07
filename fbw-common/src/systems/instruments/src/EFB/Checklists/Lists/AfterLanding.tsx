import { ChecklistDefinition } from '../Checklists';

export const afterLandingChecklist: ChecklistDefinition = {
    name: 'AFTER LANDING',
    items: [
        {
            item: 'RADAR & PRED W/S',
            result: 'OFF',
            condition: () => {
                const radarOff = SimVar.GetSimVarValue('L:XMLVAR_A320_WEATHERRADAR_SYS', 'Number') === 1;
                const predWsOff = SimVar.GetSimVarValue('L:A32NX_SWITCH_RADAR_PWS_POSITION', 'Number') === 0;

                return radarOff && predWsOff;
            },
        },
    ],
};
