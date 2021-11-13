/**
 * Functions for figuring out an appropriate course change for leg captures
 */
export class CourseChange {
    static normal(
        turnDirection: number,
        turnCenterDistance: NauticalMiles,
        trackChange: Degrees,
        radius: NauticalMiles,
    ): Degrees {
        if (turnDirection > 0) {
            if (turnCenterDistance >= radius) {
                return trackChange - 45;
            }
            return trackChange + 45;
        }

        if (-turnCenterDistance >= radius) {
            return trackChange + 45;
        }

        return trackChange - 45;
    }

    static reverse(
        turnDirection: number,
        turnCenterDistance: NauticalMiles,
        trackChange: Degrees,
        radius: NauticalMiles,
    ): Degrees {
        if (trackChange > 0) {
            if (turnCenterDistance > 0) {
                if (turnCenterDistance > radius) {
                    return trackChange - 45;
                }

                return trackChange + 45;
            }

            return trackChange + 45;
        }

        if (turnCenterDistance > 0) {
            return trackChange - 45;
        }

        if (-turnCenterDistance > radius) {
            return trackChange + 45;
        }
        return trackChange - 45;
    }

    static acuteFar(
        turnDirection: number,
        turnCenterDistance: NauticalMiles,
        trackChange: Degrees,
    ): Degrees {
        return turnDirection * (45 - Math.abs(trackChange));
    }

    static acuteNear(
        turnDirection: number,
        turnCenterDistance: NauticalMiles,
        trackChange: Degrees,
    ): Degrees {
        return turnDirection * (Math.abs(trackChange) + 45);
    }
}
