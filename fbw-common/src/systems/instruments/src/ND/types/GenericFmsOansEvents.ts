export interface GenericFmsOansEvents {
    fmsOrigin: string,
    fmsDestination: string,
    fmsAlternate: string,
    fmsLandingRunway: string;
    /** Length of selected landing runway, in meters. Null if no runway selected. */
    fmsLandingRunwayLength: number;
    /** Distance to opposite end of runway, in meters. Null if no runway selected. */
    landingRwyRemainingDistance: number;
}
