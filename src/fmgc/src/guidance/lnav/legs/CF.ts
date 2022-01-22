// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AltitudeConstraint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { Geo } from '@fmgc/utils/Geo';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { bearingTo } from 'msfs-geo';
import { MathUtils } from '@shared/MathUtils';
import { DmeArcTransition } from '@fmgc/guidance/lnav/transitions/DmeArcTransition';
import { PathVector, PathVectorType } from '../PathVector';

export class CFLeg extends XFLeg {
    private computedPath: PathVector[] = [];

    constructor(
        fix: WayPoint,
        public readonly course: DegreesTrue,
        segment: SegmentType,
    ) {
        super(fix);

        this.segment = segment;
    }

    getPathStartPoint(): Coordinates | undefined {
        if (this.inboundGuidable instanceof Transition && this.inboundGuidable.isComputed) {
            return this.inboundGuidable.getPathEndPoint();
        }

        if (this.outboundGuidable instanceof DmeArcTransition && this.outboundGuidable.isComputed) {
            return this.outboundGuidable.getPathStartPoint();
        }

        // Estimate where we should start the leg
        return this.estimateStartWithoutInboundTransition();
    }

    /**
     * Based on FBW-22-07
     *
     * @private
     */
    private estimateStartWithoutInboundTransition(): Coordinates {
        const inverseCourse = Avionics.Utils.clampAngle(this.course + 180);

        if (this.inboundGuidable && this.inboundGuidable.isComputed) {
            const prevLegTerm = this.inboundGuidable.getPathEndPoint();

            return Geo.doublePlaceBearingIntercept(
                this.getPathEndPoint(),
                prevLegTerm,
                inverseCourse,
                Avionics.Utils.clampAngle(inverseCourse + 90),
            );
        }

        // We start the leg at (tad + 0.1) from the fix if we have a fixed radius transition outbound. This allows showing a better looking path after sequencing.
        let distance = 1;
        if (this.outboundGuidable instanceof FixedRadiusTransition && this.outboundGuidable.isComputed) {
            distance = this.outboundGuidable.tad + 0.1;
        }

        return Avionics.Utils.bearingDistanceToCoordinates(
            inverseCourse,
            distance,
            this.fix.infos.coordinates.lat,
            this.fix.infos.coordinates.long,
        );
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    recomputeWithParameters(isActive: boolean, _tas: Knots, _gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        this.inboundGuidable = previousGuidable;
        this.outboundGuidable = nextGuidable;

        const startPoint = this.getPathStartPoint();
        const bearingFixStartPoint = bearingTo(this.fix.infos.coordinates, startPoint);

        // Is start point after the fix ?
        if (Math.abs(MathUtils.diffAngle(bearingFixStartPoint, this.outboundCourse)) < 3) {
            this.computedPath = [{
                type: PathVectorType.Line,
                startPoint: this.getPathEndPoint(),
                endPoint: this.getPathEndPoint(),
            }];
        } else {
            this.computedPath = [{
                type: PathVectorType.Line,
                startPoint: this.getPathStartPoint(),
                endPoint: this.getPathEndPoint(),
            }];
        }

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

    getDistanceToGo(ppos: Coordinates): NauticalMiles {
        return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees): GuidanceParameters | undefined {
        return courseToFixGuidance(ppos, trueTrack, this.course, this.getPathEndPoint());
    }

    getNominalRollAngle(_gs: Knots): Degrees {
        return 0;
    }

    isAbeam(ppos: Coordinates): boolean {
        const dtg = courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());

        return dtg >= 0 && dtg <= this.distance;
    }

    get speedConstraint(): SpeedConstraint | undefined {
        return undefined;
    }

    get repr(): string {
        return `CF(${this.course.toFixed(1)}°) TO ${this.fix.ident}`;
    }
}
