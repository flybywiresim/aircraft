// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';

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

    private nextGuidable: Leg | undefined;

    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, _previousGuidable: Guidable, nextGuidable: Guidable) {
        if (nextGuidable instanceof Transition) {
            throw new Error(`IF nextGuidable must be a leg (is ${nextGuidable.constructor})`);
        }

        this.nextGuidable = nextGuidable as Leg;

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
        return this.nextGuidable?.getGuidanceParameters(ppos, trueTrack, tas, gs) ?? undefined;
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
