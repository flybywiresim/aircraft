import { Checklist } from '../Checklists';

export const approachChecklist: Checklist = {
    name: 'APPROACH',
    items: [
        {
            item: 'BRIEFING',
            result: 'CONFIRMED',
            condition: undefined,
        },
        {
            item: 'ECAM STATUS',
            result: 'CHECKED',
            condition: undefined,
        },
        {
            item: 'SEAT BELTS',
            result: 'ON',
            condition: () => !!SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'Number'),
        },
        {
            item: 'BARO REF',
            result: '___ SET (BOTH)',
            condition: undefined,
        },
        {
            item: 'MINIMUM',
            result: '___ SET (BOTH)',
            condition: undefined,
        },
        {
            item: 'ENG MODE SEL',
            result: 'AS RQRD',
            condition: undefined,
        },
    ],
};
