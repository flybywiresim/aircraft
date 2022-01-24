// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { arcDistanceToGo, arcGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Guidable } from '@fmgc/guidance/Guidable';
import { DmeArcTransition } from '@fmgc/guidance/lnav/transitions/DmeArcTransition';
import { MathUtils } from '@shared/MathUtils';
import { Geo } from '@fmgc/utils/Geo';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import {
    AltitudeConstraint,
    getAltitudeConstraintFromWaypoint,
    getSpeedConstraintFromWaypoint,
    SpeedConstraint,
} from '@fmgc/guidance/lnav/legs/index';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { distanceTo } from 'msfs-geo';
import { PathCaptureTransition } from '@fmgc/guidance/lnav/transitions/PathCaptureTransition';
import { PathVector, PathVectorType } from '../PathVector';

export class AFLeg extends XFLeg {
    predictedPath: PathVector[] = [];

    constructor(
        fix: WayPoint,
        private navaid: Coordinates,
        private rho: NauticalMiles,
        private theta: NauticalMiles,
        public boundaryRadial: NauticalMiles,
        segment: SegmentType,
    ) {
        super(fix);

        this.segment = segment;

        this.centre = navaid;
        this.radius = distanceTo(navaid, this.fix.infos.coordinates);
        this.terminationRadial = this.theta;
        this.bearing = Avionics.Utils.clampAngle(Geo.getGreatCircleBearing(this.centre, this.fix.infos.coordinates) + 90 * this.turnDirectionSign);
        this.startPoint = Geo.computeDestinationPoint(this.centre, this.radius, this.boundaryRadial);
        this.endPoint = Geo.computeDestinationPoint(this.centre, this.radius, this.terminationRadial);

        this.inboundCourse = this.boundaryRadial + 90 * this.turnDirectionSign;
        this.outboundCourse = this.terminationRadial + 90 * this.turnDirectionSign;
    }

    get altitudeConstraint(): AltitudeConstraint | undefined {
        return getAltitudeConstraintFromWaypoint(this.fix);
    }

    get speedConstraint(): SpeedConstraint | undefined {
        return getSpeedConstraintFromWaypoint(this.fix);
    }

    private previousGuidable: Guidable | undefined

    private nextGuidable: Guidable | undefined

    readonly centre: Coordinates | undefined

    private readonly terminationRadial: DegreesTrue | undefined;

    private readonly bearing: DegreesTrue | undefined

    private readonly startPoint: Coordinates | undefined

    private readonly endPoint: Coordinates | undefined

    readonly radius: NauticalMiles | undefined

    private sweepAngle: Degrees | undefined

    private clockwise: boolean | undefined

    inboundCourse: DegreesTrue | undefined

    outboundCourse: DegreesTrue | undefined

    getPathStartPoint(): Coordinates | undefined {
        return this.previousGuidable instanceof DmeArcTransition ? this.previousGuidable.getPathEndPoint() : this.startPoint;
    }

    getPathEndPoint(): Coordinates | undefined {
        if (this.nextGuidable instanceof DmeArcTransition && this.nextGuidable.isComputed) {
            return this.nextGuidable.getPathStartPoint();
        }

        return this.endPoint;
    }

    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        this.previousGuidable = previousGuidable;
        this.nextGuidable = nextGuidable;

        this.sweepAngle = MathUtils.diffAngle(Geo.getGreatCircleBearing(this.centre, this.getPathStartPoint()), Geo.getGreatCircleBearing(this.centre, this.getPathEndPoint()));
        this.clockwise = this.sweepAngle > 0;

        // We do not consider the path capture end point in this class' getPathEndPoint since that causes a race condition with the path capture
        // finding its intercept point onto this leg
        const startPoint = this.previousGuidable instanceof PathCaptureTransition ? this.previousGuidable.getPathEndPoint() : this.getPathStartPoint();

        this.predictedPath.length = 0;
        this.predictedPath.push({
            type: PathVectorType.Arc,
            startPoint,
            centrePoint: this.centre,
            endPoint: this.getPathEndPoint(),
            sweepAngle: this.sweepAngle,
        });

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.predictedPath.push(
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathStartPoint(),
                    annotation: 'AF ITP',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathEndPoint(),
                    annotation: 'AF FTP',
                },
            );
        }
    }

    public get turnDirectionSign(): 1 | -1 {
        if (this.fix.turnDirection !== TurnDirection.Right && this.fix.turnDirection !== TurnDirection.Left) {
            throw new Error('AFLeg found without specific turnDirection');
        }

        return this.fix.turnDirection === TurnDirection.Left ? -1 : 1;
    }

    get startsInCircularArc(): boolean {
        return true;
    }

    get endsInCircularArc(): boolean {
        return true;
    }

    getNominalRollAngle(gs: MetresPerSecond): Degrees | undefined {
        const gsMs = gs * (463 / 900);
        return (this.clockwise ? 1 : -1) * Math.atan((gsMs ** 2) / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees): GuidanceParameters | undefined {
        return arcGuidance(ppos, trueTrack, this.getPathStartPoint(), this.centre, this.sweepAngle);
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles | undefined {
        return arcDistanceToGo(ppos, this.getPathStartPoint(), this.centre, this.sweepAngle);
    }

    isAbeam(ppos: Coordinates): boolean {
        const bearingPpos = Avionics.Utils.computeGreatCircleHeading(
            this.centre,
            ppos,
        );

        const bearingFrom = Avionics.Utils.computeGreatCircleHeading(
            this.centre,
            this.getPathStartPoint(),
        );

        const trackAngleError = this.clockwise ? Avionics.Utils.diffAngle(bearingFrom, bearingPpos) : Avionics.Utils.diffAngle(bearingPpos, bearingFrom);

        return trackAngleError >= 0;
    }

    get repr(): string {
        return `AF(${this.radius.toFixed(1)}NM) TO ${this.fix.ident}`;
    }
}
