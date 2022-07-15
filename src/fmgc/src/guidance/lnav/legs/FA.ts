import { EfisSymbols } from '@fmgc/efis/EfisSymbols';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { courseToFixDistanceToGo, fixToFixGuidance, getAlongTrackDistanceTo } from '@fmgc/guidance/lnav/CommonGeometry';
import { LegMetadata } from '@fmgc/guidance/lnav/legs';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { getNavigation } from '@fmgc/navigation/Navigation';
import { SegmentType } from '@fmgc/wtsdk';
import { GeometryNdSymbol } from '@shared/NavigationDisplay';

export class FALeg extends Leg {
    private wasActive = false;

    private termConditionMet = false;

    private startPoint: Coordinates;

    private endPoint: Coordinates;

    private predictedDistance: NauticalMiles = 1;

    constructor(
        private fix: WayPoint,
        private course: DegreesTrue,
        private altitude: Feet,
        public readonly metadata: Readonly<LegMetadata>,
        public segment: SegmentType,
    ) {
        super();

        this.startPoint = fix.infos.coordinates;

        this.endPoint = Avionics.Utils.bearingDistanceToCoordinates(
            this.course,
            this.predictedDistance,
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
        return this.endPoint;
    }

    get ident(): string {
        return Math.round(this.altitude).toString();
    }

    get mapSymbols(): GeometryNdSymbol[] {
        const symbols = [];

        const followingDiscont = !this.inboundGuidable;

        if (followingDiscont) {
            symbols.push({
                databaseId: this.fix.icao,
                ident: this.fix.ident,
                location: this.fix.infos.coordinates,
            });
        }

        symbols.push({
            databaseId: EfisSymbols.tempDatabaseId(this.ident),
            ident: this.ident,
            location: this.getPathEndPoint(),
            speedConstraint: EfisSymbols.mapSpeedConstraintFromMetadata(this.metadata.speedConstraint),
        });

        return symbols;
    }

    getPathStartPoint(): Coordinates {
        return this.startPoint;
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.endPoint;
    }

    get distance(): NauticalMiles {
        return this.predictedDistance;
    }

    get distanceToTermination(): NauticalMiles {
        return this.distance;
    }

    get overflyTermFix(): boolean {
        return true;
    }

    recomputeWithParameters(isActive: boolean, tas: Knots, gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue): void {
        this.isComputed = true;

        this.wasActive = this.wasActive || isActive;

        if (this.wasActive && !isActive) {
            return;
        }

        const currentAltitude = getNavigation()?.currentAltitude ?? 0;

        this.termConditionMet = this.termConditionMet || currentAltitude >= this.altitude;

        if (!this.wasActive && this.termConditionMet) {
            this.isNull = true;
            return;
        }
        if (this.termConditionMet) {
            // freeze the leg once the term condition is met
            return;
        }

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

        this.predictedDistance = 0;

        if (isActive) {
            // TODO vnav to calc the climb
            const altDiff = Math.max(0, this.altitude - currentAltitude);
            const targetVs = 2000;
            const distToAltitude = altDiff / targetVs * (gs / 60);

            // TODO check that this works past the endPoint
            const distAlongTrack = getAlongTrackDistanceTo(this.startPoint, this.endPoint, ppos);

            this.predictedDistance += distAlongTrack;
            this.predictedDistance += distToAltitude;
        } else {
            // TODO vnav to calc the climb
            const altDiff = Math.max(0, this.altitude - this.predictedClimbStartAltitude);
            const targetVs = 2000;
            const distToAltitude = altDiff / targetVs * (gs / 60);

            this.predictedDistance += distToAltitude;

            if (distToAltitude === 0) {
                this.isNull = true;
                return;
            }
        }

        this.isNull = false;

        this.endPoint = Avionics.Utils.bearingDistanceToCoordinates(
            this.course,
            this.predictedDistance,
            this.startPoint.lat,
            this.startPoint.long,
        );

        // hack to drive some of the old fpm machinery
        this.fix.distanceInFP = this.predictedDistance;
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, _tas: Knots, _gs: Knots): GuidanceParameters {
        return fixToFixGuidance(ppos, trueTrack, this.fix.infos.coordinates, this.endPoint);
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles | undefined {
        return courseToFixDistanceToGo(ppos, this.course, this.endPoint);
    }

    isAbeam(_ppos: Coordinates): boolean {
        return true; // TODO useless on leg?
    }

    get predictedPath(): PathVector[] | undefined {
        if (this.isNull) {
            return [];
        }

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            return [
                {
                    type: PathVectorType.Line,
                    startPoint: this.getPathStartPoint(),
                    endPoint: this.getPathEndPoint(),
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.fix.infos.coordinates,
                    annotation: 'FA ORIGIN',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.startPoint,
                    annotation: 'FA START',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.endPoint,
                    annotation: 'FA END',
                },
            ];
        }
        return [
            {
                type: PathVectorType.Line,
                startPoint: this.getPathStartPoint(),
                endPoint: this.getPathEndPoint(),
            },
        ];
    }

    getNominalRollAngle(_gs: MetresPerSecond): Degrees {
        return 0;
    }

    get repr(): string {
        return `FA ${this.fix.ident} @ ${this.course} to ${this.altitude} ft`;
    }
}
