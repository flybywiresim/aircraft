export interface TawsEfisDataDto {
  ndRange: number;

  arcMode: boolean;

  terrSelected: boolean;

  efisMode: number;

  vdRangeLower: number;

  vdRangeUpper: number;
}

export interface TawsAircraftStatusDataDto {
  adiruDataValid: boolean;

  tawsInop: boolean;

  latitude: number;

  longitude: number;

  altitude: number;

  heading: number;

  verticalSpeed: number;

  gearIsDown: boolean;

  runwayDataValid: boolean;

  runwayLatitude: number;

  runwayLongitude: number;

  efisDataCapt: TawsEfisDataDto;

  efisDataFO: TawsEfisDataDto;

  navigationDisplayRenderingMode: number;

  manualAzimEnabled: boolean;

  manualAzimDegrees: number;

  groundTruthLatitude: number;

  groundTruthLongitude: number;
}

export interface WaypointDto {
  latitude: number;

  longitude: number;
}

export interface ElevationSamplePathDto {
  pathWidth: number;

  trackChangesSignificantlyAtDistance: number;

  waypoints: WaypointDto[];
}
