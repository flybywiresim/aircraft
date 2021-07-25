import { Degrees, NauticalMiles } from '@typings/types';
import { ControlLaw, GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { Leg } from '@fmgc/guidance/lnav/legs';

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

    getGuidanceParameters(_ppos: LatLongData, _trueTrack): GuidanceParameters | null {
        return {
            law: ControlLaw.HEADING,
            heading: this.heading,
        };
    }

    getDistanceToGo(_ppos: LatLongData): NauticalMiles {
        return 1;
    }

    get distance(): NauticalMiles {
        return 1;
    }

    isAbeam(_ppos: LatLongAlt): boolean {
        return true;
    }

    toString(): string {
        return `<VMLeg course=${this.heading}>`;
    }
}
