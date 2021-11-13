import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Guidable } from '@fmgc/guidance/Guidable';

export abstract class Leg extends Guidable {
    segment: SegmentType;

    indexInFullPath: number

    abstract get inboundCourse(): Degrees | undefined;

    abstract get outboundCourse(): Degrees | undefined;

    abstract get distance(): NauticalMiles | undefined;

    abstract get ident(): string

    abstract get speedConstraint(): SpeedConstraint | undefined;

    abstract get altitudeConstraint(): AltitudeConstraint | undefined;

    get disableAutomaticSequencing(): boolean {
        return false;
    }

    /** @inheritDoc */
    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, _previousGuidable: Guidable, _nextGuidable: Guidable): void {
        // Default impl.
    }
}
