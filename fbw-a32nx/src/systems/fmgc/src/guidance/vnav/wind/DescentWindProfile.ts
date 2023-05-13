import { WindComponent, WindVector } from '@fmgc/guidance/vnav/wind';
import { WindForecastInputs } from '@fmgc/guidance/vnav/wind/WindForecastInputs';
import { WindObserver } from '@fmgc/guidance/vnav/wind/WindObserver';
import { WindProfile } from '@fmgc/guidance/vnav/wind/WindProfile';

export class DescentWindProfile implements WindProfile {
    constructor(
        private inputs: WindForecastInputs,
        private measurementDevice: WindObserver,
        private aircraftDistanceFromStart: NauticalMiles,
    ) { }

    private interpolateByAltitude(altitude: Feet): WindVector {
        if (this.inputs.descentWinds.length === 0) {
            return WindVector.default();
        }

        if (altitude <= this.inputs.descentWinds[0].altitude) {
            return this.inputs.descentWinds[0].vector;
        }

        for (let i = 0; i < this.inputs.descentWinds.length - 1; i++) {
            if (altitude > this.inputs.descentWinds[i].altitude && altitude <= this.inputs.descentWinds[i + 1].altitude) {
                const scaling = (altitude - this.inputs.descentWinds[i].altitude) / (this.inputs.descentWinds[i + 1].altitude - this.inputs.descentWinds[i].altitude);

                return this.interpolateVectors(this.inputs.descentWinds[i].vector, this.inputs.descentWinds[i + 1].vector, scaling);
            }
        }

        return this.inputs.descentWinds[this.inputs.descentWinds.length - 1].vector;
    }

    getHeadwindComponent(distanceFromStart: NauticalMiles, altitude: Feet, planeHeading: DegreesTrue): WindComponent {
        const hasForecast = this.inputs.descentWinds.length !== 0;
        const measurement = this.measurementDevice.get();
        const hasMeasurement = measurement !== null;

        if (!hasForecast) {
            if (!hasMeasurement) {
                return this.inputs.tripWind;
            }

            return WindComponent.fromVector(measurement, planeHeading);
        }

        const forecast = this.interpolateByAltitude(altitude);
        const distanceToAirplane = distanceFromStart - this.aircraftDistanceFromStart;
        if (!hasMeasurement || distanceToAirplane < 0) {
            return WindComponent.fromVector(forecast, planeHeading);
        }

        const scaling = Math.min(1, distanceToAirplane / 200);

        return WindComponent.fromVector(this.interpolateVectors(measurement, forecast, scaling), planeHeading);
    }

    private interpolateVectors(vector1: WindVector, vector2: WindVector, scaling: number): WindVector {
        return new WindVector(
            (1 - scaling) * vector1.direction + scaling * vector2.direction,
            (1 - scaling) * vector1.speed + scaling * vector2.speed,
        );
    }
}
