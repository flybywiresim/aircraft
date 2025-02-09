import { NdSymbol } from '@flybywiresim/fbw-sdk';

export enum TerrainLevelMode {
  PeaksMode = 0,
  Warning = 1,
  Caution = 2,
}

export interface GenericTawsEvents {
  'egpwc.minElevation': number;
  'egpwc.minElevationMode': TerrainLevelMode;
  'egpwc.maxElevation': number;
  'egpwc.maxElevationMode': TerrainLevelMode;
  endOfVdMarker: NdSymbol | null;
}
