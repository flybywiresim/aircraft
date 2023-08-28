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
import { Guidable } from '@fmgc/guidance/Guidable';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { Waypoint, WaypointDescriptor } from 'msfs-navdata';

export class IFLeg extends XFLeg {
    constructor(
        fix: Waypoint,
        public readonly metadata: Readonly<LegMetadata>,
        segment: SegmentType,
    ) {
        super(fix);

        this.segment = segment;

        // Do not display on map if this is an airport or runway leg
        const { waypointDescriptor } = this.metadata.flightPlanLegDefinition;

        this.displayedOnMap = waypointDescriptor !== WaypointDescriptor.Airport && waypointDescriptor !== WaypointDescriptor.Runway;
    }

    get predictedPath(): PathVector[] | undefined {
        return [];
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.fix.location;
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.fix.location;
    }

    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
        this.isComputed = true;
    }

    /** @inheritdoc */
    setNeighboringGuidables(inbound: Guidable, outbound: Guidable) {
        if (outbound && !(outbound instanceof Leg) && outbound !== this.outboundGuidable) {
            console.error(`IF outboundGuidable must be a leg (is ${outbound?.constructor})`);
        }
        super.setNeighboringGuidables(inbound, outbound);
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
