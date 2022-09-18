import { WindComponent } from '@fmgc/guidance/vnav/wind';

export interface WindProfile {
    getHeadwindComponent(distanceFromStart: NauticalMiles, altitude: Feet, planeHeading: DegreesTrue): WindComponent
}
