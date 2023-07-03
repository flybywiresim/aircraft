import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { EfisSide } from '@shared/NavigationDisplay';

export enum TerrainLevelMode {
    PeaksMode = 0,
    Warning = 1,
    Caution = 2,
}

export interface EgpwcSimVars {
    'egpwc.minElevation': number,
    'egpwc.minElevationMode': TerrainLevelMode,
    'egpwc.maxElevation': number,
    'egpwc.maxElevationMode': TerrainLevelMode,
}

export class EgpwcBusPublisher extends SimVarPublisher<EgpwcSimVars> {
    constructor(bus: EventBus, side: EfisSide) {
        super(new Map([
            ['egpwc.minElevation', { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_MIN_ELEVATION`, type: SimVarValueType.Number }],
            ['egpwc.minElevationMode', { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_MIN_ELEVATION_MODE`, type: SimVarValueType.Number }],
            ['egpwc.maxElevation', { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_MAX_ELEVATION`, type: SimVarValueType.Number }],
            ['egpwc.maxElevationMode', { name: `L:A32NX_EGPWC_ND_${side}_TERRAIN_MAX_ELEVATION_MODE`, type: SimVarValueType.Number }],
        ]), bus);
    }
}
