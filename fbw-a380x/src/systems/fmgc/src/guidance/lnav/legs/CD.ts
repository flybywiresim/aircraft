// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { NdbNavaid, VhfNavaid, Waypoint } from 'msfs-navdata';
import { closestSmallCircleIntersection, Coordinates, distanceTo } from 'msfs-geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { procedureLegIdentAndAnnotation } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { LegMetadata } from './index';
import { courseToFixDistanceToGo, fixToFixGuidance } from '../CommonGeometry';

export class CDLeg extends Leg {
    predictedPath: PathVector[] = [];

    inboundCourse;

    outboundCourse;

    pbdPoint: Coordinates;

    constructor(
        private readonly course: DegreesTrue,
        private readonly dmeDistance: NauticalMiles,
        private readonly origin: Waypoint | VhfNavaid | NdbNavaid,
        public readonly metadata: Readonly<LegMetadata>,
        segment: SegmentType,
    ) {
        super();

        this.segment = segment;

        this.inboundCourse = course;
        this.outboundCourse = course;
    }

    get terminationWaypoint(): Waypoint | Coordinates | undefined {
        return this.pbdPoint;
    }

    get ident(): string {
        return procedureLegIdentAndAnnotation(this.metadata.flightPlanLegDefinition, '')[0];
    }

    getPathStartPoint(): Coordinates | undefined {
        if (this.inboundGuidable?.isComputed) {
            return this.inboundGuidable.getPathEndPoint();
        }

        return this.origin.location;
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.pbdPoint;
    }

    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
        this.predictedPath.length = 0;

        const intersect = closestSmallCircleIntersection(
            this.origin.location,
            this.dmeDistance,
            this.getPathStartPoint(),
            this.course,
        );

        this.pbdPoint = intersect;

        this.predictedPath.push({
            type: PathVectorType.Line,
            startPoint: this.getPathStartPoint(),
            endPoint: this.getPathEndPoint(),
        });

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.predictedPath.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.getPathStartPoint(),
                annotation: 'CD START',
            }, {
                type: PathVectorType.DebugPoint,
                startPoint: this.getPathEndPoint(),
                annotation: 'CD END',
            });
        }

        this.isComputed = true;
    }

    get distanceToTermination(): NauticalMiles {
        const startPoint = this.getPathStartPoint();

        return distanceTo(startPoint, this.pbdPoint);
    }

    isAbeam(ppos: Coordinates): boolean {
        const dtg = this.getDistanceToGo(ppos);

        return dtg >= 0 && dtg <= this.distance;
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles | undefined {
        return courseToFixDistanceToGo(ppos, this.course, this.pbdPoint);
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, _tas: Knots, _gs: Knots): GuidanceParameters | undefined {
        return fixToFixGuidance(ppos, trueTrack, this.getPathStartPoint(), this.pbdPoint);
    }

    getNominalRollAngle(_gs: MetresPerSecond): Degrees | undefined {
        return 0;
    }

    get repr(): string {
        return `CD(${this.dmeDistance.toFixed(1)}NM, ${this.course.toFixed(1)})`;
    }
}
