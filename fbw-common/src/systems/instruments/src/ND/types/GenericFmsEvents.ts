export interface GenericFmsEvents {
  ndMessageFlags: number;
  crossTrackError: number;
  linearDeviationActive: boolean;
  targetAltitude: number;
  verticalProfileLatched: boolean;
  showSpeedMargins: boolean;
  upperSpeedMargin: number;
  lowerSpeedMargin: number;
  rnp: number;
  toWptIdent0: number;
  toWptIdent1: number;
  toWptBearing: number;
  toWptTrueBearing: number;
  toWptDistance: number;
  toWptEta: number;
  apprMessage0: number;
  apprMessage1: number;
  mrpLat: number;
  mrpLong: number;
}
