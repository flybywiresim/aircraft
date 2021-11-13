import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Guidable } from '@fmgc/guidance/Guidable';
import { Geo } from '@fmgc/utils/Geo';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';

export abstract class Leg extends Guidable {
    segment: SegmentType;

    constrainedTurnDirection = TurnDirection.Unknown;

    abstract get inboundCourse(): Degrees | undefined;

    abstract get outboundCourse(): Degrees | undefined;

    abstract get terminationWaypoint(): WayPoint | Coordinates | undefined;

    abstract get ident(): string

    displayedOnMap: boolean = true

    abstract get speedConstraint(): SpeedConstraint | undefined;

    abstract get altitudeConstraint(): AltitudeConstraint | undefined;

    get disableAutomaticSequencing(): boolean {
        return false;
    }

    /** @inheritDoc */
    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, _previousGuidable: Guidable, _nextGuidable: Guidable): void {
        // Default impl.
    }

    get distance(): NauticalMiles {
        return Geo.getDistance(this.getPathStartPoint(), this.getPathEndPoint());
    }

    get forcedTurnDirection(): TurnDirection {
        return TurnDirection.Either;
    }

    get overflyTermFix(): boolean {
        return false;
    }
}
