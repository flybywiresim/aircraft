import { Waypoint } from '@atsu/common/types';

export interface FmsDataBusTypes {
    lastWaypoint: Waypoint;
    activeWaypoint: Waypoint;
    nextWaypoint: Waypoint;
    destination: Waypoint;
}
