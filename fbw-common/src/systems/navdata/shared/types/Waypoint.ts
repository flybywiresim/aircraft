import { NauticalMiles } from 'msfs-geo';
import { EnrouteSubsectionCode, SectionCode } from './SectionCode';
import { BaseFix } from './BaseFix';

/**
 * Waypoint area
 */
export enum WaypointArea {
    Enroute,
    Terminal,
}

/**
 * Waypoint fix
 */
export interface Waypoint extends BaseFix<SectionCode.Enroute> {
    subSectionCode: EnrouteSubsectionCode.Waypoints,

    name?: string,
    // TODO more...

    /**
     * Distance from centre location for nearby airport query
     */
    distance?: NauticalMiles,
}
