import { Coordinates } from 'msfs-geo';
import { DatabaseItem } from './Common';
import { VhfNavaid } from './VhfNavaid';
import { SectionCode } from './SectionCode';
import { Waypoint, WaypointArea } from './Waypoint';
import { NdbNavaid } from './NdbNavaid';

export interface BaseFix<T extends SectionCode> extends DatabaseItem<T> {
  location: Coordinates;

  area: WaypointArea;
}

/**
 * Union of all possible fix interfaces
 */
export type Fix = VhfNavaid | NdbNavaid | Waypoint;

export function isFix(o: any): o is Fix {
  return typeof o === 'object' && 'location' in o && 'databaseId' in o;
}
