import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { ControlLaw, GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { courseToFixDistanceToGo } from '@fmgc/guidance/lnav/CommonGeometry';
import { Geo } from '@fmgc/utils/Geo';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { PathVector, PathVectorType } from '../PathVector';

export class CILeg extends Leg {
    private computedPath: PathVector[] = [];

    constructor(
        public readonly course: DegreesTrue,
        public readonly nextLeg: Leg,
        segment: SegmentType,
        constrainedTurnDirection = TurnDirection.Unknown,
    ) {
        super();

        this.segment = segment;
        this.constrainedTurnDirection = constrainedTurnDirection;
    }

    intercept: Coordinates | undefined = undefined;

    get terminationWaypoint(): Coordinates {
        return this.intercept;
    }

    get distanceToTermFix(): NauticalMiles {
        return Avionics.Utils.computeGreatCircleDistance(this.getPathStartPoint(), this.intercept);
    }

    get ident(): string {
        return 'INTCPT';
    }

    private inboundGuidable: Guidable | undefined;

    private outboundGuidable: Guidable | undefined;

    getPathStartPoint(): Coordinates | undefined {
        if (this.inboundGuidable instanceof IFLeg) {
            return this.inboundGuidable.fix.infos.coordinates;
        } if (this.inboundGuidable && this.inboundGuidable.isComputed) {
            return this.inboundGuidable.getPathEndPoint();
        }

        throw new Error('[CRLeg] No computed inbound guidable.');
    }

    getPathEndPoint(): Coordinates | undefined {
        if (this.outboundGuidable instanceof FixedRadiusTransition && !this.outboundGuidable.isReverted && this.outboundGuidable.isComputed) {
            return this.outboundGuidable.getPathStartPoint();
        }

        return this.intercept;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    mustBeDeleted = false;

    recomputeWithParameters(isActive: boolean, _tas: Knots, _gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        this.inboundGuidable = previousGuidable;
        this.outboundGuidable = nextGuidable;

        this.intercept = Geo.legIntercept(
            this.getPathStartPoint(),
            this.course,
            this.nextLeg,
        );

        this.computedPath = [{
            type: PathVectorType.Line,
            startPoint: this.getPathStartPoint(),
            endPoint: this.getPathEndPoint(),
        }];

        this.isComputed = true;

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.computedPath.push(
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathStartPoint(),
                    annotation: 'CI START',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathEndPoint(),
                    annotation: 'CI END',
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

    getGuidanceParameters(_ppos: Coordinates, _trueTrack: Degrees): GuidanceParameters | undefined {
        return {
            law: ControlLaw.TRACK,
            course: this.course,
        };
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
        return `CI(${Math.trunc(this.course)}°)`;
    }
}
