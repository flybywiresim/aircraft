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

interface UplinkedWaypointWindEntry extends UplinkedWindLevel {
  type: 'waypoint';
  fixIdent: string;
}

interface UplinkedLatLonWindEntry extends UplinkedWindLevel {
  type: 'latlon';
  lat: number;
  long: number;
}

type UplinkedCruiseWindEntry = UplinkedWaypointWindEntry | UplinkedLatLonWindEntry;
