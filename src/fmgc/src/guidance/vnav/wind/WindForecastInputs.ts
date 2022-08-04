import { WindComponent, WindVector, WindVectorAtAltitude } from '@fmgc/guidance/vnav/wind';

export interface WindForecastInputs {
    tripWind: WindComponent;
    climbWinds: WindVectorAtAltitude[],
    cruiseWindsByWaypoint: Map<number, WindVectorAtAltitude[]>,
    descentWinds: WindVectorAtAltitude[],
    destinationWind: WindVector;
}
