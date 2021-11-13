import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Geo } from '@fmgc/utils/Geo';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { PathVector, PathVectorType } from '../PathVector';

export class DFLeg extends XFLeg {
    private computedPath: PathVector[] = [];

    constructor(
        fix: WayPoint,
        segment: SegmentType,
    ) {
        super(fix);

        this.segment = segment;
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.inboundGuidable?.getPathEndPoint() ?? this.estimateStartPoint();
    }

    getPathEndPoint(): Coordinates | undefined {
        if (this.outboundGuidable instanceof FixedRadiusTransition && !this.outboundGuidable.isReverted && this.outboundGuidable.isComputed) {
            return this.outboundGuidable.getTurningPoints()[0];
        }

        return this.fix.infos.coordinates;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    private start: Coordinates | undefined;

    private estimateStartPoint(): Coordinates {
        let bearing = 0;
        if (this.outboundGuidable instanceof Transition) {
            bearing = this.outboundGuidable.nextLeg.inboundCourse + 180;
        } else if (this.outboundGuidable instanceof Leg) {
            bearing = this.outboundGuidable.inboundCourse + 180;
        }

        bearing = Avionics.Utils.clampAngle(bearing);

        return Avionics.Utils.bearingDistanceToCoordinates(
            bearing,
            2,
            this.fix.infos.coordinates.long,
            this.fix.infos.coordinates.long,
        );
    }

    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        // We don't really do anything here
        this.inboundGuidable = previousGuidable;
        this.outboundGuidable = nextGuidable;

        const newStart = this.inboundGuidable?.getPathEndPoint() ?? this.estimateStartPoint();

        // Adjust the start point if we can
        if (newStart) {
            this.start = newStart;
        }

        this.computedPath = [{
            type: PathVectorType.Line,
            startPoint: this.start,
            endPoint: this.getPathEndPoint(),
        }];

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.computedPath.push(
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.start,
                    annotation: 'DF_START',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathEndPoint(),
                    annotation: 'DF_END',
                },
            );
        }

        this.isComputed = true;
    }

    get altitudeConstraint(): AltitudeConstraint | undefined {
        return undefined;
    }

    get inboundCourse(): Degrees {
        return Geo.getGreatCircleBearing(this.start, this.fix.infos.coordinates);
    }

    get outboundCourse(): Degrees {
        return Geo.getGreatCircleBearing(this.start, this.fix.infos.coordinates);
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles {
        return courseToFixDistanceToGo(ppos, this.outboundCourse, this.getPathEndPoint());
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees): GuidanceParameters | undefined {
        return courseToFixGuidance(ppos, trueTrack, this.outboundCourse, this.fix.infos.coordinates);
    }

    getNominalRollAngle(_gs: Knots): Degrees {
        return undefined;
    }

    isAbeam(_ppos: Coordinates): boolean {
        return false;
    }

    get speedConstraint(): SpeedConstraint | undefined {
        return undefined;
    }

    get repr(): string {
        return `DF TO '${this.fix.ident}'`;
    }
}
