import { MathUtils } from '@shared/MathUtils';

export class WindVector {
    constructor(public direction: DegreesTrue, public speed: Knots) {
        Avionics.Utils.clampAngle(direction);

        if (speed < 0) {
            this.flipDirection();
            this.speed *= -1;
        }
    }

    private flipDirection() {
        if (this.direction < 180) {
            this.direction += 180;
        }

        this.direction -= 180;
    }

    static default(): WindVector {
        return new WindVector(0, 0);
    }
}

export interface WindVectorAtAltitude {
    vector: WindVector,
    altitude: Feet,
}

export interface WindMeasurement {
    wind: WindVectorAtAltitude,
    distanceFromStart: NauticalMiles
}

export class WindComponent {
    /**
     *
     * @param value +ve for a tailwind, -ve for headwind
     */
    constructor(public value: number) { }

    static fromVector(vector: WindVector, planeHeading: DegreesTrue): WindComponent {
        return new WindComponent(vector.speed * Math.cos(MathUtils.DEGREES_TO_RADIANS * Avionics.Utils.diffAngle(vector.direction, planeHeading)));
    }

    static zero(): WindComponent {
        return new WindComponent(0);
    }
}
