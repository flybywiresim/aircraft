// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Geometry } from '@fmgc/guidance/Geometry';
import { arcDistanceToGo, arcGuidance, courseToFixDistanceToGo, courseToFixGuidance, maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { LegMetadata } from '@fmgc/guidance/lnav/legs';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { DebugPointColour, PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { SegmentType } from '@fmgc/wtsdk';
import { bearingTo, distanceTo, smallCircleGreatCircleIntersection } from 'msfs-geo';

interface Segment {
    itp?: Coordinates,
    arcCentre?: Coordinates,
    ftp?: Coordinates,
    course?: DegreesTrue,
    sweepAngle?: Degrees,
    length?: NauticalMiles,
}

enum PiState {
    Straight,
    Turn1,
    Outbound,
    Turn2,
    Intercept,
}

export class PILeg extends Leg {
    private radius: NauticalMiles = 1;

    private straight: Segment = {};

    private turn1: Segment = {};

    private outbound: Segment = {};

    private turn2: Segment = {};

    private intercept: Segment = {};

    private state: PiState = PiState.Straight;

    private debugPoints: PathVector[] = [];

    constructor(
        public fix: WayPoint,
        private nextLeg: CFLeg,
        public metadata: LegMetadata,
        public segment: SegmentType,
    ) {
        super();

        this.recomputeWithParameters(false, 220, 220, { lat: 0, long: 0 }, 0);
    }

    recomputeWithParameters(isActive: boolean, tas: number, gs: number, _ppos: Coordinates, _trueTrack: number): void {
        if (isActive) {
            return;
        }

        if (this.nextLeg && !(this.nextLeg instanceof CFLeg)) {
            throw new Error('PI must be followed by CF!');
        } else if (!this.nextLeg) {
            return;
        }

        this.debugPoints.length = 0;

        const turn1Sign = this.fix.turnDirection === TurnDirection.Left ? 1 : -1;
        const turn2Sign = -1 * turn1Sign;

        const gsMs = gs / 1.94384;
        this.radius = (gsMs ** 2 / (9.81 * Math.tan(maxBank(tas, true) * Math.PI / 180)) / 1852);

        const minStraightDist = this.radius * 2;

        const brgToCf = Avionics.Utils.computeGreatCircleHeading(
            this.fix.infos.coordinates,
            this.nextLeg.fix.infos.coordinates,
        );

        const distToCf = Avionics.Utils.computeGreatCircleDistance(
            this.fix.infos.coordinates,
            this.nextLeg.fix.infos.coordinates,
        );

        const cfInverseCrs = (this.nextLeg.course + 180) % 360;
        this.outbound.course = this.fix.additionalData.course;

        this.straight.itp = this.fix.infos.coordinates;
        this.straight.course = cfInverseCrs;

        let tp: Coordinates;
        if (Math.abs(Avionics.Utils.diffAngle(cfInverseCrs, brgToCf)) < 90 && distToCf > minStraightDist) {
            tp = this.nextLeg.fix.infos.coordinates;
        } else {
            // find an intercept on the CF at min dist
            [tp] = smallCircleGreatCircleIntersection(
                this.fix.infos.coordinates,
                minStraightDist,
                this.nextLeg.fix.infos.coordinates,
                cfInverseCrs,
            ).filter((p) => Math.abs(Avionics.Utils.diffAngle(cfInverseCrs, bearingTo(this.nextLeg.fix.infos.coordinates, p))) < 90);

            this.straight.course = Avionics.Utils.computeGreatCircleHeading(
                this.fix.infos.coordinates,
                tp,
            );
        }

        this.turn1.sweepAngle = turn1Sign * Math.abs(Avionics.Utils.diffAngle(this.straight.course, this.outbound.course));
        const tpT1FtpDist = this.radius * Math.tan(Math.abs(this.turn1.sweepAngle) * Math.PI / 360);
        this.turn1.ftp = Avionics.Utils.bearingDistanceToCoordinates(
            this.outbound.course,
            tpT1FtpDist,
            tp.lat,
            tp.long,
        );
        this.turn1.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            (360 + this.outbound.course + turn1Sign * 90) % 360,
            this.radius,
            this.turn1.ftp.lat,
            this.turn1.ftp.long,
        );
        this.turn1.itp = Avionics.Utils.bearingDistanceToCoordinates(
            (this.straight.course + 180) % 360,
            this.radius * (1 - Math.cos(this.turn1.sweepAngle * Math.PI / 180)),
            tp.lat,
            tp.long,
        );
        this.turn1.length = Math.abs(this.turn1.sweepAngle / 180 * this.radius);

        this.straight.ftp = this.turn1.itp;
        this.straight.length = Avionics.Utils.computeGreatCircleDistance(
            this.fix.infos.coordinates,
            this.turn1.itp,
        );

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: tp,
                annotation: 'TP',
                colour: DebugPointColour.Yellow,
            });

            this.debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn1.itp,
                annotation: 'ITP1',
                colour: DebugPointColour.Magenta,
            });

            this.debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn1.arcCentre,
                annotation: 'AC1',
                colour: DebugPointColour.Magenta,
            });

            this.debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn1.ftp,
                annotation: 'FTP1',
                colour: DebugPointColour.Magenta,
            });
        }

        const theta = Math.abs(Avionics.Utils.diffAngle(this.outbound.course, (this.nextLeg.course + 180) % 360)) * Math.PI / 180;
        this.outbound.length = this.radius * (1 / Math.tan(theta / 2));
        this.outbound.itp = this.turn1.ftp;

        this.turn2.itp = Avionics.Utils.bearingDistanceToCoordinates(
            this.outbound.course,
            this.outbound.length + tpT1FtpDist,
            tp.lat,
            tp.long,
        );
        this.turn2.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            (360 + this.outbound.course + turn2Sign * 90) % 360,
            this.radius,
            this.turn2.itp.lat,
            this.turn2.itp.long,
        );
        this.turn2.sweepAngle = turn2Sign * 180;
        this.turn2.ftp = Avionics.Utils.bearingDistanceToCoordinates(
            (360 + this.outbound.course + turn2Sign * 90) % 360,
            this.radius,
            this.turn2.arcCentre.lat,
            this.turn2.arcCentre.long,
        );
        this.turn2.length = Math.abs(this.turn2.sweepAngle / 180 * this.radius);

        this.outbound.ftp = this.turn2.itp;

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn2.itp,
                annotation: 'ITP2',
                colour: DebugPointColour.Cyan,
            });

            this.debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn2.arcCentre,
                annotation: 'AC2',
                colour: DebugPointColour.Cyan,
            });

            this.debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn2.ftp,
                annotation: 'FTP2',
                colour: DebugPointColour.Cyan,
            });
        }

        this.intercept.itp = this.turn2.ftp;
        this.intercept.ftp = A32NX_Util.greatCircleIntersection(
            this.turn2.ftp,
            (this.outbound.course + 180) % 360,
            tp,
            cfInverseCrs,
        );
        this.intercept.length = Avionics.Utils.computeGreatCircleDistance(
            this.intercept.itp,
            this.intercept.ftp,
        );
        this.intercept.course = Avionics.Utils.computeGreatCircleHeading(
            this.intercept.itp,
            this.intercept.ftp,
        );

        this.isComputed = true;
    }

    get initialLegTermPoint(): Coordinates {
        return this.turn1.itp;
    }

    get distanceToTermination(): NauticalMiles {
        return this.straight.length;
    }

    get distance(): NauticalMiles {
        return this.intercept.length + this.turn2.length + this.outbound.length + this.turn1.length + this.straight.length;
    }

    /**
     * Do we end up further away from the fix than the coded limit
     */
    get turnAreaExceeded(): boolean {
        if (!this.turn2) {
            return false;
        }

        const maxExcursion = distanceTo(
            this.fix.infos.coordinates,
            this.turn2.arcCentre,
        ) + this.radius;

        return maxExcursion > this.fix.additionalData.distance;
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles {
        switch (this.state) {
        case PiState.Intercept:
            return courseToFixDistanceToGo(ppos, this.intercept.course, this.intercept.ftp);
        case PiState.Turn2:
            return this.intercept.length + arcDistanceToGo(ppos, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle);
        case PiState.Outbound:
            return this.intercept.length + this.turn2.length + courseToFixDistanceToGo(ppos, this.outbound.course, this.outbound.ftp);
        case PiState.Turn1:
            return this.intercept.length + this.turn2.length + this.outbound.length + arcDistanceToGo(ppos, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
        case PiState.Straight:
            return this.intercept.length + this.turn2.length + this.outbound.length + this.turn1.length + courseToFixDistanceToGo(ppos, this.straight.course, this.straight.ftp);
        default:
            return 1;
        }
    }

    private dtgCurrentSegment(ppos: Coordinates): NauticalMiles {
        switch (this.state) {
        case PiState.Intercept:
            return courseToFixDistanceToGo(ppos, this.intercept.course, this.intercept.ftp);
        case PiState.Turn2:
            return arcDistanceToGo(ppos, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle);
        case PiState.Outbound:
            return courseToFixDistanceToGo(ppos, this.outbound.course, this.outbound.ftp);
        case PiState.Turn1:
            return arcDistanceToGo(ppos, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
        case PiState.Straight:
            return courseToFixDistanceToGo(ppos, this.straight.course, this.straight.ftp);
        default:
            return 0;
        }
    }

    private radCurrentSegment(tas: Knots, gs: Knots): [NauticalMiles, Degrees] {
        const turn1Sign = this.fix.turnDirection === TurnDirection.Left ? 1 : -1;
        const turn2Sign = -1 * turn1Sign;

        let currentBank;
        let nextBank;
        switch (this.state) {
        case PiState.Turn1:
            currentBank = turn1Sign * maxBank(tas, true);
            nextBank = 0;
            break;
        case PiState.Turn2:
            currentBank = turn2Sign * maxBank(tas, true);
            nextBank = 0;
            break;
        case PiState.Straight:
            currentBank = 0;
            nextBank = turn1Sign * maxBank(tas, true);
            break;
        case PiState.Outbound:
            currentBank = 0;
            nextBank = turn2Sign * maxBank(tas, true);
            break;
        default:
            return [0, 0];
        }

        return [Geometry.getRollAnticipationDistance(gs, currentBank, nextBank), nextBank];
    }

    getGuidanceParameters(ppos: Coordinates, trueTrack: number, tas: number, gs: number): GuidanceParameters {
        let dtg = this.dtgCurrentSegment(ppos);
        if (dtg <= 0 && this.state < PiState.Intercept) {
            this.state++;
            dtg = this.dtgCurrentSegment(ppos);
        }

        let params;
        switch (this.state) {
        case PiState.Intercept:
            return this.nextLeg?.getGuidanceParameters(ppos, trueTrack, tas);
        case PiState.Turn2:
            return arcGuidance(ppos, trueTrack, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle);
        case PiState.Outbound:
            params = courseToFixGuidance(ppos, trueTrack, this.outbound.course, this.outbound.ftp);
            break;
        case PiState.Turn1:
            params = arcGuidance(ppos, trueTrack, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
            break;
        case PiState.Straight:
            params = courseToFixGuidance(ppos, trueTrack, this.straight.course, this.straight.ftp);
            break;
        default:
        }

        const [rad, nextBank] = this.radCurrentSegment(tas, gs);

        if (params && rad > 0 && dtg <= rad) {
            params.phiCommand = nextBank;
        }

        return params;
    }

    getNominalRollAngle(_gs: number): number {
        return 0;
    }

    getPathStartPoint(): Coordinates {
        return this.inboundGuidable?.isComputed ? this.inboundGuidable.getPathEndPoint() : this.fix.infos.coordinates;
    }

    getPathEndPoint(): Coordinates {
        return this.intercept.ftp;
    }

    get terminationWaypoint(): WayPoint | Coordinates {
        return this.intercept.ftp;
    }

    get inboundCourse(): number {
        return this.straight.course ?? 0;
    }

    get outboundCourse(): number {
        return this.nextLeg?.course ?? 0;
    }

    isAbeam(_ppos: Coordinates): boolean {
        return true; // TODO y needed
    }

    get predictedPath(): PathVector[] {
        return [
            {
                type: PathVectorType.Line,
                startPoint: this.inboundGuidable?.isComputed ? this.inboundGuidable.getPathEndPoint() : this.fix.infos.coordinates,
                endPoint: this.turn1.itp,
            },
            {
                type: PathVectorType.Arc,
                startPoint: this.turn1.itp,
                centrePoint: this.turn1.arcCentre,
                endPoint: this.turn1.ftp,
                sweepAngle: this.turn1.sweepAngle,
            },
            {
                type: PathVectorType.Line,
                startPoint: this.turn1.ftp,
                endPoint: this.turn2.itp,
            },
            {
                type: PathVectorType.Arc,
                startPoint: this.turn2.itp,
                centrePoint: this.turn2.arcCentre,
                endPoint: this.turn2.ftp,
                sweepAngle: this.turn2.sweepAngle,
            },
            {
                type: PathVectorType.Line,
                startPoint: this.turn2.ftp,
                endPoint: this.intercept.ftp,
            },
            ...this.debugPoints,
        ];
    }

    get ident(): string {
        return 'INTCPT';
    }

    get repr(): string {
        return `PI ${this.ident}`;
    }
}
