import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { AircraftHeadingProfile } from '@fmgc/guidance/vnav/wind/AircraftHeadingProfile';
import { WindProfile } from '@fmgc/guidance/vnav/wind/WindProfile';

export class HeadwindProfile {
    constructor(
        private windProfile: WindProfile,
        private headingProfile: AircraftHeadingProfile,
    ) { }

    /**
     * Returns the predicted headwind component at a given distanceFromStart and altitude
     * @param distanceFromStart
     * @param altitude
     * @returns
     */
    getHeadwindComponent(distanceFromStart: NauticalMiles, altitude: Feet): WindComponent {
        const heading = this.headingProfile.get(distanceFromStart);
        return this.windProfile.getHeadwindComponent(distanceFromStart, altitude, heading);
    }
}
