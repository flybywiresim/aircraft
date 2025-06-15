export interface WindUplinkMessage {
  climbWinds?: UplinkedWindLevel[];
  cruiseWinds?: UplinkedCruiseWindEntry[];
  descentWinds?: UplinkedWindLevel[];
  alternateWind?: UplinkedWindLevel;
}

interface UplinkedWindEntry {
  trueDegrees: number;
  magnitude: number;
}

export interface UplinkedWindLevel extends UplinkedWindEntry {
  altitude: number;
}

interface UplinkedCruiseWindEntry extends UplinkedWindLevel {
  fixIdent: string;
}
