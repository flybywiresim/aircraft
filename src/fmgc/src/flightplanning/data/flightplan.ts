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
     * Distance from previous waypoint in flight plan in nautical miles
     */
    distanceInFP: number;

    /**
     * Distance from PPOS in nautical miles
     */
    distanceFromPpos: number;

    /**
     * Predicted time from PPOS in seconds
     */
    timeFromPpos: number;

    /**
     * Predicted ETA from PPOS in seconds
     */
    etaFromPpos: number;
}

export interface ApproachStats {
    name: string;

    /**
     * Distance from PPOS in nautical miles
     */
     distanceFromPpos: number;
}
