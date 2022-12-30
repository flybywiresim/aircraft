import { Waypoint } from '@atsu/common/types';

export interface AtsuFmsMessages {
    lastWaypoint: Waypoint;
    activeWaypoint: Waypoint;
    nextWaypoint: Waypoint;
    destination: Waypoint;
}
