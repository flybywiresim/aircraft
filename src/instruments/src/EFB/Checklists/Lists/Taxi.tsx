import { ChecklistDefinition } from '../Checklists';

export const taxiChecklist: ChecklistDefinition = {
    name: 'TAXI',
    items: [
        {
            item: 'FLIGHT CONTROL',
            result: 'CHECKED (BOTH)',
        },
        {
            item: 'FLAPS SETTING',
            result: 'CONF _____ (BOTH)',
        },
        {
            item: 'RADAR & PRED W/A',
            result: 'ON & AUTO',
            condition: () => {
                const radarValue = SimVar.GetSimVarValue('L:XMLVAR_A320_WEATHERRADAR_SYS', 'Number');
                const radarOn = radarValue === 0 || radarValue === 2;
                const predWsAuto = SimVar.GetSimVarValue('L:A32NX_SWITCH_RADAR_PWS_POSITION', 'Number') === 1;

                return radarOn && predWsAuto;
            },
        },
        {
            item: 'ENG MODE SEL',
            result: '_____',
        },
        {
            item: 'ECAM MEMO',
            result: 'TO NO BLUE',
        },
    ],
};
