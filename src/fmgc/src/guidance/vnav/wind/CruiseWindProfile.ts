import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { WindComponent, WindVector } from '@fmgc/guidance/vnav/wind';
import { WindForecastInputs } from '@fmgc/guidance/vnav/wind/WindForecastInputs';
import { WindObserver } from '@fmgc/guidance/vnav/wind/WindObserver';
import { WindProfile } from '@fmgc/guidance/vnav/wind/WindProfile';
import { FmgcFlightPhase } from '@shared/flightphase';

// TODO: Make this actually use cruise winds.
// I have kept it like this for now, so I can inject it into the profile computations already and change the actual code when I'm ready.
export class CruiseWindProfile implements WindProfile {
    constructor(
        private parameterObserver: VerticalProfileComputationParametersObserver,
        private inputs: WindForecastInputs,
        private measurementDevice: WindObserver,
        private aircraftDistanceFromStart: NauticalMiles,
    ) { }

    private interpolateByAltitude(altitude: Feet): WindVector {
        if (this.inputs.climbWinds.length === 0) {
            return WindVector.default();
        }

        if (altitude <= this.inputs.climbWinds[0].altitude) {
            return this.inputs.climbWinds[0].vector;
        }

        for (let i = 0; i < this.inputs.climbWinds.length - 1; i++) {
            if (altitude > this.inputs.climbWinds[i].altitude && altitude <= this.inputs.climbWinds[i + 1].altitude) {
                const scaling = (altitude - this.inputs.climbWinds[i].altitude) / (this.inputs.climbWinds[i + 1].altitude - this.inputs.climbWinds[i].altitude);

                return new WindVector(
                    (1 - scaling) * this.inputs.climbWinds[i].vector.direction + scaling * this.inputs.climbWinds[i + 1].vector.direction,
                    (1 - scaling) * this.inputs.climbWinds[i].vector.speed + scaling * this.inputs.climbWinds[i + 1].vector.speed,
                );
            }
        }

        return this.inputs.climbWinds[this.inputs.climbWinds.length - 1].vector;
    }

    getHeadwindComponent(distanceFromStart: NauticalMiles, altitude: Feet, planeHeading: DegreesTrue): WindComponent {
        if (this.inputs.climbWinds.length === 0 && this.parameterObserver.get().flightPhase < FmgcFlightPhase.Takeoff) {
            return this.inputs.tripWind;
        }

        const measurement = this.measurementDevice.get();
        if (this.inputs.climbWinds.length === 0) {
            return WindComponent.fromVector(measurement, planeHeading);
        }

        const forecast = this.interpolateByAltitude(altitude);
        const distanceBetweenToAirplane = distanceFromStart - this.aircraftDistanceFromStart;

        if (distanceBetweenToAirplane < 0) {
            console.warn('[FMS/VNAV] Wind prediction made for point behind aircraft');
        }

        if (!measurement || distanceBetweenToAirplane > 0) {
            return WindComponent.fromVector(forecast, planeHeading);
        }

        const scaling = Math.min(1, (distanceFromStart - this.aircraftDistanceFromStart) / 200);

        return WindComponent.fromVector(this.interpolateVectors(measurement, forecast, scaling), planeHeading);
    }

    private interpolateVectors(vector1: WindVector, vector2: WindVector, scaling: number): WindVector {
        return new WindVector(
            (1 - scaling) * vector1.direction + scaling * vector2.direction,
            (1 - scaling) * vector1.speed + scaling * vector2.speed,
        );
    }
}
