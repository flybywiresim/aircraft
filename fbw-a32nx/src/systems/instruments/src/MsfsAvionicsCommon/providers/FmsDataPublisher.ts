import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { EfisSide } from '@shared/NavigationDisplay';

export interface FmsVars {
    ndMessageFlags: number,
    crossTrackError: number,
}

export class FmsDataPublisher extends SimVarPublisher<FmsVars> {
    constructor(bus: EventBus, efisSide: EfisSide) {
        super(new Map([
            ['ndMessageFlags', { name: `L:A32NX_EFIS_${efisSide}_ND_FM_MESSAGE_FLAGS`, type: SimVarValueType.Number }],
            ['crossTrackError', { name: 'L:A32NX_FG_CROSS_TRACK_ERROR', type: SimVarValueType.NM }],
        ]), bus);
    }
}
