import { Degrees, NauticalMiles, Track } from '@typings/types';
import { ControlLaw, GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { Leg, SpeedConstraint } from '@fmgc/guidance/lnav/legs';

// TODO needs updated with wind prediction, and maybe local magvar if following for longer distances
export class VMLeg implements Leg {
    public heading: Degrees;

    public initialCourse: Degrees;

    constructor(heading: Degrees, initialCourse: Degrees) {
        this.heading = heading;
        this.initialCourse = initialCourse;
    }

    get bearing(): Degrees {
        return this.initialCourse;
    }

    get distance(): NauticalMiles {
        return 1;
    }

    // Manual legs don't have speed contraints
    get speedConstraint(): SpeedConstraint | undefined {
        return undefined;
    }

    getGuidanceParameters(_ppos: LatLongData, _trueTrack: Track): GuidanceParameters | null {
        return {
            law: ControlLaw.HEADING,
            heading: this.heading,
        };
    }

    getDistanceToGo(_ppos: LatLongData): NauticalMiles {
        return 1;
    }

    isAbeam(_ppos: LatLongAlt): boolean {
        return true;
    }

    toString(): string {
        return `<VMLeg course=${this.heading}>`;
    }
}
