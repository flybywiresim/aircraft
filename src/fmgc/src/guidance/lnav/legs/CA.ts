import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { PathVector, PathVectorType } from '../PathVector';

export class CALeg extends Leg {
    public estimatedTermination: Coordinates | undefined;

    private computedPath: PathVector[] = [];

    constructor(
        public readonly course: Degrees,
        public readonly altitude: Feet,
        segment: SegmentType,
        constrainedTurnDirection = TurnDirection.Unknown,
    ) {
        super();

        this.segment = segment;
        this.constrainedTurnDirection = constrainedTurnDirection;
    }

    private start: Coordinates;

    private inboundGuidable: Guidable | undefined;

    private outboundGuidable: Guidable | undefined;

    get terminationWaypoint(): WayPoint | Coordinates | undefined {
        return this.estimatedTermination;
    }

    get ident(): string {
        return Math.round(this.altitude).toString();
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.inboundGuidable?.getPathEndPoint();
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.estimatedTermination;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    private wasMovedByPpos = false;

    recomputeWithParameters(isActive: boolean, _tas: Knots, _gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        this.inboundGuidable = previousGuidable;
        this.outboundGuidable = nextGuidable;

        // FIXME somehow after reloads the isRunway property is gone, so consider airports as runways for now
        const afterRunway = previousGuidable instanceof IFLeg && (previousGuidable.fix.isRunway || previousGuidable.fix.icao.startsWith('A'));

        // We assign / spread properties here to avoid copying references and causing bugs
        if (isActive && !afterRunway) {
            this.wasMovedByPpos = true;

            if (!this.start) {
                this.start = { ...ppos };
            } else {
                this.start.lat = ppos.lat;
                this.start.long = ppos.long;
            }

            if (!this.estimatedTermination) {
                this.recomputeEstimatedTermination();
            }
        } else if (!this.wasMovedByPpos) {
            const newPreviousGuidableStart = previousGuidable?.getPathEndPoint();

            if (newPreviousGuidableStart) {
                if (!this.start) {
                    this.start = { ...newPreviousGuidableStart };
                } else {
                    this.start.lat = newPreviousGuidableStart.lat;
                    this.start.long = newPreviousGuidableStart.long;
                }
            }

            this.recomputeEstimatedTermination();
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
                    annotation: 'CA START',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathEndPoint(),
                    annotation: 'CA END',
                },
            );
        }

        this.isComputed = true;
    }

    private recomputeEstimatedTermination() {
        const ESTIMATED_VS = 2000; // feet per minute
        const ESTIMATED_KTS = 175; // NM per hour

        // FIXME hax!
        let originAltitude = 0;
        if (this.inboundGuidable instanceof IFLeg && this.inboundGuidable.fix.icao.startsWith('A')) {
            originAltitude = (this.inboundGuidable.fix.infos as AirportInfo).oneWayRunways[0].elevation * 3.28084;
        }

        const minutesToAltitude = (this.altitude - Math.max(0, originAltitude)) / ESTIMATED_VS; // minutes
        const distanceToAltitude = (minutesToAltitude / 60) * ESTIMATED_KTS; // NM

        this.estimatedTermination = Avionics.Utils.bearingDistanceToCoordinates(
            this.course,
            distanceToAltitude,
            this.start.lat,
            this.start.long,
        );
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

    getDistanceToGo(ppos: Coordinates): NauticalMiles {
        return courseToFixDistanceToGo(ppos, this.course, this.estimatedTermination);
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees): GuidanceParameters | undefined {
        return courseToFixGuidance(ppos, trueTrack, this.course, this.estimatedTermination);
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
        return `CA(${this.course.toFixed(1)}°) TO ${Math.round(this.altitude)} FT`;
    }
}
