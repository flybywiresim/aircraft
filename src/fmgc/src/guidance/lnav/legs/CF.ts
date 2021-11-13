import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { Geo } from '@fmgc/utils/Geo';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { PathVector, PathVectorType } from '../PathVector';

export class CFLeg extends XFLeg {
    private computedPath: PathVector[] = [];

    constructor(
        public readonly fix: WayPoint,
        public readonly course: DegreesTrue,
        segment: SegmentType,
        indexInFullPath: number,
    ) {
        super();

        this.segment = segment;
        this.indexInFullPath = indexInFullPath;
    }

    private inboundGuidable: Guidable | undefined;

    private outboundGuidable: Guidable | undefined;

    getPathStartPoint(): Coordinates | undefined {
        if (this.inboundGuidable) {
            return this.inboundGuidable.getPathEndPoint();
        }

        // Start the leg 1nm before REF FIX
        return this.estimateStartWithoutInboundGuidable();
    }

    private estimateStartWithoutInboundGuidable(): Coordinates {
        const inverseCourse = Avionics.Utils.clampAngle(this.course + 180);

        return Avionics.Utils.bearingDistanceToCoordinates(
            inverseCourse,
            1,
            this.fix.infos.coordinates.lat,
            this.fix.infos.coordinates.long,
        );
    }

    getPathEndPoint(): Coordinates | undefined {
        if (this.outboundGuidable instanceof FixedRadiusTransition && this.outboundGuidable.isComputed) {
            return this.outboundGuidable.getPathStartPoint();
        }

        return this.fix.infos.coordinates;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    recomputeWithParameters(isActive: boolean, _tas: Knots, _gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        this.inboundGuidable = previousGuidable;
        this.outboundGuidable = nextGuidable;

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
                    annotation: 'CF START',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathEndPoint(),
                    annotation: 'CF END',
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

    get isCircularArc(): boolean {
        return false;
    }

    get speedConstraint(): SpeedConstraint | undefined {
        return undefined;
    }

    get repr(): string {
        return `CF(${this.course.toFixed(1)}°) TO ${this.fix.ident}`;
    }
}
