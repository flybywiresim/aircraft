import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export interface GsxEvents {
    gsxOpenMenu: number,
    gsxMenuChoice: number
}
export class GsxSimVarPublisher extends SimVarPublisher<GsxEvents> {
    private static readonly simVars = new Map<keyof GsxEvents, SimVarDefinition>([
        ['gsxOpenMenu', { name: 'L:FSDT_GSX_MENU_OPEN', type: SimVarValueType.Number }],
        ['gsxMenuChoice', { name: 'L:FSDT_GSX_MENU_CHOICE', type: SimVarValueType.Number }],
    ]);

    constructor(bus: EventBus) {
        super(GsxSimVarPublisher.simVars, bus);
    }
}
