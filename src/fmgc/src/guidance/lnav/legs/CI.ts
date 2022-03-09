// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { ControlLaw, GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { courseToFixDistanceToGo, sideOfPointOnCourseToFix } from '@fmgc/guidance/lnav/CommonGeometry';
import { Geo } from '@fmgc/utils/Geo';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { DmeArcTransition } from '@fmgc/guidance/lnav/transitions/DmeArcTransition';
import { distanceTo } from 'msfs-geo';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { PathVector, PathVectorType } from '../PathVector';

export class CILeg extends Leg {
    private computedPath: PathVector[] = [];

    constructor(
        public readonly course: DegreesTrue,
        public readonly nextLeg: Leg,
        public readonly metadata: Readonly<LegMetadata>,
        segment: SegmentType,
    ) {
        super();

        this.segment = segment;
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

        if (this.outboundGuidable instanceof DmeArcTransition && this.outboundGuidable.isComputed) {
            return this.outboundGuidable.getPathStartPoint();
        }

        return this.intercept;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    mustBeDeleted = false;

    recomputeWithParameters(
        _isActive: boolean,
        _tas: Knots,
        _gs: Knots,
        _ppos: Coordinates,
        _trueTrack: DegreesTrue,
    ) {
        this.intercept = Geo.legIntercept(
            this.getPathStartPoint(),
            this.course,
            this.nextLeg,
        );

        const side = sideOfPointOnCourseToFix(this.intercept, this.outboundCourse, this.getPathStartPoint());
        const overshot = side === 1;

        if (!this.intercept || overshot) {
            this.isNull = true;
            this.isComputed = true;
            return;
        }

        this.isNull = false;

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

    get inboundCourse(): Degrees {
        return this.course;
    }

    get outboundCourse(): Degrees {
        return this.course;
    }

    get distanceToTermination(): NauticalMiles {
        const startPoint = this.getPathStartPoint();

        return distanceTo(startPoint, this.intercept);
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

    isAbeam(ppos: Coordinates): boolean {
        const dtg = courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());

        return dtg >= 0 && dtg <= this.distance;
    }

    get repr(): string {
        return `CI(${Math.trunc(this.course)}°)`;
    }
}
