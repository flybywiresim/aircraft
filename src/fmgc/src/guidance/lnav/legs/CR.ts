import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { Geo } from '@fmgc/utils/Geo';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { PathVector, PathVectorType } from '../PathVector';

export class CRLeg extends Leg {
    private computedPath: PathVector[] = [];

    constructor(
        public readonly course: DegreesTrue,
        public readonly origin: { coordinates: Coordinates, ident: string, theta: DegreesMagnetic },
        public readonly radial: DegreesTrue,
        segment: SegmentType,
        constrainedTurnDirection = TurnDirection.Unknown,
    ) {
        super();

        this.segment = segment;
        this.constrainedTurnDirection = constrainedTurnDirection;
    }

    private intercept: Coordinates | undefined = undefined;

    get terminationWaypoint(): Coordinates {
        return this.intercept;
    }

    get ident(): string {
        return this.origin.ident.substring(0, 3) + this.origin.theta.toFixed(0);
    }

    private inboundGuidable: Guidable | undefined;

    private outboundGuidable: Guidable | undefined;

    getPathStartPoint(): Coordinates | undefined {
        if (this.inboundGuidable && this.inboundGuidable.isComputed) {
            return this.inboundGuidable.getPathEndPoint();
        }

        throw new Error('[CRLeg] No computed inbound guidable.');
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.intercept;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    recomputeWithParameters(isActive: boolean, _tas: Knots, _gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        this.inboundGuidable = previousGuidable;
        this.outboundGuidable = nextGuidable;

        this.intercept = Geo.doublePlaceBearingIntercept(
            this.getPathStartPoint(),
            this.origin.coordinates,
            this.course,
            this.radial,
        );

        this.computedPath = [{
            type: PathVectorType.Line,
            startPoint: this.getPathStartPoint(),
            endPoint: this.intercept,
        }];

        this.isComputed = true;

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.computedPath.push(
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathStartPoint(),
                    annotation: 'CR START',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathEndPoint(),
                    annotation: 'CR END',
                },
            );
        }
    }

    get altitudeConstraint(): AltitudeConstraint | undefined {
        return undefined;
    }

    get inboundCourse(): Degrees {
        return this.course;
    }

    get outboundCourse(): Degrees {
        return this.course;
    }

    get distance(): NauticalMiles {
        return Geo.getDistance(this.getPathStartPoint(), this.getPathEndPoint());
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles {
        return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees): GuidanceParameters | undefined {
        return courseToFixGuidance(ppos, trueTrack, this.course, this.getPathEndPoint());
    }

    getNominalRollAngle(_gs: Knots): Degrees {
        return 0;
    }

    getPseudoWaypointLocation(_distanceBeforeTerminator: NauticalMiles): Coordinates | undefined {
        return undefined;
    }

    isAbeam(ppos: Coordinates): boolean {
        const dtg = courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());

        return dtg >= 0 && dtg <= this.distance;
    }

    get speedConstraint(): SpeedConstraint | undefined {
        return undefined;
    }

    get repr(): string {
        return `CR`;
    }
}
