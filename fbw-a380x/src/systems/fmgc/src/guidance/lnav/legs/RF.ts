// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { SegmentType } from '@fmgc/wtsdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { arcDistanceToGo, arcGuidance, arcLength } from '@fmgc/guidance/lnav/CommonGeometry';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { Waypoint } from 'msfs-navdata';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { bearingTo, distanceTo } from 'msfs-geo';
import { MathUtils } from '@shared/MathUtils';
import { PathVector, PathVectorType } from '../PathVector';

export class RFLeg extends XFLeg {
    // location of the centre fix of the arc
    center: LatLongData;

    radius: NauticalMiles;

    angle: Degrees;

    clockwise: boolean;

    private mDistance: NauticalMiles;

    private computedPath: PathVector[] = [];

    constructor(
        private from: Waypoint,
        public to: Waypoint,
        center: LatLongData,
        public metadata: LegMetadata,
        segment: SegmentType,
    ) {
        super(to);

        this.from = from;
        this.to = to;
        this.center = center;
        this.radius = distanceTo(this.center, this.to.location);
        this.segment = segment;

        const fromBearing = bearingTo(this.center, this.from.location); // -90?
        const toBearing = bearingTo(this.center, this.to.location); // -90?

        switch (this.metadata.turnDirection) {
        case TurnDirection.Left:
            this.clockwise = false;
            this.angle = MathUtils.clampAngle(fromBearing - toBearing);
            break;
        case TurnDirection.Right:
            this.clockwise = true;
            this.angle = MathUtils.clampAngle(toBearing - fromBearing);
            break;
        default:
            const angle = MathUtils.diffAngle(toBearing, fromBearing);
            this.clockwise = angle > 0;
            this.angle = Math.abs(angle);
            break;
        }

        this.mDistance = 2 * Math.PI * this.radius / 360 * this.angle;

        this.computedPath = [
            {
                type: PathVectorType.Arc,
                startPoint: this.from.location,
                centrePoint: this.center,
                endPoint: this.to.location,
                sweepAngle: this.clockwise ? this.angle : -this.angle,
            },
        ];

        this.isComputed = true;
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.from.location;
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.to.location;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    get startsInCircularArc(): boolean {
        return true;
    }

    get endsInCircularArc(): boolean {
        return true;
    }

    get inboundCourse(): Degrees {
        return MathUtils.clampAngle(bearingTo(this.center, this.from.location) + (this.clockwise ? 90 : -90));
    }

    get outboundCourse(): Degrees {
        return MathUtils.clampAngle(bearingTo(this.center, this.to.location) + (this.clockwise ? 90 : -90));
    }

    get distance(): NauticalMiles {
        return this.mDistance;
    }

    get distanceToTermination(): NauticalMiles {
        return arcLength(this.radius, this.angle);
    }

    // basically straight from type 1 transition... willl need refinement
    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number, _tas: Knots): GuidanceParameters | null {
        // FIXME should be defined in terms of to fix
        return arcGuidance(ppos, trueTrack, this.from.location, this.center, this.clockwise ? this.angle : -this.angle);
    }

    getNominalRollAngle(gs: Knots): Degrees {
        const gsMs = gs * (463 / 900);
        return (this.clockwise ? 1 : -1) * Math.atan((gsMs ** 2) / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
    }

    /**
     * Calculates directed DTG parameter
     *
     * @param ppos {LatLong} the current position of the aircraft
     */
    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        // FIXME geometry should be defined in terms of to...
        return arcDistanceToGo(ppos, this.from.location, this.center, this.clockwise ? this.angle : -this.angle);
    }

    isAbeam(ppos: LatLongData): boolean {
        const bearingPpos = bearingTo(
            this.center,
            ppos,
        );

        const bearingFrom = bearingTo(
            this.center,
            this.from.location,
        );

        const trackAngleError = this.clockwise ? MathUtils.diffAngle(bearingFrom, bearingPpos) : MathUtils.diffAngle(bearingPpos, bearingFrom);

        return trackAngleError >= 0;
    }

    toString(): string {
        return `<RFLeg radius=${this.radius} to=${this.to}>`;
    }

    get repr(): string {
        return `RF(${this.radius.toFixed(1)}NM. ${this.angle.toFixed(1)}°) TO ${this.to.ident}`;
    }
}
