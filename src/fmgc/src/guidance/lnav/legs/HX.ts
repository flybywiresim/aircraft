// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0
/* eslint-disable max-classes-per-file */

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters, LateralPathGuidance } from '@fmgc/guidance/ControlLaws';
import { Geometry } from '@fmgc/guidance/Geometry';
import { AltitudeDescriptor, TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { SegmentType } from '@fmgc/wtsdk';
import { arcDistanceToGo, arcGuidance, courseToFixDistanceToGo, courseToFixGuidance, maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { EntryState, HoldEntryTransition } from '@fmgc/guidance/lnav/transitions/HoldEntryTransition';
import { PathVector, PathVectorType } from '../PathVector';

interface HxGeometry {
    fixA: LatLongAlt,
    fixB: LatLongAlt,
    fixC: LatLongAlt,
    arcCentreFix1: LatLongAlt,
    arcCentreFix2: LatLongAlt,
    sweepAngle: Degrees,
    legLength: NauticalMiles,
    radius: NauticalMiles,
}

export enum HxLegGuidanceState {
    Inbound,
    Arc1,
    Outbound,
    Arc2,
}

// TODO make sure IMM EXIT works during teardrop/parallel (proceed to HF via that entry then sequence the HM immediately)
// TODO move HMLeg specific logic to HMLeg
abstract class HXLeg extends XFLeg {
    // TODO consider different entries for initial state...
    // TODO make protected when done with DebugHXLeg
    public state: HxLegGuidanceState = HxLegGuidanceState.Inbound;

    protected initialState: HxLegGuidanceState = HxLegGuidanceState.Inbound;

    protected termConditionMet: boolean = false;

    /**
     * Predicted tas for next prediction update
     * Not including wind
     */
    protected nextPredictedTas: Knots = 180;

    /**
     * Nominal TAS used for the current prediction
     * Not including wind
     */
    protected predictedTas: Knots = 180;

    /**
     * Nominal ground speed used the current prediction
     * including wind
     */
    protected predictedGs: Knots = 180;

    /**
     * Wind velocity along the inbound leg
     */
    protected inboundWindSpeed: Knots;

    /**
     * Current predicted hippodrome geometry
     */
    public geometry: HxGeometry;

    constructor(
        fix: WayPoint,
        public metadata: LegMetadata,
        public segment: SegmentType,
    ) {
        super(fix);

        this.geometry = this.computeGeometry();
    }

    get inboundLegCourse(): DegreesTrue {
        return this.fix.additionalData.course;
    }

    get outboundLegCourse(): DegreesTrue {
        return (this.inboundLegCourse + 180) % 360;
    }

    get turnDirection(): TurnDirection {
        return this.fix.turnDirection;
    }

    get ident(): string {
        return this.fix.ident;
    }

    /**
     * Used by hold entry transition to set our initial state depending on entry type
     * @param initialState
     */
    setInitialState(initialState: HxLegGuidanceState): void {
        // TODO check if already active and deny...
        this.state = initialState;
        this.initialState = initialState;
    }

    get outboundStartPoint(): Coordinates {
        const { fixB } = this.computeGeometry();
        return fixB;
    }

    public computeLegDistance(): NauticalMiles {
        // is distance in NM?
        if (this.fix.additionalData.distance !== undefined) {
            return this.fix.additionalData.distance;
        }

        const alt = this.fix.legAltitude1 ?? SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');

        // distance is in time then...
        const defaultMinutes = alt < 14000 ? 1 : 1.5;
        const inboundGroundSpeed = (this.predictedTas + (this.inboundWindSpeed ?? 0));
        return (this.fix.additionalData.distanceInMinutes !== undefined ? this.fix.additionalData.distanceInMinutes : defaultMinutes) * inboundGroundSpeed / 60;
    }

    protected computeGeometry(): HxGeometry {
        /*
         * We define some fixes at the turning points around the hippodrome like so (mirror vertically for left turn):
         *         A          B
         *         *----------*
         *       /              \
         * arc1 |  *          *  | arc2
         *       \              /
         *         *<---------*
         *      hold fix      C
         */

        const legLength = this.computeLegDistance();
        const radius = this.radius;
        const turnSign = this.turnDirection === TurnDirection.Left ? -1 : 1;

        const fixA = Avionics.Utils.bearingDistanceToCoordinates(
            this.inboundLegCourse + turnSign * 90,
            radius * 2,
            this.fix.infos.coordinates.lat,
            this.fix.infos.coordinates.long,
        );
        const fixB = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundLegCourse,
            legLength,
            fixA.lat,
            fixA.long,
        );
        const fixC = Avionics.Utils.bearingDistanceToCoordinates(
            this.outboundLegCourse,
            legLength,
            this.fix.infos.coordinates.lat,
            this.fix.infos.coordinates.long,
        );

        const arcCentreFix1 = Avionics.Utils.bearingDistanceToCoordinates(
            this.inboundLegCourse + turnSign * 90,
            radius,
            this.fix.infos.coordinates.lat,
            this.fix.infos.coordinates.long,
        );
        const arcCentreFix2 = Avionics.Utils.bearingDistanceToCoordinates(
            this.inboundLegCourse + turnSign * 90,
            radius,
            fixC.lat,
            fixC.long,
        );

        return {
            fixA,
            fixB,
            fixC,
            arcCentreFix1,
            arcCentreFix2,
            sweepAngle: turnSign * 180,
            legLength,
            radius,
        };
    }

    get radius(): NauticalMiles {
        const gsMs = this.predictedGs / 1.94384;
        const radius = (gsMs ** 2 / (9.81 * Math.tan(maxBank(this.predictedTas, true) * Math.PI / 180)) / 1852);

        return radius;
    }

    get terminationPoint(): LatLongAlt {
        return this.fix.infos.coordinates;
    }

    get distance(): NauticalMiles {
        return 0; // 0 so no PWPs
    }

    get inboundCourse(): Degrees {
        return this.inboundLegCourse;
    }

    get outboundCourse(): Degrees {
        return this.inboundLegCourse;
    }

    get startsInCircularArc(): boolean {
        // this is intended to be used only for entry...
        return this.state === HxLegGuidanceState.Arc1 || this.state === HxLegGuidanceState.Arc2;
    }

    /**
     *
     * @param tas
     * @returns
     */
    public getNominalRollAngle(gs: Knots): Degrees {
        return this.endsInCircularArc ? maxBank(gs, true) : 0;
    }

    protected getDistanceToGoThisOrbit(ppos: LatLongData): NauticalMiles {
        const { fixB, arcCentreFix1, arcCentreFix2, sweepAngle } = this.geometry;

        switch (this.state) {
        case HxLegGuidanceState.Inbound:
            return courseToFixDistanceToGo(ppos, this.inboundLegCourse, this.fix.infos.coordinates);
        case HxLegGuidanceState.Arc1:
            return arcDistanceToGo(ppos, this.fix.infos.coordinates, arcCentreFix1, sweepAngle) + this.computeLegDistance() * 2 + this.radius * Math.PI;
        case HxLegGuidanceState.Outbound:
            return courseToFixDistanceToGo(ppos, this.outboundLegCourse, fixB) + this.computeLegDistance() + this.radius * Math.PI;
        case HxLegGuidanceState.Arc2:
            return arcDistanceToGo(ppos, fixB, arcCentreFix2, sweepAngle) + this.computeLegDistance();
        // no default
        }

        return 1;
    }

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        return this.getDistanceToGoThisOrbit(ppos);
    }

    getHippodromePath(): PathVector[] {
        const { fixA, fixB, fixC, arcCentreFix1, arcCentreFix2, sweepAngle } = this.geometry;

        return [
            {
                type: PathVectorType.Arc,
                startPoint: this.fix.infos.coordinates,
                centrePoint: arcCentreFix1,
                endPoint: fixA,
                sweepAngle,
            },
            {
                type: PathVectorType.Line,
                startPoint: fixA,
                endPoint: fixB,
            },
            {
                type: PathVectorType.Arc,
                startPoint: fixB,
                centrePoint: arcCentreFix2,
                endPoint: fixC,
                sweepAngle,
            },
            {
                type: PathVectorType.Line,
                startPoint: fixC,
                endPoint: this.fix.infos.coordinates,
            },
        ];
    }

    get predictedPath(): PathVector[] {
        return this.getHippodromePath();
    }

    updateState(ppos: LatLongAlt, tas: Knots, geometry: HxGeometry): void {
        let dtg = 0;

        // TODO divide up into sectors and choose based on that?

        switch (this.state) {
        case HxLegGuidanceState.Inbound: {
            dtg = courseToFixDistanceToGo(ppos, this.inboundLegCourse, this.fix.infos.coordinates);
            break;
        }
        case HxLegGuidanceState.Arc1: {
            dtg = arcDistanceToGo(ppos, this.fix.infos.coordinates, geometry.arcCentreFix1, geometry.sweepAngle);
            break;
        }
        case HxLegGuidanceState.Outbound: {
            dtg = courseToFixDistanceToGo(ppos, this.outboundLegCourse, geometry.fixB);
            break;
        }
        case HxLegGuidanceState.Arc2: {
            dtg = arcDistanceToGo(ppos, geometry.fixB, geometry.arcCentreFix2, geometry.sweepAngle);
            break;
        }
        default:
            throw new Error(`Bad HxLeg state ${this.state}`);
        }

        if (dtg <= 0) {
            if (this.state === HxLegGuidanceState.Inbound) {
                if (this.termConditionMet) {
                    return;
                }
                this.updatePrediction();
            }
            this.state = (this.state + 1) % (HxLegGuidanceState.Arc2 + 1);
            console.log(`HX switched to state ${HxLegGuidanceState[this.state]}`);
        }
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees, tas: Knots, gs: Knots): GuidanceParameters {
        const { fixB, arcCentreFix1, arcCentreFix2, sweepAngle, legLength } = this.geometry;

        this.updateState(ppos, tas, this.geometry);

        let params: LateralPathGuidance;
        let dtg: NauticalMiles;
        let nextPhi = 0;
        let rad = 0;

        switch (this.state) {
        case HxLegGuidanceState.Inbound:
            params = courseToFixGuidance(ppos, trueTrack, this.inboundLegCourse, this.fix.infos.coordinates);
            dtg = courseToFixDistanceToGo(ppos, this.inboundLegCourse, this.fix.infos.coordinates);
            nextPhi = sweepAngle > 0 ? maxBank(tas, true) : -maxBank(tas, true);
            rad = Geometry.getRollAnticipationDistance(gs, params.phiCommand, nextPhi);
            break;
        case HxLegGuidanceState.Arc1:
            params = arcGuidance(ppos, trueTrack, this.fix.infos.coordinates, arcCentreFix1, sweepAngle);
            dtg = arcDistanceToGo(ppos, this.fix.infos.coordinates, arcCentreFix1, sweepAngle);
            rad = Geometry.getRollAnticipationDistance(gs, params.phiCommand, nextPhi);
            if (legLength <= rad) {
                nextPhi = params.phiCommand;
            }
            break;
        case HxLegGuidanceState.Outbound:
            params = courseToFixGuidance(ppos, trueTrack, this.outboundLegCourse, fixB);
            dtg = courseToFixDistanceToGo(ppos, this.outboundLegCourse, fixB);
            nextPhi = sweepAngle > 0 ? maxBank(tas, true) : -maxBank(tas, true);
            rad = Geometry.getRollAnticipationDistance(gs, params.phiCommand, nextPhi);
            break;
        case HxLegGuidanceState.Arc2:
            params = arcGuidance(ppos, trueTrack, fixB, arcCentreFix2, sweepAngle);
            dtg = arcDistanceToGo(ppos, fixB, arcCentreFix2, sweepAngle);
            rad = Geometry.getRollAnticipationDistance(gs, params.phiCommand, nextPhi);
            if (legLength <= rad) {
                nextPhi = params.phiCommand;
            }
            break;
        default:
            throw new Error(`Bad HxLeg state ${this.state}`);
        }

        // TODO HF/HA too
        if (dtg <= rad && !(this.state === HxLegGuidanceState.Inbound && this.termConditionMet)) {
            params.phiCommand = nextPhi;
        }

        return params;
    }

    recomputeWithParameters(
        isActive: boolean,
        _tas: Knots,
        _gs: Knots,
        _ppos: Coordinates,
        _trueTrack: DegreesTrue,
        _startAltitude?: Feet,
        _verticalSpeed?: FeetPerMinute,
    ): void {
        if (!isActive) {
            this.updatePrediction();
        }
    }

    setPredictedTas(tas: Knots) {
        this.nextPredictedTas = tas;
    }

    /**
     * Should be called on each crossing of the hold fix
     */
    updatePrediction() {
        const windDirection = SimVar.GetSimVarValue('AMBIENT WIND DIRECTION', 'Degrees');
        const windSpeed = SimVar.GetSimVarValue('AMBIENT WIND VELOCITY', 'Knots');
        const windAngleToInbound = Math.abs(Avionics.Utils.diffAngle(windDirection, this.inboundCourse));
        this.inboundWindSpeed = Math.cos(windAngleToInbound * Math.PI / 180) * windSpeed;

        this.predictedTas = this.nextPredictedTas;
        this.predictedGs = this.predictedTas + windSpeed;
        this.geometry = this.computeGeometry();

        // TODO update entry transition too
    }

    // TODO are we even using this? What exactly should it tell us?
    isAbeam(_ppos: Coordinates) {
        return false;
    }

    getPathStartPoint(): Coordinates {
        return this.fix.infos.coordinates;
    }

    getPathEndPoint(): Coordinates {
        // TODO consider early exit to CF on HF leg
        return this.fix.infos.coordinates;
    }
}

export class HMLeg extends HXLeg {
    // TODO only reset this on crossing the hold fix (so exit/resume/exit keeps the existing shortened path)
    private immExitLength: NauticalMiles;

    /**
     * Use for IMM EXIT set/reset function on the MCDU
     * Note: if IMM EXIT is set before this leg is active it should be deleted from the f-pln instead
     * @param
     */
    setImmediateExit(exit: boolean, ppos: LatLongData, tas: Knots): void {
        // TODO if we're still in the entry transition, HM becomes empty, but still fly the entry

        const { legLength, fixA, sweepAngle } = this.geometry;
        if (exit) {
            switch (this.state) {
            case HxLegGuidanceState.Arc1:
                // let's do a circle
                this.immExitLength = 0;
                break;
            case HxLegGuidanceState.Outbound:
                const nextPhi = sweepAngle > 0 ? maxBank(tas, true) : -maxBank(tas, true);
                const rad = Geometry.getRollAnticipationDistance(tas, 0, nextPhi);
                this.immExitLength = Math.min(legLength, rad + courseToFixDistanceToGo(ppos, this.inboundLegCourse, fixA));
                break;
            case HxLegGuidanceState.Arc2:
            case HxLegGuidanceState.Inbound:
                // keep the normal leg distance as we can't shorten
                this.immExitLength = legLength;
                break;
            // no default
            }
        }

        // hack to allow f-pln page to see state
        this.fix.additionalData.immExit = exit;

        this.termConditionMet = exit;

        // if resuming hold, the geometry will be recomputed on the next pass of the hold fix
        if (exit) {
            this.geometry = this.computeGeometry();
        }
    }

    public computeLegDistance(): NauticalMiles {
        if (this.termConditionMet) {
            return this.immExitLength;
        }

        return super.computeLegDistance();
    }

    get disableAutomaticSequencing(): boolean {
        return !this.termConditionMet;
    }

    get repr(): string {
        return `HM '${this.fix.ident}' ${TurnDirection[this.turnDirection]}`;
    }
}

// TODO
/*
If the aircraft reaches or exceeds the altitude
specified in the flight plan before the HA leg is active, the aircraft
does not enter the hold
*/
export class HALeg extends HXLeg {
    private readonly targetAltitude: Feet;

    constructor(
        public to: WayPoint,
        public metadata: LegMetadata,
        public segment: SegmentType,
    ) {
        super(to, metadata, segment);

        // the term altitude is guaranteed to be at or above, and in field altitude1, by ARINC424 coding rules
        if (this.fix.legAltitudeDescription !== AltitudeDescriptor.AtOrAbove) {
            console.warn(`HALeg invalid altitude descriptor ${this.fix.legAltitudeDescription}, must be ${AltitudeDescriptor.AtOrAbove}`);
        }
        this.targetAltitude = this.fix.legAltitude1;
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees, tas: Knots, gs: Knots): GuidanceParameters {
        if (SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') >= this.targetAltitude) {
            this.termConditionMet = true;
        }

        return super.getGuidanceParameters(ppos, trueTrack, tas, gs);
    }

    recomputeWithParameters(isActive: boolean, tas: Knots, gs: Knots, ppos: Coordinates, trueTrack: DegreesTrue): void {
        if (SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') >= this.targetAltitude) {
            this.termConditionMet = true;
        }
        if (!isActive && this.termConditionMet) {
            this.isNull = true;
        }
        this.setPredictedTas(tas);
        super.recomputeWithParameters(isActive, tas, gs, ppos, trueTrack);
    }

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        if (this.isNull) {
            return 0;
        }
        if (this.termConditionMet) {
            return this.getDistanceToGoThisOrbit(ppos);
        }
        const { legLength, radius } = this.geometry;
        return legLength * 2 + radius * Math.PI * 2;
    }

    get disableAutomaticSequencing(): boolean {
        return !this.termConditionMet;
    }

    get predictedPath(): PathVector[] {
        if (!this.isNull) {
            return super.predictedPath;
        }
        return [];
    }

    get repr(): string {
        return `HA '${this.fix.ident}' ${TurnDirection[this.turnDirection]} - ${this.targetAltitude.toFixed(0)}`;
    }
}

export class HFLeg extends HXLeg {
    private entryTransition: HoldEntryTransition;

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees, tas: Knots, gs: Knots): GuidanceParameters {
        if (this.entryTransition) {
            this.termConditionMet = this.entryTransition.isNull || this.entryTransition.state === EntryState.Capture || this.entryTransition.state === EntryState.Done;
        }

        return super.getGuidanceParameters(ppos, trueTrack, tas, gs);
    }

    recomputeWithParameters(isActive: boolean, tas: Knots, gs: Knots, ppos: Coordinates, trueTrack: DegreesTrue): void {
        if (this.inboundGuidable instanceof HoldEntryTransition) {
            this.entryTransition = this.inboundGuidable;
            this.termConditionMet = this.entryTransition.isNull || this.entryTransition.state === EntryState.Capture || this.entryTransition.state === EntryState.Done;
        }
        this.setPredictedTas(tas);
        super.recomputeWithParameters(isActive, tas, gs, ppos, trueTrack);
    }

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        return this.entryTransition?.getDistanceToGo(ppos) ?? 0;
    }

    get predictedPath(): PathVector[] {
        return [];
    }

    get disableAutomaticSequencing(): boolean {
        return false;
    }

    get repr(): string {
        return `HF '${this.fix.ident}' ${TurnDirection[this.turnDirection]}`;
    }
}
