import { Fmgc } from '@fmgc/guidance/GuidanceController';
import { WindComponent, WindVector, WindVectorAtAltitude } from '@fmgc/guidance/vnav/wind';
import { FmcWinds, FmcWindEntry } from '@fmgc/guidance/vnav/wind/types';
import { WindForecastInputs } from '@fmgc/guidance/vnav/wind/WindForecastInputs';

export class WindForecastInputObserver {
    private inputs: WindForecastInputs

    constructor(private fmgc: Fmgc) {
        this.inputs = {
            tripWind: new WindComponent(0),
            climbWinds: [],
            cruiseWindsByWaypoint: new Map<number, WindVectorAtAltitude[]>(),
            descentWinds: [],
            destinationWind: new WindVector(0, 0),
        };

        this.update();
    }

    update() {
        this.inputs.tripWind = new WindComponent(this.fmgc.getTripWind() ?? 0);
        this.parseFmcWinds(this.fmgc.getWinds());

        const { direction, speed } = this.fmgc.getApproachWind();
        this.inputs.destinationWind = new WindVector(direction, speed);
    }

    get(): WindForecastInputs {
        return this.inputs;
    }

    get tripWind(): WindComponent {
        return this.inputs.tripWind;
    }

    get climbWinds(): WindVectorAtAltitude[] {
        return this.inputs.climbWinds;
    }

    get cruiseWindsByWaypoint(): Map<number, WindVectorAtAltitude[]> {
        return this.inputs.cruiseWindsByWaypoint;
    }

    get descentWinds(): WindVectorAtAltitude[] {
        return this.inputs.descentWinds;
    }

    get destinationWind(): WindVector {
        return this.inputs.destinationWind;
    }

    private parseFmcWinds(fmcWinds: FmcWinds) {
        const parseFmcWindEntry = ({ direction, speed, altitude }: FmcWindEntry): WindVectorAtAltitude => ({ altitude, vector: new WindVector(direction, speed) });

        this.inputs.climbWinds = fmcWinds.climb.map(parseFmcWindEntry);
        // TODO: Cruise winds
        this.inputs.descentWinds = fmcWinds.des.map(parseFmcWindEntry);
    }
}
