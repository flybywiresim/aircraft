// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';

export class IFLeg extends XFLeg {
    constructor(
        fix: WayPoint,
        public readonly metadata: Readonly<LegMetadata>,
        segment: SegmentType,
    ) {
        super(fix);

        this.segment = segment;
    }

    get predictedPath(): PathVector[] | undefined {
        return [];
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.fix.infos.coordinates;
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.fix.infos.coordinates;
    }

    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
        if (!(this.outboundGuidable instanceof Leg)) {
            throw new Error(`IF outboundGuidable must be a leg (is ${this.outboundGuidable?.constructor})`);
        }

        this.isComputed = true;
    }

    get inboundCourse(): Degrees | undefined {
        return undefined;
    }

    get outboundCourse(): Degrees | undefined {
        return undefined;
    }

    get distance(): NauticalMiles {
        return 0;
    }

    getDistanceToGo(_ppos: Coordinates): NauticalMiles | undefined {
        return undefined;
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, tas: Knots, gs: Knots): GuidanceParameters | undefined {
        return this.outboundGuidable?.getGuidanceParameters(ppos, trueTrack, tas, gs) ?? undefined;
    }

    getNominalRollAngle(_gs): Degrees | undefined {
        return undefined;
    }

    getPseudoWaypointLocation(_distanceBeforeTerminator: NauticalMiles): Coordinates | undefined {
        return undefined;
    }

    isAbeam(_ppos: Coordinates): boolean {
        return false;
    }

    get repr(): string {
        return `IF AT ${this.fix.ident}`;
    }
}
