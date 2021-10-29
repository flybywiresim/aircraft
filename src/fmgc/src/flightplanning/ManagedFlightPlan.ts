/*
 * MIT License
 *
 * Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { AltitudeDescriptor } from '../types/fstypes/FSEnums';
import { FlightPlanSegment, SegmentType } from './FlightPlanSegment';
import { LegsProcedure } from './LegsProcedure';
import { RawDataMapper } from './RawDataMapper';
import { GPS } from './GPS';
import { ProcedureDetails } from './ProcedureDetails';
import { DirectTo } from './DirectTo';
import { GeoMath } from './GeoMath';
import { WaypointBuilder } from './WaypointBuilder';

/**
 * A flight plan managed by the FlightPlanManager.
 */
export class ManagedFlightPlan {
    /** Whether or not the flight plan has an origin airfield. */
    public originAirfield?: WayPoint;

    // This is the same as originAirfield, but is not cleared when a direct-to occurs
    public persistentOriginAirfield?: WayPoint;

    /** Transition altitude for the originAirfield from the nav database */
    public originTransitionAltitudeDb?: number;

    /** Transition altitude for the originAirfield from the pilot */
    public originTransitionAltitudePilot?: number;

    /** Whether or not the flight plan has a destination airfield. */
    public destinationAirfield?: WayPoint;

    /** Transition level for the destinationAirfield from the nav database */
    public destinationTransitionLevelDb?: number;

    /** Transition level for the destinationAirfield from the pilot */
    public destinationTransitionLevelPilot?: number;

    /** The cruise altitude for this flight plan. */
    public cruiseAltitude = 0;

    /** The index of the currently active waypoint. */
    public activeWaypointIndex = 0;

    /** The details for selected procedures on this flight plan. */
    public procedureDetails: ProcedureDetails = new ProcedureDetails();

    /** The details of any direct-to procedures on this flight plan. */
    public directTo: DirectTo = new DirectTo();

    /** The departure segment of the flight plan. */
    public get departure(): FlightPlanSegment {
        return this.getSegment(SegmentType.Departure);
    }

    /** The enroute segment of the flight plan. */
    public get enroute(): FlightPlanSegment {
        return this.getSegment(SegmentType.Enroute);
    }

    /** The arrival segment of the flight plan. */
    public get arrival(): FlightPlanSegment {
        return this.getSegment(SegmentType.Arrival);
    }

    /** The approach segment of the flight plan. */
    public get approach(): FlightPlanSegment {
        return this.getSegment(SegmentType.Approach);
    }

    /** The approach segment of the flight plan. */
    public get missed(): FlightPlanSegment {
        return this.getSegment(SegmentType.Missed);
    }

    /** Whether the flight plan has an origin airfield. */
    public get hasOrigin() {
        return this.originAirfield;
    }

    /** Whether the flight plan has a persistent origin airfield. */
    public get hasPersistentOrigin() {
        return this.persistentOriginAirfield;
    }

    /** Whether the flight plan has a destination airfield. */
    public get hasDestination() {
        return this.destinationAirfield;
    }

    /** The currently active waypoint. */
    public get activeWaypoint(): WayPoint {
        return this.waypoints[this.activeWaypointIndex];
    }

    /**
     * Returns a list of {@link WaypointStats} for the waypoints in the flight plan
     *
     * @return {WaypointStats[]} array of statistics for the waypoints in the flight plan, with matching indices to
     *                           flight plan waypoints
     */
    public computeWaypointStatistics(ppos: LatLongData): Map<number, WaypointStats> {
        // TODO this should be moved into its own dedicated module

        const stats = new Map<number, WaypointStats>();

        const firstData = this.computeActiveWaypointStatistics(ppos);

        stats.set(this.activeWaypointIndex, firstData);

        this.waypoints.slice(0).forEach((waypoint, index) => {
            // TODO redo when we have a better solution for vector legs
            const distPpos = (waypoint.isVectors) ? 1 : waypoint.cumulativeDistanceInFP - this.activeWaypoint.cumulativeDistanceInFP + firstData.distanceFromPpos;
            const data = {
                ident: waypoint.ident,
                bearingInFp: waypoint.bearingInFP,
                distanceInFP: waypoint.distanceInFP,
                distanceFromPpos: distPpos,
                timeFromPpos: this.computeWaypointTime(waypoint.cumulativeDistanceInFP - this.activeWaypoint.cumulativeDistanceInFP + firstData.distanceFromPpos),
                etaFromPpos: this.computeWaypointEta(waypoint.cumulativeDistanceInFP - this.activeWaypoint.cumulativeDistanceInFP + firstData.distanceFromPpos),
            };
            stats.set(index, data);
        });

        return stats;
    }

    /**
     * Returns info for the currently active waypoint, to be displayed by the Navigation Display
     */
    public computeActiveWaypointStatistics(ppos: LatLongData): WaypointStats {
        // TODO this should be moved into its own dedicated module

        if (!this.activeWaypoint) {
            return undefined;
        }

        const bearingInFp = Avionics.Utils.computeGreatCircleHeading(ppos, this.activeWaypoint.infos.coordinates);

        let distanceFromPpos;
        if (Number.isNaN(ppos.lat) || Number.isNaN(ppos.long)) {
            distanceFromPpos = this.activeWaypoint.distanceInFP;
        } else if (this.activeWaypoint.isVectors) {
            // TODO redo when we have a better solution for vector legs
            distanceFromPpos = 1;
        } else {
            distanceFromPpos = Avionics.Utils.computeGreatCircleDistance(ppos, this.activeWaypoint.infos.coordinates);
        }
        const timeFromPpos = this.computeWaypointTime(distanceFromPpos);
        const etaFromPpos = this.computeWaypointEta(distanceFromPpos, timeFromPpos);

        return {
            ident: this.activeWaypoint.ident,
            bearingInFp,
            distanceInFP: this.activeWaypoint.distanceInFP,
            distanceFromPpos,
            timeFromPpos,
            etaFromPpos,
            magneticVariation: GeoMath.getMagvar(this.activeWaypoint.infos.coordinates.lat, this.activeWaypoint.infos.coordinates.long),
        };
    }

    // TODO is this accurate? Logic is same like in the old FPM
    private computeWaypointTime(distance: number) {
        const groundSpeed = Simplane.getGroundSpeed();

        if (groundSpeed < 100) {
            return (distance / 400) * 3600;
        }

        return (distance / groundSpeed) * 3600;
    }

    private computeWaypointEta(distance: number, preComputedTime? :number) {
        const eta = preComputedTime ?? this.computeWaypointTime(distance);

        const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

        // // console.log(`BRUHEGG: ${utcTime}, BRUHHH #2: ${eta}`);

        return eta + utcTime;
    }

    /** The parent instrument this flight plan is attached to locally. */
    private _parentInstrument?: BaseInstrument;

    /** The current active segments of the flight plan. */
    private _segments: FlightPlanSegment[] = [new FlightPlanSegment(SegmentType.Enroute, 0, [])];

    /** The waypoints of the flight plan. */
    public get waypoints(): WayPoint[] {
        const waypoints: WayPoint[] = [];
        if (this.originAirfield) {
            waypoints.push(this.originAirfield);
        }

        for (const segment of this._segments) {
            waypoints.push(...segment.waypoints);
        }

        if (this.destinationAirfield) {
            waypoints.push(this.destinationAirfield);
        }

        return waypoints;
    }

    /**
     * Gets all the waypoints that are currently visible and part of the routing.
     *
     * This is used to obtain the list of waypoints to display after a DIRECT TO.
     */
    public get visibleWaypoints(): WayPoint[] {
        const allWaypoints = this.waypoints;

        if (this.directTo.isActive) {
            const directToWaypointIndex = this.directTo.planWaypointIndex;

            return allWaypoints.slice(Math.max(this.activeWaypointIndex - 1, directToWaypointIndex), allWaypoints.length - 1);
        }

        return allWaypoints.slice(this.activeWaypointIndex - 1, allWaypoints.length);
    }

    public get activeVisibleWaypointIndex(): number {
        if (this.directTo.isActive) {
            const directToWaypointIndex = this.directTo.planWaypointIndex;
            return (this.activeWaypointIndex - 1) > directToWaypointIndex ? 1 : 0;
        }
        return 1;
    }

    public get segments(): FlightPlanSegment[] {
        return this._segments;
    }

    /** The length of the flight plan. */
    public get length(): number {
        const lastSeg = this._segments[this._segments.length - 1];
        return lastSeg.offset + lastSeg.waypoints.length + (this.hasDestination ? 1 : 0);
    }

    public get checksum():number {
        let checksum = 0;
        const { waypoints } = this;
        for (let i = 0; i < waypoints.length; i++) checksum += waypoints[i].infos.coordinates.lat;
        return checksum;
    }

    /** The non-approach waypoints of the flight plan. */
    public get nonApproachWaypoints(): WayPoint[] {
        const waypoints = [];
        if (this.originAirfield) {
            waypoints.push(this.originAirfield);
        }

        for (const segment of this._segments.filter((s) => s.type < SegmentType.Approach)) {
            waypoints.push(...segment.waypoints);
        }

        if (this.destinationAirfield) {
            waypoints.push(this.destinationAirfield);
        }

        return waypoints;
    }

    /**
     * Sets the parent instrument that the flight plan is attached to locally.
     * @param instrument The instrument that the flight plan is attached to.
     */
    public setParentInstrument(instrument: BaseInstrument): void {
        this._parentInstrument = instrument;
    }

    /**
     * Clears the flight plan.
     */
    public async clearPlan(): Promise<void> {
        this.originAirfield = undefined;
        this.originTransitionAltitudeDb = undefined;
        this.originTransitionAltitudePilot = undefined;
        this.persistentOriginAirfield = undefined;
        this.destinationAirfield = undefined;
        this.destinationTransitionLevelDb = undefined;
        this.destinationTransitionLevelPilot = undefined;

        this.cruiseAltitude = 0;
        this.activeWaypointIndex = 0;

        this.procedureDetails = new ProcedureDetails();
        this.directTo = new DirectTo();

        await GPS.clearPlan().catch(console.error);
        this._segments = [new FlightPlanSegment(SegmentType.Enroute, 0, [])];
    }

    /**
     * Syncs the flight plan to FS9GPS.
     */
    public async syncToGPS(): Promise<void> {
        await GPS.clearPlan().catch(console.error);
        for (let i = 0; i < this.waypoints.length; i++) {
            const waypoint = this.waypoints[i];

            if (waypoint.icao && waypoint.icao.trim() !== '') {
                GPS.addIcaoWaypoint(waypoint.icao, i).catch(console.error);
            } else {
                GPS.addUserWaypoint(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long, i, waypoint.ident).catch(console.error);
            }

            if (waypoint.endsInDiscontinuity) {
                break;
            }
        }

        await GPS.setActiveWaypoint(this.activeWaypointIndex).catch(console.error);
        await GPS.logCurrentPlan().catch(console.error);
    }

    /**
     * Adds a waypoint to the flight plan.
     *
     * @param waypoint    The waypoint to add
     *
     * @param index       The index to add the waypoint at. If omitted the waypoint will
     *                    be appended to the end of the flight plan.
     *
     * @param segmentType The type of segment to add the waypoint to
     */
    public addWaypoint(
        waypoint: WayPoint | any,
        index?: number | undefined,
        segmentType?: SegmentType,
    ): void {
        const mappedWaypoint: WayPoint = (waypoint instanceof WayPoint) ? waypoint : RawDataMapper.toWaypoint(waypoint, this._parentInstrument);

        if (mappedWaypoint.type === 'A' && index === 0) {
            this.originAirfield = mappedWaypoint;
            this.persistentOriginAirfield = mappedWaypoint;

            this.procedureDetails.departureIndex = -1;
            this.procedureDetails.departureRunwayIndex = -1;
            this.procedureDetails.departureTransitionIndex = -1;
            this.procedureDetails.originRunwayIndex = -1;

            this.reflowSegments();
            this.reflowDistances();
        } else if (mappedWaypoint.type === 'A' && index === undefined) {
            this.destinationAirfield = mappedWaypoint;
            this.procedureDetails.arrivalIndex = -1;
            this.procedureDetails.arrivalRunwayIndex = -1;
            this.procedureDetails.arrivalTransitionIndex = -1;
            this.procedureDetails.approachIndex = -1;
            this.procedureDetails.approachTransitionIndex = -1;

            this.reflowSegments();
            this.reflowDistances();
        } else {
            let segment = segmentType !== undefined
                ? this.getSegment(segmentType)
                : this.findSegmentByWaypointIndex(index);

            // hitting first waypoint in segment > enroute
            if (segment.type > SegmentType.Enroute && index === segment.offset) {
                const segIdx = this._segments.findIndex((seg) => seg.type === segment.type);
                // is prev segment enroute?
                const prevSeg = this._segments[segIdx - 1];
                if (prevSeg.type === SegmentType.Enroute) {
                    segment = prevSeg;
                }
            }

            if (segment) {
                if (index > this.length) {
                    index = undefined;
                }

                if (index !== undefined) {
                    const segmentIndex = index - segment.offset;
                    if (segmentIndex < segment.waypoints.length) {
                        segment.waypoints.splice(segmentIndex, 0, mappedWaypoint);
                    } else {
                        segment.waypoints.push(mappedWaypoint);
                    }
                } else {
                    segment.waypoints.push(mappedWaypoint);
                }

                this.reflowSegments();
                this.reflowDistances();

                const finalIndex = this.waypoints.indexOf(mappedWaypoint);
                const previousWp = finalIndex > 0 ? this.waypoints[finalIndex - 1] : undefined;

                // Transfer discontinuity forwards if previous waypoint has one and it can be cleared,
                // AND the new waypoint isn't the T-P of a direct to
                if (previousWp && previousWp.endsInDiscontinuity && !mappedWaypoint.isTurningPoint) {
                    if (previousWp.discontinuityCanBeCleared === undefined || previousWp.discontinuityCanBeCleared) {
                        previousWp.endsInDiscontinuity = false;
                        previousWp.discontinuityCanBeCleared = undefined;

                        // Don't mark the mapped waypoint's discontinuity as clearable if this is a MANUAL
                        // TODO maybe extract this logic since we also use it when building a LegsProcedure
                        mappedWaypoint.endsInDiscontinuity = true;
                        if (!mappedWaypoint.isVectors) {
                            mappedWaypoint.discontinuityCanBeCleared = true;
                        }
                    }
                }

                if (this.activeWaypointIndex === 0 && this.length > 1) {
                    this.activeWaypointIndex = 1;
                } else if (this.activeWaypointIndex === 1 && waypoint.isRunway && segment.type === SegmentType.Departure) {
                    this.activeWaypointIndex = 2;
                }
            }
        }
    }

    /**
     * Removes a waypoint from the flight plan.
     * @param index The index of the waypoint to remove.
     */
    public removeWaypoint(index: number): void {
        let removed = null;
        if (this.originAirfield && index === 0) {
            removed = this.originAirfield;
            this.originAirfield = undefined;

            this.reflowSegments();
            this.reflowDistances();
        } else if (this.destinationAirfield && index === this.length - 1) {
            removed = this.destinationAirfield;
            this.destinationAirfield = undefined;
        } else {
            const segment = this.findSegmentByWaypointIndex(index);
            if (segment) {
                // console.log("--> REMOVING WAYPOINT ", this.getWaypoint(index), ", FROM SEGMENT ", segment);
                const spliced = segment.waypoints.splice(index - segment.offset, 1);
                removed = spliced[0];

                if (segment.waypoints.length === 0 && segment.type !== SegmentType.Enroute) {
                    // console.log("SEGMENT LENGTH is 0, REMOVING...");
                    this.removeSegment(segment.type);
                }

                this.reflowSegments();
                this.reflowDistances();
            }
        }

        // transfer a potential discontinuity backward
        const beforeRemoved = this.waypoints[index - 1];
        if (beforeRemoved && !beforeRemoved.endsInDiscontinuity) {
            beforeRemoved.endsInDiscontinuity = true;
            beforeRemoved.discontinuityCanBeCleared = true;
        }

        if (index < this.activeWaypointIndex || this.activeWaypointIndex === this.waypoints.length) {
            this.activeWaypointIndex--;
        }
    }

    /**
     * Gets a waypoint by index from the flight plan.
     * @param index The index of the waypoint to get.
     */
    public getWaypoint(index: number): WayPoint | null {
        if (this.originAirfield && index === 0) {
            return this.originAirfield;
        }

        if (this.destinationAirfield && index === this.length - 1) {
            return this.destinationAirfield;
        }

        const segment = this.findSegmentByWaypointIndex(index);

        if (segment) {
            return segment.waypoints[index - segment.offset];
        }

        return null;
    }

    public setWaypointOverfly(index: number, value: boolean): void {
        if (this.originAirfield && index === 0) {
            return;
        }

        if (this.destinationAirfield && index === this.length - 1) {
            return;
        }

        const segment = this.findSegmentByWaypointIndex(index);

        if (segment) {
            segment.waypoints[index - segment.offset].additionalData.overfly = value;
        }
    }

    /**
     * Adds a plan segment to the flight plan.
     * @param type The type of the segment to add.
     */
    public addSegment(type: SegmentType): FlightPlanSegment {
        const segment = new FlightPlanSegment(type, 0, []);
        this._segments.push(segment);

        this._segments.sort((a, b) => a.type - b.type);
        this.reflowSegments();

        return segment;
    }

    /**
     * Removes a plan segment from the flight plan.
     * @param type The type of plan segment to remove.
     */
    public removeSegment(type: SegmentType): void {
        const segmentIndex = this._segments.findIndex((s) => s.type === type);
        if (segmentIndex > -1) {
            this._segments.splice(segmentIndex, 1);
        }
    }

    /**
     * Reflows waypoint index offsets accross plans segments.
     */
    public reflowSegments(): void {
        let index = 0;
        if (this.originAirfield) {
            index = 1;
        }

        for (const segment of this._segments) {
            segment.offset = index;
            index += segment.waypoints.length;
        }
    }

    /**
     * Gets a flight plan segment of the specified type.
     * @param type The type of flight plan segment to get.
     * @returns The found segment, or FlightPlanSegment.Empty if not found.
     */
    public getSegment(type: number): FlightPlanSegment {
        const segment = this._segments.find((s) => s.type === type);
        return segment !== undefined ? segment : FlightPlanSegment.Empty;
    }

    /**
     * Finds a flight plan segment by waypoint index.
     * @param index The index of the waypoint to find the segment for.
     * @returns The located segment, if any.
     */
    public findSegmentByWaypointIndex(index: number): FlightPlanSegment {
        for (let i = 0; i < this._segments.length; i++) {
            const segMaxIdx = this._segments[i].offset + this._segments[i].waypoints.length;
            if (segMaxIdx > index) {
                return this._segments[i];
            }
        }

        return this._segments[this._segments.length - 1];
    }

    /**
     * Recalculates all waypoint bearings and distances in the flight plan.
     */
    public reflowDistances(): void {
        let cumulativeDistance = 0;
        const { waypoints } = this;

        for (let i = 0; i < waypoints.length; i++) {
            if (i > 0) {
                // If there's an approach selected and this is the last approach waypoint, use the destination waypoint for coordinates
                // Runway waypoints do not have coordinates
                const referenceWaypoint = waypoints[i];
                const prevWaypoint = waypoints[i - 1];

                const trueCourseToWaypoint = Avionics.Utils.computeGreatCircleHeading(prevWaypoint.infos.coordinates, referenceWaypoint.infos.coordinates);
                referenceWaypoint.bearingInFP = trueCourseToWaypoint - GeoMath.getMagvar(prevWaypoint.infos.coordinates.lat, prevWaypoint.infos.coordinates.long);
                referenceWaypoint.bearingInFP = referenceWaypoint.bearingInFP < 0 ? 360 + referenceWaypoint.bearingInFP : referenceWaypoint.bearingInFP;
                if (prevWaypoint.endsInDiscontinuity && !prevWaypoint.discontinuityCanBeCleared) {
                    referenceWaypoint.distanceInFP = 0;
                } else if (referenceWaypoint.additionalData) {
                    switch (referenceWaypoint.additionalData.legType) {
                    case 11:
                    case 22:
                        referenceWaypoint.distanceInFP = 1;
                        break;
                    default:
                        referenceWaypoint.distanceInFP = Avionics.Utils.computeGreatCircleDistance(prevWaypoint.infos.coordinates, referenceWaypoint.infos.coordinates);
                        break;
                    }
                } else {
                    referenceWaypoint.distanceInFP = Avionics.Utils.computeGreatCircleDistance(prevWaypoint.infos.coordinates, referenceWaypoint.infos.coordinates);
                }
                cumulativeDistance += referenceWaypoint.distanceInFP;
                referenceWaypoint.cumulativeDistanceInFP = cumulativeDistance;
            }
        }
    }

    /**
     * Copies a sanitized version of the flight plan for shared data storage.
     * @returns The sanitized flight plan.
     */
    public serialize(): any {
        const planCopy = new ManagedFlightPlan();
        const copyWaypoint = (waypoint: WayPoint) => ({
            icao: waypoint.icao,
            ident: waypoint.ident,
            type: waypoint.type,
            legAltitudeDescription: waypoint.legAltitudeDescription,
            legAltitude1: waypoint.legAltitude1,
            legAltitude2: waypoint.legAltitude2,
            speedConstraint: waypoint.speedConstraint,
            isVectors: waypoint.isVectors,
            endsInDiscontinuity: waypoint.endsInDiscontinuity,
            discontinuityCanBeCleared: waypoint.discontinuityCanBeCleared,
            distanceInFP: waypoint.distanceInFP,
            cumulativeDistanceInFP: waypoint.cumulativeDistanceInFP,
            isRunway: waypoint.isRunway,
            additionalData: waypoint.additionalData,
            infos: {
                icao: waypoint.infos.icao,
                ident: waypoint.infos.ident,
                airwayIn: waypoint.infos.airwayIn,
                airwayOut: waypoint.infos.airwayOut,
                routes: waypoint.infos.routes,
                coordinates: {
                    lat: waypoint.infos.coordinates.lat,
                    long: waypoint.infos.coordinates.long,
                    alt: waypoint.infos.coordinates.alt,
                },
            },
        });

        const copyAirfield = (airfield: WayPoint): WayPoint => {
            const copy = Object.assign(new WayPoint(undefined), airfield);
            copy.infos = Object.assign(new AirportInfo(undefined), copy.infos);

            delete copy.instrument;
            delete copy.infos.instrument;
            delete copy._svgElements;
            delete copy.infos._svgElements;

            return copy;
        };

        planCopy.activeWaypointIndex = this.activeWaypointIndex;
        planCopy.destinationAirfield = this.destinationAirfield && copyAirfield(this.destinationAirfield);
        planCopy.originAirfield = this.originAirfield && copyAirfield(this.originAirfield);
        planCopy.persistentOriginAirfield = this.persistentOriginAirfield && copyAirfield(this.persistentOriginAirfield);

        planCopy.procedureDetails = { ...this.procedureDetails };
        planCopy.directTo = { ...this.directTo };
        planCopy.directTo.interceptPoints = planCopy.directTo.interceptPoints?.map((w) => copyWaypoint(w) as WayPoint);

        const copySegments = [];
        for (const segment of this._segments) {
            const copySegment = new FlightPlanSegment(segment.type, segment.offset, []);
            for (const waypoint of segment.waypoints) {
                copySegment.waypoints.push(copyWaypoint(waypoint) as WayPoint);
            }

            copySegments.push(copySegment);
        }

        planCopy._segments = copySegments;
        return planCopy;
    }

    /**
     * Copies the flight plan.
     * @returns The copied flight plan.
     */
    public copy(): ManagedFlightPlan {
        const newFlightPlan = Object.assign(new ManagedFlightPlan(), this);
        newFlightPlan.setParentInstrument(this._parentInstrument);

        newFlightPlan._segments = [];
        for (let i = 0; i < this._segments.length; i++) {
            const seg = this._segments[i];
            newFlightPlan._segments[i] = Object.assign(new FlightPlanSegment(seg.type, seg.offset, []), seg);
            newFlightPlan._segments[i].waypoints = [...seg.waypoints.map((wp) => {
                const clone = new (wp as any).constructor();
                Object.assign(clone, wp);
                return clone;
            })];
        }

        newFlightPlan.procedureDetails = Object.assign(new ProcedureDetails(), this.procedureDetails);
        newFlightPlan.directTo = Object.assign(new DirectTo(), this.directTo);
        newFlightPlan.directTo.interceptPoints = this.directTo.interceptPoints !== undefined ? [...this.directTo.interceptPoints] : undefined;

        return newFlightPlan;
    }

    /**
     * Reverses the flight plan.
     */
    public reverse(): void {
        // TODO: Fix flight plan indexes after reversal
        // this._waypoints.reverse();
    }

    /**
     * Goes direct to the specified waypoint index in the flight plan.
     *
     * @param index The waypoint index to go direct to.
     */
    public addDirectTo(index: number): void {
        // TODO Replace with ADIRS getLatitude() getLongitude()
        const lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        const long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

        const turningPoint = WaypointBuilder.fromCoordinates('T-P', new LatLongAlt(lat, long), this._parentInstrument);
        turningPoint.isTurningPoint = true;

        this.addWaypoint(turningPoint, index);
        this.activeWaypointIndex = index + 1;

        const deleteCount = this.activeWaypointIndex - 1;

        for (let i = 0; i < deleteCount; i++) {
            this.removeWaypoint(0);
        }
    }

    /**
     * Builds a departure into the flight plan from indexes in the departure airport information.
     */
    public async buildDeparture(): Promise<void> {
        const legs = [];
        const origin = this.originAirfield;

        const { departureIndex } = this.procedureDetails;
        const runwayIndex = this.procedureDetails.departureRunwayIndex;
        const transitionIndex = this.procedureDetails.departureTransitionIndex;

        const selectedOriginRunwayIndex = this.procedureDetails.originRunwayIndex;

        const airportInfo = origin.infos as AirportInfo;

        // Set origin fix coordinates to runway beginning coordinates
        if (origin && selectedOriginRunwayIndex !== -1) {
            origin.infos.coordinates = airportInfo.oneWayRunways[selectedOriginRunwayIndex].beginningCoordinates;
        }

        if (departureIndex !== -1 && runwayIndex !== -1) {
            const runwayTransition = airportInfo.departures[departureIndex].runwayTransitions[runwayIndex];
            if (runwayTransition) {
                legs.push(...runwayTransition.legs);
            }
        }

        if (departureIndex !== -1) {
            legs.push(...airportInfo.departures[departureIndex].commonLegs);
        }

        if (transitionIndex !== -1 && departureIndex !== -1) {
            // TODO: are enroutetransitions working?
            if (airportInfo.departures[departureIndex].enRouteTransitions.length > 0) {
                const transition = airportInfo.departures[departureIndex].enRouteTransitions[transitionIndex].legs;
                legs.push(...transition);
            }
        }

        let segment = this.departure;
        if (segment !== FlightPlanSegment.Empty) {
            for (let i = 0; i < segment.waypoints.length; i++) {
                this.removeWaypoint(segment.offset);
            }

            this.removeSegment(segment.type);
        }

        if (legs.length > 0 || selectedOriginRunwayIndex !== -1 || (departureIndex !== -1 && runwayIndex !== -1)) {
            segment = this.addSegment(SegmentType.Departure);
            let procedure = new LegsProcedure(legs, origin, this._parentInstrument);

            let runway: OneWayRunway | null = this.getOriginRunway();

            if (runway) {
                // console.error('bruh');
                // Reference : AMM - 22-71-00 PB001, Page 4
                if (departureIndex === -1 && transitionIndex === -1) {
                    const TEMPORARY_VERTICAL_SPEED = 2000.0; // ft/min
                    const TEMPORARY_GROUND_SPEED = 160; // knots

                    const altitudeFeet = (runway.elevation * 3.2808399) + 1500;
                    const distanceInNM = altitudeFeet / TEMPORARY_VERTICAL_SPEED * (TEMPORARY_GROUND_SPEED / 60);

                    const coordinates = GeoMath.relativeBearingDistanceToCoords(runway.direction, distanceInNM, runway.endCoordinates);

                    const faLeg = procedure.buildWaypoint(`${Math.round(altitudeFeet)}`, coordinates);
                    // TODO should this check for unclr discont? (probs not)
                    faLeg.endsInDiscontinuity = true;
                    faLeg.discontinuityCanBeCleared = true;

                    this.addWaypoint(faLeg, undefined, segment.type);
                }

                procedure = new LegsProcedure(legs, origin, this._parentInstrument);
            }

            let waypointIndex = segment.offset;
            while (procedure.hasNext()) {
                // eslint-disable-next-line no-await-in-loop
                const waypoint = await procedure.getNext().catch(console.error);

                if (waypoint !== undefined) {
                    this.addWaypointAvoidingDuplicates(waypoint, ++waypointIndex, segment);
                }
            }
        }
    }

    /**
     * Builds an arrival into the flight plan from indexes in the arrival airport information.
     */
    public async buildArrival(): Promise<void> {
        const legs = [];
        const destination = this.destinationAirfield;

        const { arrivalIndex } = this.procedureDetails;
        const { approachTransitionIndex } = this.procedureDetails;
        const { arrivalRunwayIndex } = this.procedureDetails;
        const { arrivalTransitionIndex } = this.procedureDetails;

        const destinationInfo = destination.infos as AirportInfo;

        if (arrivalIndex !== -1 && arrivalTransitionIndex !== -1) {
            const transition = destinationInfo.arrivals[arrivalIndex].enRouteTransitions[arrivalTransitionIndex];
            if (transition !== undefined) {
                legs.push(...transition.legs);
                // console.log('MFP: buildArrival - pushing transition legs ->', legs);
            }
        }

        if (arrivalIndex !== -1) {
            legs.push(...destinationInfo.arrivals[arrivalIndex].commonLegs);
            // console.log('MFP: buildArrival - pushing STAR legs ->', legs);
        }

        if (arrivalIndex !== -1 && arrivalRunwayIndex !== -1) {
            const runwayTransition = destinationInfo.arrivals[arrivalIndex].runwayTransitions[arrivalRunwayIndex];
            if (runwayTransition) {
                legs.push(...runwayTransition.legs);
            }
            // console.log('MFP: buildArrival - pushing VIA legs ->', legs);
        }

        let { _startIndex, segment } = this.truncateSegment(SegmentType.Arrival);

        if (legs.length > 0) {
            if (segment === FlightPlanSegment.Empty) {
                segment = this.addSegment(SegmentType.Arrival);
                _startIndex = segment.offset;
            }

            const procedure = new LegsProcedure(legs, this.getWaypoint(segment.offset - 1), this._parentInstrument);

            let waypointIndex = segment.offset;
            // console.log('MFP: buildArrival - ADDING WAYPOINTS ------------------------');
            while (procedure.hasNext()) {
                // eslint-disable-next-line no-await-in-loop
                const waypoint = await procedure.getNext().catch(console.error);

                if (waypoint !== undefined) {
                    // console.log('  ---- MFP: buildArrival: added waypoint ', waypoint.ident, ' to segment ', segment);
                    this.addWaypointAvoidingDuplicates(waypoint, ++waypointIndex, segment);
                }
            }
        }
        this.updateArrivalApproachSpeeds();
    }

    /**
     * basic speed prediction until VNAV is ready...
     * helps us draw arrival and approach paths reasonably during cruise
     * @todo replace with actual predictions from VNAV!
     */
    private updateArrivalApproachSpeeds(): void {
        let speed = 250; // initial guess...
        this.getSegment(SegmentType.Arrival).waypoints.forEach((wp) => {
            if ((wp.speedConstraint ?? -1) > 100) {
                speed = wp.speedConstraint;
            } else if (wp.icao.substring(3, 7).trim().length > 0) {
                // terminal waypoint, we assume a reasonable approach transition speed
                speed = Math.max(180, speed);
            }
            wp.additionalData.predictedSpeed = speed;
        });
        speed = Math.min(160, speed); // slow down a bit for approach
        this.getSegment(SegmentType.Approach).waypoints.forEach((wp) => {
            if ((wp.speedConstraint ?? -1) > 100) {
                speed = wp.speedConstraint;
            }
            wp.additionalData.predictedSpeed = speed;
        });
    }

    /**
     * Builds an approach into the flight plan from indexes in the arrival airport information.
     */
    public async buildApproach(): Promise<void> {
        const legs = [];
        const destination = this.destinationAirfield;

        const { approachIndex } = this.procedureDetails;
        const { approachTransitionIndex } = this.procedureDetails;
        const { destinationRunwayIndex } = this.procedureDetails;
        const { destinationRunwayExtension } = this.procedureDetails;

        const destinationInfo = destination.infos as AirportInfo;

        if (approachIndex !== -1 && approachTransitionIndex !== -1) {
            const transition = destinationInfo.approaches[approachIndex].transitions[approachTransitionIndex];
            legs.push(...transition.legs);
            // console.log('MFP: buildApproach - pushing approachTransition legs ->', legs);
        }

        if (approachIndex !== -1) {
            legs.push(...destinationInfo.approaches[approachIndex].finalLegs);
            // console.log('MFP: buildApproach - pushing final legs ->', legs);
        }

        let { _startIndex, segment } = this.truncateSegment(SegmentType.Approach);

        if (legs.length > 0 || approachIndex !== -1 || destinationRunwayIndex !== -1) {
            if (segment === FlightPlanSegment.Empty) {
                segment = this.addSegment(SegmentType.Approach);
                _startIndex = segment.offset;

                const prevWaypointIndex = segment.offset - 1;
                if (prevWaypointIndex > 0) {
                    const prevWaypoint = this.getWaypoint(segment.offset - 1);
                    if (!prevWaypoint.endsInDiscontinuity) {
                        prevWaypoint.endsInDiscontinuity = true;
                        prevWaypoint.discontinuityCanBeCleared = true;
                    }
                }
            }

            let runway: OneWayRunway;
            if (approachIndex !== -1) {
                runway = this.getRunway(destinationInfo.oneWayRunways, destinationInfo.approaches[approachIndex].runway);
            } else if (destinationRunwayIndex !== -1) {
                runway = destinationInfo.oneWayRunways[destinationRunwayIndex];
            }

            const procedure = new LegsProcedure(legs, this.getWaypoint(_startIndex - 1), this._parentInstrument);

            if (runway) {
                procedure.calculateApproachData(runway);
            }

            let waypointIndex = _startIndex;
            // console.log('MFP: buildApproach - ADDING WAYPOINTS ------------------------');
            while (procedure.hasNext()) {
                // eslint-disable-next-line no-await-in-loop
                const waypoint = await procedure.getNext().catch(console.error);

                if (waypoint !== undefined) {
                    // console.log('  ---- MFP: buildApproach: added waypoint', waypoint.ident, ' to segment ', segment);
                    this.addWaypointAvoidingDuplicates(waypoint, ++waypointIndex, segment);
                }
            }

            if (runway) {
                const selectedRunwayMod = runway.designation.slice(-1);
                let selectedRunwayOutput;
                if (selectedRunwayMod === 'L' || selectedRunwayMod === 'C' || selectedRunwayMod === 'R') {
                    if (runway.designation.length === 2) {
                        selectedRunwayOutput = `0${runway.designation}`;
                    } else {
                        selectedRunwayOutput = runway.designation;
                    }
                } else if (runway.designation.length === 2) {
                    selectedRunwayOutput = runway.designation;
                } else {
                    selectedRunwayOutput = `0${runway.designation}`;
                }
                if (approachIndex === -1 && destinationRunwayIndex !== -1 && destinationRunwayExtension !== -1) {
                    const runwayExtensionWaypoint = procedure.buildWaypoint(`RX${selectedRunwayOutput}`,
                        Avionics.Utils.bearingDistanceToCoordinates(runway.direction + 180, destinationRunwayExtension, runway.beginningCoordinates.lat, runway.beginningCoordinates.long));
                    this.addWaypoint(runwayExtensionWaypoint);
                }

                // When adding approach, edit destination waypoint
                this.destinationAirfield.infos.coordinates = runway.beginningCoordinates;
                this.destinationAirfield.legAltitudeDescription = 1;
                this.destinationAirfield.legAltitude1 = Math.round((runway.elevation * 3.28084 + 50) / 10) * 10;
                this.destinationAirfield.isRunway = true;

                // Clear discontinuity before destination, if any
                const wpBeforeDestIdx = this.waypoints.indexOf(this.destinationAirfield) - 1;
                if (wpBeforeDestIdx >= 0) {
                    const wpBeforeDest = this.getWaypoint(wpBeforeDestIdx);
                    if (wpBeforeDest.endsInDiscontinuity && wpBeforeDest.discontinuityCanBeCleared) {
                        wpBeforeDest.endsInDiscontinuity = false;
                    }
                }
            }
        }
        this.updateArrivalApproachSpeeds();
    }

    /**
     * Truncates a flight plan segment. If the active waypoint index is current in the segment,
     * a discontinuity will be added at the end of the active waypoint and the startIndex will
     * point to the next waypoint in the segment after the active.
     * @param type The type of segment to truncate.
     * @returns A segment to add to and a starting waypoint index.
     */
    public truncateSegment(type: SegmentType): { _startIndex: number, segment: FlightPlanSegment } {
        let segment = this.getSegment(type);
        // const startIndex = this.findSegmentByWaypointIndex(this.activeWaypointIndex) === segment
        //     ? this.activeWaypointIndex + 1
        //     : segment.offset;
        const startIndex = segment.offset;

        if (segment !== FlightPlanSegment.Empty) {
            const finalIndex = segment.offset + segment.waypoints.length;
            if (startIndex < finalIndex) {
                for (let i = startIndex; i < finalIndex; i++) {
                    // console.log(' MFP ---> truncateSegment: removing waypoint ', this.getWaypoint(startIndex).ident);
                    this.removeWaypoint(startIndex);
                }
            }
        }

        if (segment.waypoints.length === 0) {
            this.removeSegment(segment.type);
            segment = FlightPlanSegment.Empty;
        } else {
            const waypoint = segment.waypoints[Math.max((startIndex - 1) - segment.offset, 0)];
            waypoint.endsInDiscontinuity = true;
            waypoint.discontinuityCanBeCleared = true;
        }

        return { _startIndex: startIndex, segment };
    }

    /**
     * Converts a plain object into a ManagedFlightPlan.
     * @param flightPlanObject The object to convert.
     * @param parentInstrument The parent instrument attached to this flight plan.
     * @returns The converted ManagedFlightPlan.
     */
    public static fromObject(flightPlanObject: any, parentInstrument: BaseInstrument): ManagedFlightPlan {
        const plan = Object.assign(new ManagedFlightPlan(), flightPlanObject);
        plan.setParentInstrument(parentInstrument);

        plan.directTo = Object.assign(new DirectTo(), plan.directTo);

        const mapObject = (obj: any, parentType?: string): any => {
            if (obj && obj.infos) {
                obj = Object.assign(new WayPoint(parentInstrument), obj);
            }

            if (obj && obj.coordinates) {
                switch (parentType) {
                case 'A':
                    obj = Object.assign(new AirportInfo(parentInstrument), obj);
                    break;
                case 'W':
                    obj = Object.assign(new IntersectionInfo(parentInstrument), obj);
                    break;
                case 'V':
                    obj = Object.assign(new VORInfo(parentInstrument), obj);
                    break;
                case 'N':
                    obj = Object.assign(new NDBInfo(parentInstrument), obj);
                    break;
                default:
                    obj = Object.assign(new WayPointInfo(parentInstrument), obj);
                }

                obj.coordinates = Object.assign(new LatLongAlt(), obj.coordinates);
            }

            return obj;
        };

        const visitObject = (obj: any): any => {
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] && obj[key].scroll === undefined) {
                    if (Array.isArray(obj[key])) {
                        visitArray(obj[key]);
                    } else {
                        visitObject(obj[key]);
                    }

                    obj[key] = mapObject(obj[key], obj.type);
                }
            }
        };

        const visitArray = (array) => {
            array.forEach((item, index) => {
                if (Array.isArray(item)) {
                    visitArray(item);
                } else if (typeof item === 'object') {
                    visitObject(item);
                }

                array[index] = mapObject(item);
            });
        };

        visitObject(plan);
        return plan;
    }

    private addWaypointAvoidingDuplicates(waypoint: Waypoint, waypointIndex: number, segment: FlightPlanSegment): void {
        const index = this.waypoints.findIndex((wp) => wp.ident === waypoint.ident); // FIXME this should really compare icaos...

        // FIXME this should collapse any legs between the old position and the newly inserted position
        if (index !== -1 && (index === waypointIndex - 1 || index === waypointIndex + 1)) {
            // console.log('  -------> MFP: addWaypointAvoidingDuplicates: removing duplicate waypoint ', this.getWaypoint(index).ident);
            const removedWp = this.getWaypoint(index);
            if (waypoint.legAltitudeDescription === AltitudeDescriptor.Empty && removedWp.legAltitudeDescription !== AltitudeDescriptor.Empty) {
                waypoint.legAltitudeDescription = removedWp.legAltitudeDescription;
                waypoint.legAltitude1 = removedWp.legAltitude1;
                waypoint.legAltitude2 = removedWp.legAltitude2;
            }
            if (waypoint.speedConstraint <= 0 && removedWp.speedConstraint > 0) {
                waypoint.speedConstraint = removedWp.speedConstraint;
            }
            this.removeWaypoint(index);
        }
        this.addWaypoint(waypoint, waypointIndex, segment.type);
    }

    public getOriginRunway(): OneWayRunway | null {
        if (this.originAirfield) {
            if (this.procedureDetails.originRunwayIndex !== -1) {
                return this.originAirfield.infos.oneWayRunways[this.procedureDetails.originRunwayIndex];
            }
        }
        return null;
    }

    public getDestinationRunway(): OneWayRunway | null{
        if (this.destinationAirfield) {
            if (this.procedureDetails.arrivalRunwayIndex !== -1) {
                return this.destinationAirfield.infos.oneWayRunways[this.procedureDetails.destinationRunwayIndex];
            }
        }
        return null;
    }
}
