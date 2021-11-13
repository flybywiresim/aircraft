/**
 * Copyright 2021, FlyByWire Simulations, Synaptic Simulations
 * SPDX-License-Identifier: GPL-3.0
 */
/* eslint-disable max-classes-per-file */

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters, LateralPathGuidance } from '@fmgc/guidance/ControlLaws';
import { Geometry } from '@fmgc/guidance/Geometry';
import { AltitudeDescriptor, TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { SegmentType } from '@fmgc/wtsdk';
import { arcDistanceToGo, arcGuidance, courseToFixDistanceToGo, courseToFixGuidance, maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { AltitudeConstraint, getAltitudeConstraintFromWaypoint, getSpeedConstraintFromWaypoint, SpeedConstraint } from '@fmgc/guidance/lnav/legs/index';
import { Guidable } from '@fmgc/guidance/Guidable';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { PathVector, PathVectorType } from '../PathVector';

interface HxGeometry {
    fixA: LatLongAlt,
    fixB: LatLongAlt,
    fixC: LatLongAlt,
    arcCentreFix1: LatLongAlt,
    arcCentreFix2: LatLongAlt,
    sweepAngle: Degrees,
}

export enum HxLegGuidanceState {
    Inbound,
    Arc1,
    Outbound,
    Arc2,
}

export class HMLeg extends XFLeg {
    // TODO consider different entries for initial state...
    // TODO make protected when done with DebugHXLeg
    public state: HxLegGuidanceState = HxLegGuidanceState.Inbound;

    protected initialState: HxLegGuidanceState = HxLegGuidanceState.Inbound;

    protected transitionEndPoint: Coordinates;

    protected termConditionMet: boolean = false;

    // protected inboundLegCourse: Degrees;

    // protected outboundLegCourse: Degrees;

    private immExitLength: NauticalMiles;

    private immExitRequested = false;

    constructor(public to: WayPoint, public segment: SegmentType) {
        super(to);
    }

    get inboundLegCourse(): DegreesTrue {
        // return SimVar.GetSimVarValue('L:HOLD_COURSE', 'number');
        return this.to.additionalData.course;
    }

    get outboundLegCourse(): DegreesTrue {
        return (this.inboundLegCourse + 180) % 360;
    }

    get turnDirection(): TurnDirection {
        // return SimVar.GetSimVarValue('L:HOLD_LEFT', 'number') > 0 ? TurnDirection.Left : TurnDirection.Right;
        return this.to.turnDirection;
    }

    get ident(): string {
        return this.to.ident;
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

    setTransitionEndPoint(endPoint: Coordinates): void {
        this.transitionEndPoint = endPoint;
    }

    /**
     * Use for IMM EXIT set/reset function on the MCDU
     * @param
     */
    setImmediateExit(exit: boolean, ppos: LatLongData): void {
        if (exit) {
            switch (this.state) {
            case HxLegGuidanceState.Arc1:
                // let's do a circle
                this.immExitLength = 0;
                break;
            case HxLegGuidanceState.Outbound:
                const { fixA } = this.computeGeometry();
                // TODO maybe need a little anticipation distance added.. we will start off with XTK and should already be at or close to max bank...
                this.immExitLength = courseToFixDistanceToGo(ppos, this.inboundLegCourse, fixA);
                break;
            case HxLegGuidanceState.Arc2:
            case HxLegGuidanceState.Inbound:
                // keep the normal leg distance as we can't shorten
                this.immExitLength = this.computeLegDistance();
                break;
            // no default
            }
        }

        this.immExitRequested = exit;
    }

    // TODO temp until vnav can give this
    targetSpeed(): Knots {
        // TODO unhax, need altitude => speed from vnav if not coded
        const alt = this.to.legAltitude1;
        let groundSpeed = 220; // TODO green dot, wind (from VNAV predictions)
        if (this.to.speedConstraint > 100) {
            groundSpeed = Math.min(groundSpeed, this.to.speedConstraint);
        }
        // apply icao limits
        if (alt < 14000) {
            groundSpeed = Math.min(230, groundSpeed);
        } else if (alt < 20000) {
            groundSpeed = Math.min(240, groundSpeed);
        } else if (alt < 34000) {
            groundSpeed = Math.min(265, groundSpeed);
        } else {
            // TODO mach 0.83
            groundSpeed = Math.min(240, groundSpeed);
        }
        // TODO apply speed limit/alt
        return groundSpeed;
    }

    get outboundStartPoint(): Coordinates {
        const { fixB } = this.computeGeometry();
        return fixB;
    }

    public computeLegDistance(): NauticalMiles {
        if (this.immExitRequested) {
            return this.immExitLength;
        }
        // is distance in NM?
        if (this.to.additionalData.distance > 0) {
            return this.to.additionalData.distance;
        }

        // distance is in time then...
        // default should be 1 minute <= 14k ft, otherwise 1.5 minutes
        const groundSpeed = this.targetSpeed();
        return (this.to.additionalData.distanceInMinutes > 0 ? this.to.additionalData.distanceInMinutes : 1) * groundSpeed / 60;
    }

    protected computeGeometry(_groundSpeed?: Knots): HxGeometry {
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

        // TODO calculate IMM EXIT shortened leg if necessary

        const distance = this.computeLegDistance();
        const radius = this.radius;
        const leftTurn = this.turnDirection === TurnDirection.Left;

        const fixA = Avionics.Utils.bearingDistanceToCoordinates(this.inboundLegCourse + (leftTurn ? -90 : 90), radius * 2, this.to.infos.coordinates.lat, this.to.infos.coordinates.long);
        const fixB = Avionics.Utils.bearingDistanceToCoordinates(this.outboundLegCourse, distance, fixA.lat, fixA.long);
        const fixC = Avionics.Utils.bearingDistanceToCoordinates(this.outboundLegCourse, distance, this.to.infos.coordinates.lat, this.to.infos.coordinates.long);

        const arcCentreFix1 = Avionics.Utils.bearingDistanceToCoordinates(this.inboundLegCourse + (leftTurn ? -90 : 90), radius, this.to.infos.coordinates.lat, this.to.infos.coordinates.long);
        const arcCentreFix2 = Avionics.Utils.bearingDistanceToCoordinates(this.inboundLegCourse + (leftTurn ? -90 : 90), radius, fixC.lat, fixC.long);

        return {
            fixA,
            fixB,
            fixC,
            arcCentreFix1,
            arcCentreFix2,
            sweepAngle: leftTurn ? -180 : 180,
        };
    }

    get radius(): NauticalMiles {
        // TODO account for wind
        const gsMs = this.targetSpeed() / 1.94384;
        const radius = (gsMs ** 2 / (9.81 * Math.tan(maxBank(this.targetSpeed(), true) * Math.PI / 180)) / 1852) * LnavConfig.TURN_RADIUS_FACTOR;

        return radius;
    }

    get terminationPoint(): LatLongAlt {
        return this.to.infos.coordinates;
    }

    get distance(): NauticalMiles {
        // TODO fix...
        return this.computeLegDistance() * 4;
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
     * @param tas m/s... why tho?
     * @returns
     */
    public getNominalRollAngle(gs: Knots): Degrees {
        return this.endsInCircularArc ? maxBank(gs, true) : 0;
    }

    protected getDistanceToGoThisOrbit(ppos: LatLongData): NauticalMiles {
        const { fixB, arcCentreFix1, arcCentreFix2, sweepAngle } = this.computeGeometry();

        switch (this.state) {
        case HxLegGuidanceState.Inbound:
            return courseToFixDistanceToGo(ppos, this.inboundLegCourse, this.to.infos.coordinates);
        case HxLegGuidanceState.Arc1:
            return arcDistanceToGo(ppos, this.to.infos.coordinates, arcCentreFix1, sweepAngle) + this.computeLegDistance() * 2 + this.radius * Math.PI;
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

    get predictedPath(): PathVector[] {
        const { fixA, fixB, fixC, arcCentreFix1, arcCentreFix2, sweepAngle } = this.computeGeometry();

        return [
            {
                type: PathVectorType.Arc,
                startPoint: this.to.infos.coordinates,
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
                endPoint: this.to.infos.coordinates,
            },
        ];
    }

    updateState(ppos: LatLongAlt, geometry: HxGeometry): void {
        let dtg = 0;

        // TODO divide up into sectors and choose based on that?

        switch (this.state) {
        case HxLegGuidanceState.Inbound: {
            dtg = courseToFixDistanceToGo(ppos, this.inboundLegCourse, this.to.infos.coordinates);
            break;
        }
        case HxLegGuidanceState.Arc1: {
            dtg = arcDistanceToGo(ppos, this.to.infos.coordinates, geometry.arcCentreFix1, geometry.sweepAngle);
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
            this.state = (this.state + 1) % (HxLegGuidanceState.Arc2 + 1);
            console.log(`HX switched to state ${HxLegGuidanceState[this.state]}`);
        }
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees): GuidanceParameters {
        // TODO get hold speed/predicted speed
        const groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
        const geometry = this.computeGeometry(groundSpeed);
        const { fixB, arcCentreFix1, arcCentreFix2, sweepAngle } = geometry;

        this.updateState(ppos, geometry);

        let params: LateralPathGuidance;
        let dtg: NauticalMiles;
        let nextPhi = 0;
        let prevPhi = 0;

        switch (this.state) {
        case HxLegGuidanceState.Inbound:
            params = courseToFixGuidance(ppos, trueTrack, this.inboundLegCourse, this.to.infos.coordinates);
            dtg = courseToFixDistanceToGo(ppos, this.inboundLegCourse, this.to.infos.coordinates);
            nextPhi = sweepAngle > 0 ? maxBank(groundSpeed /* FIXME TAS */, true) : -maxBank(groundSpeed /* FIXME TAS */, true);
            break;
        case HxLegGuidanceState.Arc1:
            params = arcGuidance(ppos, trueTrack, this.to.infos.coordinates, arcCentreFix1, sweepAngle);
            dtg = arcDistanceToGo(ppos, this.to.infos.coordinates, arcCentreFix1, sweepAngle);
            prevPhi = params.phiCommand;
            break;
        case HxLegGuidanceState.Outbound:
            params = courseToFixGuidance(ppos, trueTrack, this.outboundLegCourse, fixB);
            dtg = courseToFixDistanceToGo(ppos, this.outboundLegCourse, fixB);
            nextPhi = sweepAngle > 0 ? maxBank(groundSpeed /* FIXME TAS */, true) : -maxBank(groundSpeed /* FIXME TAS */, true);
            break;
        case HxLegGuidanceState.Arc2:
            params = arcGuidance(ppos, trueTrack, fixB, arcCentreFix2, sweepAngle);
            dtg = arcDistanceToGo(ppos, fixB, arcCentreFix2, sweepAngle);
            prevPhi = params.phiCommand;
            break;
        default:
            throw new Error(`Bad HxLeg state ${this.state}`);
        }

        const rad = Geometry.getRollAnticipationDistance(groundSpeed, prevPhi, nextPhi);
        if (dtg <= rad) {
            params.phiCommand = nextPhi;
        }

        return params;
    }

    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, _previousGuidable: Guidable, _nextGuidable: Guidable): void {
        // TODO store IMM EXIT point and termConditionMet flag, consider changes to hold params
        // console.log(this.predictedPath);
    }

    // TODO are we even using this? What exactly should it tell us?
    isAbeam(_ppos: Coordinates) {
        return false;
    }

    get speedConstraint(): SpeedConstraint | undefined {
        return getSpeedConstraintFromWaypoint(this.to);
    }

    get altitudeConstraint(): AltitudeConstraint | undefined {
        return getAltitudeConstraintFromWaypoint(this.to);
    }

    getPathStartPoint(): Coordinates {
        return this.to.infos.coordinates;
    }

    getPathEndPoint(): Coordinates {
        // TODO consider early exit to CF on HF leg
        return this.to.infos.coordinates;
    }

    get disableAutomaticSequencing(): boolean {
        return true;
    }

    get repr(): string {
        return `${this.constructor.name.substr(0, 2)} '${this.to.ident}' ${TurnDirection[this.turnDirection]}`;
    }
}

export class HALeg extends HMLeg {
    private targetAltitude: Feet;

    constructor(public to: WayPoint, public segment: SegmentType) {
        super(to, segment);

        // the term altitude is guaranteed to be at or above, and in field altitude1, by ARINC424 coding rules
        if (this.to.legAltitudeDescription !== AltitudeDescriptor.AtOrAbove) {
            console.warn(`HALeg invalid altitude descriptor ${this.to.legAltitudeDescription}, must be ${AltitudeDescriptor.AtOrAbove}`);
        }
        this.targetAltitude = this.to.legAltitude1;
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees): GuidanceParameters {
        // TODO get altitude, check for at or above our target
        // TODO do we need to force at least one circuit if already at the term altitude on entry? honeywell doc covers this..
        // FIXME use FMGC position data
        this.termConditionMet = SimVar.GetSimVarValue('ALTITUDE INDICATED:1', 'feet') >= this.targetAltitude;

        return super.getGuidanceParameters(ppos, trueTrack);
    }

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        if (this.termConditionMet) {
            return this.getDistanceToGoThisOrbit(ppos);
        }
        // TODO compute distance until alt (vnav) + remainder of last orbit
        return 42;
    }

    get disableAutomaticSequencing(): boolean {
        return false;
    }
}

export class HFLeg extends HMLeg {
    // TODO special predicted path for early exit to CF

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees): GuidanceParameters {
        // always terminate on first crossing of holding fix after entry
        this.termConditionMet = true;
        return super.getGuidanceParameters(ppos, trueTrack);
    }

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        // TODO early exit to CF leg...
        return super.getDistanceToGoThisOrbit(ppos);
    }

    get disableAutomaticSequencing(): boolean {
        return false;
    }

    get predictedPath(): PathVector[] {
        const { fixA, fixB, fixC, arcCentreFix1, arcCentreFix2, sweepAngle } = this.computeGeometry();

        const path = [];

        path.push({
            type: PathVectorType.Line,
            startPoint: fixC,
            endPoint: this.to.infos.coordinates,
        });

        if (this.initialState === HxLegGuidanceState.Inbound) {
            if (this.transitionEndPoint) {
                path[0].startPoint = this.transitionEndPoint;
            }
            return path;
        }

        path.push({
            type: PathVectorType.Arc,
            startPoint: fixB,
            centrePoint: arcCentreFix2,
            endPoint: fixC,
            sweepAngle,
        });

        if (this.initialState === HxLegGuidanceState.Arc2) {
            if (this.transitionEndPoint) {
                path[1].startPoint = this.transitionEndPoint;
            }
            return path;
        }

        path.push({
            type: PathVectorType.Line,
            startPoint: fixA,
            endPoint: fixB,
        });

        if (this.initialState === HxLegGuidanceState.Outbound) {
            if (this.transitionEndPoint) {
                path[2].startPoint = this.transitionEndPoint;
            }
            return path;
        }

        path.push({
            type: PathVectorType.Arc,
            startPoint: this.to.infos.coordinates,
            centrePoint: arcCentreFix1,
            endPoint: fixA,
            sweepAngle,
        });

        if (this.transitionEndPoint) {
            path[3].startPoint = this.transitionEndPoint;
        }

        return path;
    }
}
