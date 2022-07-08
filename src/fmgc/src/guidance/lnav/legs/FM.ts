import { EfisSymbols } from '@fmgc/efis/EfisSymbols';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { courseToFixDistanceToGo, fixToFixGuidance, getAlongTrackDistanceTo } from '@fmgc/guidance/lnav/CommonGeometry';
import { LegMetadata } from '@fmgc/guidance/lnav/legs';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { DebugPointColour, PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { SegmentType } from '@fmgc/wtsdk';
import { GeometryNdSymbol } from '@shared/NavigationDisplay';

export class FMLeg extends Leg {
    private startPoint: Coordinates;

    private endPoint: Coordinates;

    constructor(
        private fix: WayPoint,
        private course: DegreesTrue,
        public readonly metadata: Readonly<LegMetadata>,
        public segment: SegmentType,
    ) {
        super();

        this.startPoint = fix.infos.coordinates;

        this.endPoint = Avionics.Utils.bearingDistanceToCoordinates(
            this.course,
            1,
            this.startPoint.lat,
            this.startPoint.long,
        );
    }

    get inboundCourse(): Degrees {
        return this.course;
    }

    get outboundCourse(): Degrees {
        return this.course;
    }

    get terminationWaypoint(): Coordinates {
        return this.fix.infos.coordinates;
    }

    get ident(): string {
        return this.fix.ident;
    }

    get mapSymbols(): GeometryNdSymbol[] {
        const followingDiscont = !!this.inboundGuidable;

        if (followingDiscont) {
            return [{
                databaseId: this.fix.icao,
                ident: this.fix.ident,
                location: this.fix.infos.coordinates,
            }];
        }

        return [];
    }

    getPathStartPoint(): Coordinates {
        return this.startPoint;
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.endPoint;
    }

    get distance(): NauticalMiles {
        return 1;
    }

    get distanceToTermination(): NauticalMiles {
        return 1;
    }

    get overflyTermFix(): boolean {
        return true;
    }

    recomputeWithParameters(isActive: boolean, tas: Knots, gs: Knots, ppos: Coordinates, trueTrack: DegreesTrue): void {
        this.isComputed = true;

        let inboundLeg: Leg;
        if (this.inboundGuidable instanceof Leg) {
            inboundLeg = this.inboundGuidable;
        }

        if (inboundLeg?.terminationWaypoint instanceof WayPoint && inboundLeg.terminationWaypoint.isRunway) {
            this.startPoint = inboundLeg.terminationWaypoint.additionalData.runwayMidpoint;
        }
        if (this.inboundGuidable?.isComputed) {
            this.startPoint = this.inboundGuidable.getPathEndPoint();
        }

        if (isActive) {
            // TODO check that this works past the endPoint
            const distAlongTrack = getAlongTrackDistanceTo(this.startPoint, this.endPoint, ppos);
            this.endPoint = Avionics.Utils.bearingDistanceToCoordinates(
                this.course,
                1 + distAlongTrack,
                this.startPoint.lat,
                this.startPoint.long,
            );
        }
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, tas: Knots, gs: Knots): GuidanceParameters {
        return fixToFixGuidance(ppos, trueTrack, this.fix.infos.coordinates, this.endPoint);
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles | undefined {
        return courseToFixDistanceToGo(ppos, this.course, this.endPoint);
    }

    isAbeam(ppos: Coordinates): boolean {
        return true; // TODO useless on leg?
    }

    get predictedPath(): PathVector[] | undefined {
        if (this.isNull) {
            return [];
        }

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            return [
                {
                    type: PathVectorType.SemiInfiniteLine,
                    startPoint: this.getPathStartPoint(),
                    course: this.course,
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.fix.infos.coordinates,
                    annotation: 'FM ORIGIN',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.startPoint,
                    annotation: 'FM START',
                    colour: DebugPointColour.Yellow,
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.endPoint,
                    annotation: 'FM END',
                    colour: DebugPointColour.Magenta,
                },
            ];
        } else {
            return [
                {
                    type: PathVectorType.SemiInfiniteLine,
                    startPoint: this.startPoint,
                    course: this.course,
                },
            ];
        }
    }

    getNominalRollAngle(gs: MetresPerSecond): Degrees {
        return 0;
    }

    get repr(): string {
        return `FM ${this.fix.ident} @ ${this.course}`;
    }
}
