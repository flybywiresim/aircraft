// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { bearingTo } from 'msfs-geo';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { PathVector, PathVectorType } from '../PathVector';

export class DFLeg extends XFLeg {
    private computedPath: PathVector[] = [];

    constructor(
        fix: WayPoint,
        public readonly metadata: Readonly<LegMetadata>,
        segment: SegmentType,
    ) {
        super(fix);

        this.segment = segment;
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.inboundGuidable?.getPathEndPoint() ?? this.estimateStartPoint();
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

    recomputeWithParameters(
        _isActive: boolean,
        _tas: Knots,
        _gs: Knots,
        _ppos: Coordinates,
        _trueTrack: DegreesTrue,
    ) {
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
                    annotation: 'DF START',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: this.getPathEndPoint(),
                    annotation: 'DF END',
                },
            );
        }

        this.isComputed = true;
    }

    get inboundCourse(): Degrees {
        return bearingTo(this.start, this.fix.infos.coordinates);
    }

    get outboundCourse(): Degrees {
        return bearingTo(this.start, this.fix.infos.coordinates);
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles {
        return courseToFixDistanceToGo(ppos, this.outboundCourse, this.getPathEndPoint());
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, _tas: Knots): GuidanceParameters | undefined {
        return courseToFixGuidance(ppos, trueTrack, this.outboundCourse, this.fix.infos.coordinates);
    }

    getNominalRollAngle(_gs: Knots): Degrees {
        return undefined;
    }

    isAbeam(_ppos: Coordinates): boolean {
        return false;
    }

    get repr(): string {
        return `DF TO '${this.fix.ident}'`;
    }
}
