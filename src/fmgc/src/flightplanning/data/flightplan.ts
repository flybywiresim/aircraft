export interface WaypointStats {
    /**
     * Waypoint ident
     */
    ident: string;

    /**
     * Bearing from previous waypoint in seconds
     */
    bearingInFp: number;

    /**
     * Distance from PPOS in seconds
     */
    distanceFromPpos: number;

    /**
     * Predicted time from PPOS in seconds
     */
    timeFromPpos: number;
}
