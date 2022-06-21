// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Transition } from '@fmgc/guidance/lnav/Transition';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { HALeg, HFLeg, HMLeg, HxLegGuidanceState } from '@fmgc/guidance/lnav/legs/HX';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { GuidanceParameters, LateralPathGuidance } from '@fmgc/guidance/ControlLaws';
import { ControlLaw } from '@shared/autopilot';
import { Geometry } from '@fmgc/guidance/Geometry';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { AFLeg } from '@fmgc/guidance/lnav/legs/AF';
import { DebugPointColour, PathVector, PathVectorType } from '../PathVector';
import { arcDistanceToGo, arcGuidance, courseToFixDistanceToGo, courseToFixGuidance, maxBank } from '../CommonGeometry';

enum EntryType {
    Null,
    Teardrop,
    Parallel,
    DirectOutbound,
    DirectTurn,
}

export interface EntryTurn {
    itp?: LatLongAlt,
    arcCentre?: LatLongAlt,
    ftp?: LatLongAlt,
    sweepAngle?: Degrees,
}

export enum EntryState {
    Turn1,
    Straight1,
    Turn2,
    Capture,
    Done,
}

export class HoldEntryTransition extends Transition {
    private entry = EntryType.Null;

    private computedPath: PathVector[] = [];

    private turn1: EntryTurn = {};

    private turn2: EntryTurn = {};

    private turn3: EntryTurn = {};

    private straightCourse: Degrees;

    public state: EntryState = EntryState.Turn1;

    // hax
    private wasAbeam = false;

    private guidanceActive = false;

    private frozen = false;

    constructor(
        public previousLeg: AFLeg | CFLeg | DFLeg | RFLeg | TFLeg,
        public nextLeg: HALeg | HFLeg | HMLeg,
        _predictWithCurrentSpeed: boolean = true, // TODO we don't need this?
    ) {
        super(previousLeg, nextLeg);
    }

    get distance(): NauticalMiles {
        return 0; // 0 so no PWPs
    }

    getDistanceToGo(_ppos: LatLongData): NauticalMiles {
        if (this.entry === EntryType.Null || this.state === EntryState.Done) {
            return 0;
        }

        // TODO
        return 1;
    }

    private setHxEntry(): void {
        switch (this.entry) {
        case EntryType.DirectTurn:
        case EntryType.Parallel:
        case EntryType.Teardrop:
        case EntryType.Null:
            this.nextLeg.setInitialState(HxLegGuidanceState.Arc1);
            break;
        case EntryType.DirectOutbound:
            this.nextLeg.setInitialState(HxLegGuidanceState.Outbound);
            break;
        default:
        }
    }

    getParallelTeardropGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees, tas: Knots, gs: Knots): GuidanceParameters {
        let dtg: NauticalMiles;

        // update state
        switch (this.state) {
        case EntryState.Turn1:
            dtg = arcDistanceToGo(ppos, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
            if (dtg <= 0) {
                this.state = EntryState.Straight1;
            }
            break;
        case EntryState.Straight1:
            dtg = courseToFixDistanceToGo(ppos, this.straightCourse, this.turn2.itp);
            if (dtg <= 0) {
                this.state = EntryState.Turn2;
            }
            break;
        case EntryState.Turn2:
            dtg = arcDistanceToGo(ppos, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle);
            const refFrameOffset = Avionics.Utils.diffAngle(0, this.outboundCourse);
            const trackAngleError = this.turn2.sweepAngle < 0 ? Avionics.Utils.clampAngle(refFrameOffset - trueTrack) : Avionics.Utils.clampAngle(trueTrack - refFrameOffset);
            if (trackAngleError < 130) {
                this.state = EntryState.Capture;
            }
            break;
        case EntryState.Capture:
            dtg = courseToFixDistanceToGo(ppos, this.outboundCourse, this.nextLeg.fix.infos.coordinates);
            if (dtg < 0.1) {
                this.nextLeg.updatePrediction();
                this.state = EntryState.Done;
            }
            break;
        default:
        }

        let bankNext: Degrees = 0;
        let params: GuidanceParameters | undefined;
        // compute guidance
        switch (this.state) {
        case EntryState.Turn1:
            params = arcGuidance(ppos, trueTrack, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
            break;
        case EntryState.Straight1:
            params = courseToFixGuidance(ppos, trueTrack, this.straightCourse, this.turn2.itp);
            bankNext = this.turn2.sweepAngle > 0 ? maxBank(tas, true) : -maxBank(tas, true);
            break;
        case EntryState.Turn2:
            // force the initial part of the turn to ensure correct direction
            const phiCommand = this.turn2.sweepAngle > 0 ? maxBank(tas, true /* FIXME false */) : -maxBank(tas, true /* FIXME false */);
            bankNext = phiCommand;
            params = {
                law: ControlLaw.LATERAL_PATH,
                trackAngleError: 0,
                phiCommand,
                crossTrackError: 0,
            };
            break;
        case EntryState.Capture:
            params = courseToFixGuidance(ppos, trueTrack, this.outboundCourse, this.nextLeg.fix.infos.coordinates);
            // TODO for HF get the following leg bank
            const { sweepAngle } = this.nextLeg.geometry;
            bankNext = sweepAngle > 0 ? maxBank(tas, true) : -maxBank(tas, true);
            break;
        case EntryState.Done:
            params = this.nextLeg.getGuidanceParameters(ppos, trueTrack, tas, gs);
            bankNext = params.phiCommand;
            break;
        default:
        }

        const rad = Geometry.getRollAnticipationDistance(tas, (params as LateralPathGuidance).phiCommand, bankNext);
        if (rad > 0 && dtg <= rad) {
            (params as LateralPathGuidance).phiCommand = bankNext;
        }

        return params;
    }

    getDirectTurnGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees, tas: Knots, _gs: Knots): GuidanceParameters {
        let dtg: NauticalMiles;

        switch (this.state) {
        case EntryState.Turn1:
            dtg = arcDistanceToGo(ppos, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
            if (dtg <= 0) {
                this.state = EntryState.Straight1;
            }
            break;
        case EntryState.Straight1:
            dtg = courseToFixDistanceToGo(ppos, this.straightCourse, this.turn2.itp);
            if (dtg <= 0) {
                this.state = EntryState.Turn2;
            }
            break;
        case EntryState.Turn2:
            dtg = arcDistanceToGo(ppos, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle);
            if (dtg <= 0) {
                this.state = EntryState.Capture;
            }
            break;
        case EntryState.Capture:
            dtg = courseToFixDistanceToGo(ppos, this.outboundCourse, this.nextLeg.fix.infos.coordinates);
            if (dtg < 0.1) {
                this.state = EntryState.Done;
            }
            break;
        default:
        }

        let params: LateralPathGuidance;
        let bankNext: Degrees;
        switch (this.state) {
        case EntryState.Turn1:
            params = arcGuidance(ppos, trueTrack, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
            bankNext = 0;
            break;
        case EntryState.Straight1:
            params = courseToFixGuidance(ppos, trueTrack, this.straightCourse, this.turn2.itp);
            bankNext = this.turn2.sweepAngle > 0 ? maxBank(tas, true) : -maxBank(tas, true);
            break;
        case EntryState.Turn2:
            params = arcGuidance(ppos, trueTrack, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle);
            bankNext = 0;
            break;
        case EntryState.Capture:
            params = courseToFixGuidance(ppos, trueTrack, this.outboundCourse, this.nextLeg.fix.infos.coordinates);
            bankNext = 0;
            break;
        default:
        }

        const rad = Geometry.getRollAnticipationDistance(tas, (params as LateralPathGuidance).phiCommand, bankNext);
        if (rad > 0 && dtg <= rad) {
            (params as LateralPathGuidance).phiCommand = bankNext;
        }
        return params;
    }

    /**
     *
     * @todo guide inbound leg for parallel + teardrop?
     */
    getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees, tas: Knots, gs: Knots): GuidanceParameters | undefined {
        if (!this.guidanceActive) {
            this.nextLeg.updatePrediction();
            this.guidanceActive = true;
        }

        switch (this.entry) {
        case EntryType.Parallel:
        case EntryType.Teardrop:
            return this.getParallelTeardropGuidanceParameters(ppos, trueTrack, tas, gs);
        case EntryType.DirectOutbound:
            return this.nextLeg.getGuidanceParameters(ppos, trueTrack, tas, gs);
        case EntryType.DirectTurn:
            return this.getDirectTurnGuidanceParameters(ppos, trueTrack, tas, gs);
        default:
        }

        return undefined;
    }

    public getNominalRollAngle(gs: Knots): Degrees {
        if (this.entry === EntryType.Null) {
            return this.nextLeg.getNominalRollAngle(gs);
        }

        if (Math.abs(this.turn1.sweepAngle) <= 3) {
            return 0;
        }

        return this.turn1.sweepAngle > 0 ? maxBank(gs /* FIXME tas */, true) : -maxBank(gs /* FIXME tas */, true);
    }

    getTurningPoints(): [LatLongAlt, LatLongAlt] {
        switch (this.entry) {
        case EntryType.Parallel:
        case EntryType.Teardrop:
            return [this.nextLeg.fix.infos.coordinates, this.turn3.ftp];
        case EntryType.DirectTurn:
        case EntryType.DirectOutbound:
            return [this.nextLeg.fix.infos.coordinates, this.turn1.ftp];
        case EntryType.Null:
        default:
            return [this.nextLeg.fix.infos.coordinates, this.nextLeg.fix.infos.coordinates];
        }
    }

    isAbeam(ppos: Coordinates) {
        // major hack
        if (!this.wasAbeam && this.previousLeg.getDistanceToGo(ppos) <= 0) {
            this.wasAbeam = true;
            return true;
        }
        return this.wasAbeam && this.state !== EntryState.Done;
    }

    get startsInCircularArc(): boolean {
        return true;
    }

    get endsInCircularArc(): boolean {
        return true;
    }

    get inboundCourse(): Degrees {
        return this.previousLeg.outboundCourse;
    }

    get outboundCourse(): Degrees {
        return this.nextLeg.inboundCourse;
    }

    get predictedPath(): PathVector[] {
        if (this.entry === EntryType.Null) {
            return [];
        }

        if (this.entry === EntryType.DirectOutbound) {
            if (this.nextLeg instanceof HFLeg) {
                return this.nextLeg.getHippodromePath();
            }
            return [];
        }

        return this.computedPath;
    }

    private getPathDebugPoints(): PathVector[] {
        if (this.entry === EntryType.Null) {
            return [];
        }

        const debugPoints: PathVector[] = [
            {
                type: PathVectorType.DebugPoint,
                startPoint: this.turn1.arcCentre,
                annotation: 'AC1',
            },
            {
                type: PathVectorType.DebugPoint,
                startPoint: this.turn1.ftp,
                annotation: 'FTP1',
            },
        ];

        if (this.entry === EntryType.Parallel || this.entry === EntryType.Teardrop) {
            debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn2.itp,
                annotation: 'ITP2',
                colour: DebugPointColour.Magenta,
            });

            debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn2.arcCentre,
                annotation: 'AC2',
                colour: DebugPointColour.Magenta,
            });

            debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn2.ftp,
                annotation: 'FTP2',
                colour: DebugPointColour.Magenta,
            });

            debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn3.itp,
                annotation: 'ITP3',
                colour: DebugPointColour.Yellow,
            });

            debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn3.arcCentre,
                annotation: 'AC3',
                colour: DebugPointColour.Yellow,
            });

            debugPoints.push({
                type: PathVectorType.DebugPoint,
                startPoint: this.turn3.ftp,
                annotation: 'FTP3',
                colour: DebugPointColour.Yellow,
            });
        }

        return debugPoints;
    }

    computeNullEntry() {
        this.entry = EntryType.Null;
        this.computedPath.length = 0;
    }

    computeDirectOutboundEntry() {
        this.entry = EntryType.DirectOutbound;
        const { radius: maxRadius } = this.nextLeg.geometry;

        const turnSign = this.nextLeg.turnDirection === TurnDirection.Right ? +1 : -1;

        const trackChange = Avionics.Utils.diffAngle(this.inboundCourse, this.nextLeg.inboundCourse);

        const radius = 2 * maxRadius / (1 + Math.cos(trackChange * Math.PI / 180));

        this.turn1.itp = this.nextLeg.fix.infos.coordinates;
        this.turn1.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            this.inboundCourse + turnSign * 90,
            radius,
            this.turn1.itp.lat, this.turn1.itp.long,
        );
        this.turn1.sweepAngle = turnSign * 180 + trackChange;
        const bearing1 = Avionics.Utils.clampAngle(this.nextLeg.inboundCourse + turnSign * 90);
        this.turn1.ftp = Avionics.Utils.bearingDistanceToCoordinates(bearing1, radius, this.turn1.arcCentre.lat, this.turn1.arcCentre.long);

        this.computedPath.length = 0;
        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: this.turn1.itp,
            endPoint: this.turn1.ftp,
            centrePoint: this.turn1.arcCentre,
            sweepAngle: this.turn1.sweepAngle,
        });
    }

    computeDirectTurnEntry() {
        this.entry = EntryType.DirectTurn;
        const { fixB, fixC, arcCentreFix2, sweepAngle, radius: maxRadius } = this.nextLeg.geometry;

        const turnSign = this.nextLeg.turnDirection === TurnDirection.Right ? +1 : -1;

        const trackChange = Avionics.Utils.diffAngle(this.inboundCourse, this.nextLeg.inboundCourse);

        const radius = 2 * maxRadius / (1 + Math.cos(trackChange * Math.PI / 180));

        this.turn1.itp = this.nextLeg.fix.infos.coordinates;
        this.turn1.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            this.inboundCourse + turnSign * 90,
            radius,
            this.turn1.itp.lat, this.turn1.itp.long,
        );
        this.turn1.sweepAngle = turnSign * 180 + trackChange;
        const bearing1 = Avionics.Utils.clampAngle(this.nextLeg.inboundCourse + turnSign * 90);
        this.turn1.ftp = Avionics.Utils.bearingDistanceToCoordinates(bearing1, radius, this.turn1.arcCentre.lat, this.turn1.arcCentre.long);

        this.computedPath.length = 0;
        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: this.turn1.itp,
            endPoint: this.turn1.ftp,
            centrePoint: this.turn1.arcCentre,
            sweepAngle: this.turn1.sweepAngle,
        });

        this.straightCourse = (this.outboundCourse + 180) % 360;
        this.computedPath.push({
            type: PathVectorType.Line,
            startPoint: this.turn1.ftp,
            endPoint: fixB,
        });

        this.turn2.itp = fixB;
        this.turn2.ftp = fixC;
        this.turn2.sweepAngle = sweepAngle;
        this.turn2.arcCentre = arcCentreFix2;
        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: fixB,
            centrePoint: arcCentreFix2,
            endPoint: fixC,
            sweepAngle,
        });

        this.computedPath.push({
            type: PathVectorType.Line,
            startPoint: fixC,
            endPoint: this.nextLeg.fix.infos.coordinates,
        });
    }

    /**
     * @todo extend outbound path to ensure capture before hold fix
     */
    computeTeardropEntry() {
        this.entry = EntryType.Teardrop;
        const { radius, legLength } = this.nextLeg.geometry;

        const turnSign = this.nextLeg.turnDirection === TurnDirection.Right ? +1 : -1;

        this.straightCourse = Avionics.Utils.clampAngle(this.outboundCourse + 150 * turnSign);
        this.turn1.sweepAngle = Avionics.Utils.diffAngle(this.inboundCourse, this.straightCourse);
        const turn1Clockwise = this.turn1.sweepAngle >= 0;
        this.turn1.itp = this.nextLeg.fix.infos.coordinates;
        this.turn1.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            this.inboundCourse + (turn1Clockwise ? 90 : -90),
            radius,
            this.turn1.itp.lat, this.turn1.itp.long,
        );
        const bearing1 = Avionics.Utils.clampAngle(this.inboundCourse + this.turn1.sweepAngle + (turn1Clockwise ? -90 : 90));
        this.turn1.ftp = Avionics.Utils.bearingDistanceToCoordinates(bearing1, radius, this.turn1.arcCentre.lat, this.turn1.arcCentre.long);

        this.computedPath.length = 0;
        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: this.turn1.itp,
            endPoint: this.turn1.ftp,
            centrePoint: this.turn1.arcCentre,
            sweepAngle: this.turn1.sweepAngle,
        });

        const kekRads = Math.abs(Avionics.Utils.diffAngle(this.inboundCourse, this.outboundCourse + 180)) * Math.PI / 180;
        let minStraightDistance = radius * 2 / Math.sqrt(3) * (0.1 + Math.SQRT2 - 1 / 2 - Math.abs(Math.sin(kekRads) - 1 / 2));
        const nominalStraightDistance = 1.15 * legLength; // - Math.sin(Math.abs(this.turn1.sweepAngle * Math.PI / 180)) * radius;
        let straightDistance = Math.max(minStraightDistance, nominalStraightDistance);
        let radii2Inbound = Math.abs(Math.cos(kekRads) - Math.sqrt(3) / 2) + straightDistance / radius / 2 + (1 - Math.sqrt(3) / 2);

        if ((Math.SQRT2 - radii2Inbound) > 0) {
            const extraCapComponent = (Math.SQRT2 - radii2Inbound);
            minStraightDistance += radius * 2 / Math.sqrt(3) * extraCapComponent;
            straightDistance = Math.max(minStraightDistance, nominalStraightDistance);
            radii2Inbound = Math.abs(Math.cos(kekRads) - Math.sqrt(3) / 2) + straightDistance / radius / 2 + (1 - Math.sqrt(3) / 2);
        }

        this.turn2.itp = Avionics.Utils.bearingDistanceToCoordinates(
            this.straightCourse,
            straightDistance,
            this.turn1.ftp.lat,
            this.turn1.ftp.long,
        );
        this.computedPath.push({
            type: PathVectorType.Line,
            startPoint: this.turn1.ftp,
            endPoint: this.turn2.itp,
        });

        this.turn2.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundCourse - turnSign * 120,
            radius,
            this.turn2.itp.lat,
            this.turn2.itp.long,
        );

        if (radii2Inbound >= 2) {
            // we are intercepting from the inside with room for 45 deg capture
            this.turn2.ftp = Avionics.Utils.bearingDistanceToCoordinates(
                this.straightCourse + turnSign * 75,
                radius,
                this.turn2.arcCentre.lat,
                this.turn2.arcCentre.long,
            );
            this.turn2.sweepAngle = turnSign * 165;

            const straightDist = (radii2Inbound - 2) * Math.SQRT2 * radius;

            this.turn3.itp = Avionics.Utils.bearingDistanceToCoordinates(
                this.straightCourse + turnSign * 165,
                straightDist,
                this.turn2.ftp.lat,
                this.turn2.ftp.long,
            );

            this.turn3.sweepAngle = turnSign * 45;
            this.turn3.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
                this.straightCourse - turnSign * 105,
                radius,
                this.turn3.itp.lat,
                this.turn3.itp.long,
            );
            this.turn3.ftp = Avionics.Utils.bearingDistanceToCoordinates(
                this.outboundCourse - turnSign * 90,
                radius,
                this.turn3.arcCentre.lat,
                this.turn3.arcCentre.long,
            );

            this.computedPath.push({
                type: PathVectorType.Line,
                startPoint: this.turn2.ftp,
                endPoint: this.turn3.itp,
            });
        } else if ((Math.SQRT2 - radii2Inbound) < 0) {
            // we are intercepting from the outside without enough room for 45 deg capture
            const interceptAngle = Math.acos(radii2Inbound / 2) * 180 / Math.PI;

            this.turn2.ftp = Avionics.Utils.bearingDistanceToCoordinates(
                this.straightCourse + turnSign * (120 + interceptAngle),
                radius,
                this.turn2.arcCentre.lat,
                this.turn2.arcCentre.long,
            );
            this.turn2.sweepAngle = turnSign * (210 + interceptAngle);

            this.turn3.itp = this.turn2.ftp;

            this.turn3.sweepAngle = -turnSign * interceptAngle;
            this.turn3.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
                this.straightCourse + turnSign * (120 + interceptAngle),
                radius,
                this.turn3.itp.lat,
                this.turn3.itp.long,
            );
            this.turn3.ftp = Avionics.Utils.bearingDistanceToCoordinates(
                this.outboundCourse + turnSign * 90,
                radius,
                this.turn3.arcCentre.lat,
                this.turn3.arcCentre.long,
            );
        } else {
            // we are intercepting from the outside with room for 45 deg capture
            this.turn2.ftp = Avionics.Utils.bearingDistanceToCoordinates(
                this.outboundCourse - turnSign * 45,
                radius,
                this.turn2.arcCentre.lat,
                this.turn2.arcCentre.long,
            );
            this.turn2.sweepAngle = turnSign * 255;

            const straightDist = Math.sqrt(2 * (Math.SQRT2 - radii2Inbound) ** 2) * radius;

            this.turn3.itp = Avionics.Utils.bearingDistanceToCoordinates(
                this.straightCourse + turnSign * 255,
                straightDist,
                this.turn2.ftp.lat,
                this.turn2.ftp.long,
            );

            this.turn3.sweepAngle = -turnSign * 45;
            this.turn3.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
                this.outboundCourse - turnSign * 45,
                radius,
                this.turn3.itp.lat,
                this.turn3.itp.long,
            );
            this.turn3.ftp = Avionics.Utils.bearingDistanceToCoordinates(
                this.outboundCourse + turnSign * 90,
                radius,
                this.turn3.arcCentre.lat,
                this.turn3.arcCentre.long,
            );

            this.computedPath.push({
                type: PathVectorType.Line,
                startPoint: this.turn2.ftp,
                endPoint: this.turn3.itp,
            });
        }

        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: this.turn2.itp,
            endPoint: this.turn2.ftp,
            centrePoint: this.turn2.arcCentre,
            sweepAngle: this.turn2.sweepAngle,
        });

        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: this.turn3.itp,
            endPoint: this.turn3.ftp,
            centrePoint: this.turn3.arcCentre,
            sweepAngle: this.turn3.sweepAngle,
        });

        this.computedPath.push({
            type: PathVectorType.Line,
            startPoint: this.turn3.ftp,
            endPoint: this.nextLeg.fix.infos.coordinates,
        });
    }

    computeParallelEntry() {
        this.entry = EntryType.Parallel;
        const { radius, legLength } = this.nextLeg.geometry;

        const turnSign = this.nextLeg.turnDirection === TurnDirection.Right ? +1 : -1;

        this.turn1.itp = this.nextLeg.fix.infos.coordinates;
        this.turn1.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            this.inboundCourse + (this.nextLeg.turnDirection === TurnDirection.Right ? -90 : 90),
            radius,
            this.turn1.itp.lat, this.turn1.itp.long,
        );
        this.turn1.sweepAngle = Avionics.Utils.diffAngle(this.inboundCourse, this.outboundCourse + 180);
        const bearing1 = Avionics.Utils.clampAngle(this.inboundCourse + this.turn1.sweepAngle + (this.nextLeg.turnDirection === TurnDirection.Right ? 90 : -90));
        this.turn1.ftp = Avionics.Utils.bearingDistanceToCoordinates(bearing1, radius, this.turn1.arcCentre.lat, this.turn1.arcCentre.long);

        this.computedPath.length = 0;
        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: this.turn1.itp,
            endPoint: this.turn1.ftp,
            centrePoint: this.turn1.arcCentre,
            sweepAngle: this.turn1.sweepAngle,
        });

        const turn1Rads = Math.abs(this.turn1.sweepAngle) * Math.PI / 180;

        const minStraightDistance = 0.1 + 2 * Math.cos(1 - Math.SQRT2 / 2 - Math.sin(turn1Rads)) * radius;
        const nominalStraightDistance = 1.15 * legLength - radius * Math.sin(turn1Rads);

        const straightDistance = Math.max(minStraightDistance, nominalStraightDistance);

        this.turn2.itp = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundCourse + 180,
            straightDistance,
            this.turn1.ftp.lat,
            this.turn1.ftp.long,
        );
        this.computedPath.push({
            type: PathVectorType.Line,
            startPoint: this.turn1.ftp,
            endPoint: this.turn2.itp,
        });
        this.straightCourse = Avionics.Utils.computeGreatCircleHeading(this.turn1.ftp, this.turn2.itp);

        this.turn2.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundCourse + turnSign * 90,
            radius,
            this.turn2.itp.lat, this.turn2.itp.long,
        );
        this.turn2.ftp = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundCourse + turnSign * 45,
            radius,
            this.turn2.arcCentre.lat,
            this.turn2.arcCentre.long,
        );
        this.turn2.sweepAngle = turnSign * -225;

        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: this.turn2.itp,
            endPoint: this.turn2.ftp,
            centrePoint: this.turn2.arcCentre,
            sweepAngle: this.turn2.sweepAngle,
        });

        const ftp2ToInboundAbeamRadii = Math.cos(turn1Rads) + Math.SQRT2 / 2;
        const straightDist = Math.sqrt(2 * (ftp2ToInboundAbeamRadii - (1 - Math.SQRT2 / 2)) ** 2) * radius;

        this.turn3.itp = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundCourse - turnSign * 45,
            straightDist,
            this.turn2.ftp.lat,
            this.turn2.ftp.long,
        );

        this.computedPath.push({
            type: PathVectorType.Line,
            startPoint: this.turn2.ftp,
            endPoint: this.turn3.itp,
        });

        this.turn3.sweepAngle = turnSign * 45;
        this.turn3.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundCourse + turnSign * 45,
            radius,
            this.turn3.itp.lat,
            this.turn3.itp.long,
        );
        this.turn3.ftp = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundCourse - turnSign * 90,
            radius,
            this.turn3.arcCentre.lat,
            this.turn3.arcCentre.long,
        );

        this.computedPath.push({
            type: PathVectorType.Arc,
            startPoint: this.turn3.itp,
            endPoint: this.turn3.ftp,
            centrePoint: this.turn3.arcCentre,
            sweepAngle: this.turn3.sweepAngle,
        });

        this.computedPath.push({
            type: PathVectorType.Line,
            startPoint: this.turn3.ftp,
            endPoint: this.nextLeg.fix.infos.coordinates,
        });
    }

    recomputeWithParameters(isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue): void {
        // TODO only HX leg drives this

        const hxInbound = this.outboundCourse;
        const entryAngle = Avionics.Utils.diffAngle(this.inboundCourse, hxInbound);

        if (this.frozen) {
            if (this.state === EntryState.Done) {
                this.computedPath.length = 0;
            }
            return;
        }

        if (isActive && !this.frozen) {
            this.frozen = true;
        }
        // TODO freeze once we're active?

        // TODO, should HA entry become null when the leg is no longer flown?
        // might have bad implications for the next leg, and also for straying outside protected area
        // related: if we still fly the entry... should we shorten the leg length to minimum?
        if (!this.previousLeg || entryAngle >= -3 && entryAngle <= 3) {
            this.computeNullEntry();
            this.setHxEntry();
            this.isNull = true;
            return;
        }

        this.isNull = false;

        // parallel entry is always used when entering from opposite of hold course...
        // we give a 3 degree tolerance to allow for mag var, calculation errors etc.
        if (this.nextLeg.turnDirection === TurnDirection.Left) {
            if (entryAngle > 110 && entryAngle < 177) {
                this.computeTeardropEntry();
            } else if ((entryAngle >= 177 && entryAngle <= 180) || (entryAngle > -180 && entryAngle < -70)) {
                this.computeParallelEntry();
            } else if (entryAngle >= -70 && entryAngle < -3) {
                this.computeDirectTurnEntry();
            } else {
                this.computeDirectOutboundEntry();
            }
        } else if (this.nextLeg.turnDirection === TurnDirection.Right) {
            if (entryAngle > -177 && entryAngle < -110) {
                this.computeTeardropEntry();
            } else if ((entryAngle > 70 && entryAngle <= 180) || (entryAngle > -180 && entryAngle <= -177)) {
                this.computeParallelEntry();
            } else if (entryAngle > 3 && entryAngle <= 70) {
                this.computeDirectTurnEntry();
            } else {
                this.computeDirectOutboundEntry();
            }
        }

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.computedPath.push(...this.getPathDebugPoints());
        }

        // prepare the HX leg for our entry type
        this.setHxEntry();
    }

    getPathStartPoint(): Coordinates {
        return this.getTurningPoints()[0];
    }

    getPathEndPoint(): Coordinates {
        return this.getTurningPoints()[1];
    }

    get repr(): string {
        return `HOLD ENTRY(${this.nextLeg.repr})`;
    }
}
