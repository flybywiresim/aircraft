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
     * Distance from PPOS in nautical miles
     */
    distanceFromPpos: number;

    /**
     * Predicted time from PPOS in seconds
     */
    timeFromPpos: number;
}

export interface ApproachStats {
    name: string;

    /**
     * Distance from PPOS in nautical miles
     */
     distanceFromPpos: number;
}
