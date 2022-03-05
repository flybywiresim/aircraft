// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { distanceTo } from 'msfs-geo';
import { sideOfPointOnCourseToFix } from '@fmgc/guidance/lnav/CommonGeometry';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { DmeArcTransition } from '@fmgc/guidance/lnav/transitions/DmeArcTransition';

export abstract class XFLeg extends Leg {
    protected constructor(
        public fix: WayPoint,
    ) {
        super();
    }

    getPathEndPoint(): Coordinates | undefined {
        if (this.outboundGuidable instanceof FixedRadiusTransition && this.outboundGuidable.isComputed) {
            return this.outboundGuidable.getPathStartPoint();
        }

        if (this.outboundGuidable instanceof DmeArcTransition && this.outboundGuidable.isComputed) {
            return this.outboundGuidable.getPathStartPoint();
        }

        return this.fix.infos.coordinates;
    }

    get terminationWaypoint(): WayPoint {
        return this.fix;
    }

    get ident(): string {
        return this.fix.ident;
    }

    get overflyTermFix(): boolean {
        return this.metadata.isOverfly;
    }

    /**
     * Returns `true` if the inbound transition has overshot the leg
     */
    get overshot(): boolean {
        const side = sideOfPointOnCourseToFix(this.fix.infos.coordinates, this.outboundCourse, this.getPathStartPoint());

        return side === 1;
    }

    get distanceToTermination(): NauticalMiles {
        const startPoint = this.getPathStartPoint();

        if (this.overshot) {
            return 0;
        }

        return distanceTo(startPoint, this.fix.infos.coordinates);
    }
}
