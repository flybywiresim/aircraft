import { ChecklistDefinition } from '../Checklists';

export const afterTakeoffClimbChecklist: ChecklistDefinition = {
    name: 'AFTER TAKEOFF / CLIMB',
    items: [
        {
            item: 'LDG GEAR',
            result: 'UP',
            condition: () => SimVar.GetSimVarValue('GEAR HANDLE POSITION', 'Bool') === 0,
        },
        {
            item: 'FLAPS',
            result: 'RETRACTED',
            condition: () => SimVar.GetSimVarValue('L:A32NX_FLAPS_CONF_INDEX', 'Number') === 0,
        },
        {
            item: 'PACKS-NEW',
            result: 'ON',
            condition: () => {
                const packOneOn = !!SimVar.GetSimVarValue('L:A32NX_AIRCOND_PACK1_TOGGLE', 'Number');
                const packTwoOn = !!SimVar.GetSimVarValue('L:A32NX_AIRCOND_PACK2_TOGGLE', 'Number');
                return packOneOn && packTwoOn;
            },
        },
        {
            item: '',
            result: '',
            condition: undefined,
            divider: true,
        },
        {
            item: 'BARO REF',
            result: '___ SET (BOTH)',
            condition: undefined,
        },
    ],
};
