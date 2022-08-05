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

import { NXDataStore } from '@shared/persistence';
import { LegType, TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { FlightLevel } from '@fmgc/guidance/vnav/verticalFlightPlan/VerticalFlightPlan';
import { ManagedFlightPlan } from './ManagedFlightPlan';
import { GPS } from './GPS';
import { FlightPlanSegment } from './FlightPlanSegment';
import { FlightPlanAsoboSync } from './FlightPlanAsoboSync';
import { FixInfo } from './FixInfo';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { ApproachStats, HoldData } from '@fmgc/flightplanning/data/flightplan';
import { SegmentType } from '@fmgc/wtsdk';

export enum WaypointConstraintType {
    CLB = 1,
    DES = 2,
}

export enum FlightPlans {
    Active,
    Temporary,
}

/**
 * Navigation flight areas defined in the OPC database
 */
export enum FlightArea {
    Terminal,
    Takeoff,
    Enroute,
    Oceanic,
    VorApproach,
    GpsApproach,
    PrecisionApproach,
    NonPrecisionApproach,
}

/**
 * A system for managing flight plan data used by various instruments.
 */
export class FlightPlanManager {
    private _isRegistered = false;

    private _isMaster = false;

    private _isSyncPaused = false;

    private _currentFlightPlanVersion = 0;

    private __currentFlightPlanIndex = 0;

    public static DEBUG_INSTANCE: FlightPlanManager;

    public static FlightPlanKey = 'A32NX.FlightPlan';

    public static FlightPlanCompressedKey = 'A32NX.FlightPlan.Compressed';

    public static FlightPlanVersionKey = 'L:A32NX.FlightPlan.Version';

    public activeArea: FlightArea = FlightArea.Terminal;

    /**
     * The current stored flight plan data.
     * @type ManagedFlightPlan[]
     */
    private _flightPlans: ManagedFlightPlan[] = [];

    private _fixInfos: FixInfo[] = [];

    private updateThrottler = new A32NX_Util.UpdateThrottler(2000);

    /**
     * Constructs an instance of the FlightPlanManager with the provided
     * parent instrument attached.
     * @param parentInstrument The parent instrument attached to this FlightPlanManager.
     */
    constructor(public _parentInstrument: BaseInstrument) {
        this._currentFlightPlanVersion = SimVar.GetSimVarValue(FlightPlanManager.FlightPlanVersionKey, 'number');

        this._loadFlightPlans();

        if (_parentInstrument.instrumentIdentifier === 'A320_Neo_CDU') {
            this._isMaster = true;
            _parentInstrument.addEventListener('FlightStart', async () => {
                const plan = new ManagedFlightPlan();
                plan.setParentInstrument(_parentInstrument);
                this._flightPlans = [];
                this._flightPlans.push(plan);
                if (NXDataStore.get('FP_SYNC', 'LOAD') !== 'NONE') {
                    this.pauseSync();
                    await FlightPlanAsoboSync.LoadFromGame(this).catch(console.error);
                }
                this.resumeSync();
            });
            for (let i = 0; i < 4; i++) {
                this._fixInfos.push(new FixInfo(this));
            }
        }

        FlightPlanManager.DEBUG_INSTANCE = this;
    }

    public get _currentFlightPlanIndex() {
        return this.__currentFlightPlanIndex;
    }

    public set _currentFlightPlanIndex(value) {
        this.__currentFlightPlanIndex = value;
    }

    public update(deltaTime: number): void {
        if (this.updateThrottler.canUpdate(deltaTime) !== -1) {
            const tmpy = this._flightPlans[FlightPlans.Temporary];
            if (tmpy && this.__currentFlightPlanIndex === FlightPlans.Temporary) {
                if (tmpy.updateTurningPoint()) {
                    this.updateFlightPlanVersion();
                }
            }
        }

        this.updateActiveArea();
    }

    public onCurrentGameFlightLoaded(_callback: () => any) {
        _callback();
    }

    public registerListener() {
    }

    public addHardCodedConstraints(wp) {
    }

    /**
     * Loads sim flight plan data into WayPoint objects for consumption.
     * @param data The flight plan data to load.
     * @param currentWaypoints The waypoints array to modify with the data loaded.
     * @param callback A callback to call when the data has completed loading.
     */
    private _loadWaypoints(data: any, currentWaypoints: any, callback: () => void) {
    }

    /**
     * Updates the current active waypoint index from the sim.
     */
    public async updateWaypointIndex() {
        // const waypointIndex = await Coherent.call("GET_ACTIVE_WAYPOINT_INDEX");
        // this._activeWaypointIndex = waypointIndex;
    }

    /**
     * Scans for updates to the synchronized flight plan and loads them into the flight plan
     * manager if the flight plan is out of date.
     * @param {() => void} callback A callback to call when the update has completed.
     * @param {Boolean} log Whether or not to log the loaded flight plan value.
     */
    public updateFlightPlan(callback: () => void = () => { }, log = false, force = false): void {
        const flightPlanVersion = SimVar.GetSimVarValue(FlightPlanManager.FlightPlanVersionKey, 'number');
        if (flightPlanVersion !== this._currentFlightPlanVersion || force) {
            this._loadFlightPlans();
            this._currentFlightPlanVersion = flightPlanVersion;
        }

        callback();
    }

    /**
     * Loads the flight plans from data storage.
     */
    public _loadFlightPlans(): void {
        this._getFlightPlan();

        if (this._flightPlans.length === 0) {
            const newFpln = new ManagedFlightPlan();
            newFpln.setParentInstrument(this._parentInstrument);
            this._flightPlans.push(new ManagedFlightPlan());
        } else {
            this._flightPlans = this._flightPlans.map((fp) => ManagedFlightPlan.fromObject(fp, this._parentInstrument));
        }
    }

    public updateCurrentApproach(callback = () => { }, log = false): void {
        callback();
    }

    public get cruisingAltitude(): number {
        return 0;
    }

    public isCurrentFlightPlanTemporary(): boolean {
        return this.getCurrentFlightPlanIndex() === 1;
    }

    /**
     * Gets the index of the currently active flight plan.
     */
    public getCurrentFlightPlanIndex(): number {
        return this._currentFlightPlanIndex;
    }

    /**
     * Switches the active flight plan index to the supplied index.
     * @param index The index to now use for the active flight plan.
     * @param callback A callback to call when the operation has completed.
     */
    public setCurrentFlightPlanIndex(index: number, callback = EmptyCallback.Boolean): void {
        if (index >= 0 && index < this._flightPlans.length) {
            this._currentFlightPlanIndex = index;
            callback(true);
        } else {
            callback(false);
        }
    }

    /**
     * Creates a new flight plan.
     * @param callback A callback to call when the operation has completed.
     */
    public createNewFlightPlan(callback = EmptyCallback.Void): void {
        const newFlightPlan = new ManagedFlightPlan();
        newFlightPlan.setParentInstrument(this._parentInstrument);
        this._flightPlans.push(newFlightPlan);
        this.updateFlightPlanVersion().catch(console.error);

        callback();
    }

    /**
     * Copies the currently active flight plan into the specified flight plan index.
     * @param index The index to copy the currently active flight plan into.
     * @param callback A callback to call when the operation has completed.
     */
    public async copyCurrentFlightPlanInto(index: number, callback = EmptyCallback.Void): Promise<void> {
        const copiedFlightPlan = this._flightPlans[this._currentFlightPlanIndex].copy();
        const { activeWaypointIndex } = copiedFlightPlan;

        if (this._currentFlightPlanIndex === FlightPlans.Temporary && index === FlightPlans.Active) {
            copiedFlightPlan.waypoints.forEach((wp) => delete wp.additionalData.dynamicPpos);
        }

        this._flightPlans[index] = copiedFlightPlan;

        if (index === 0) {
            await GPS.setActiveWaypoint(activeWaypointIndex).catch(console.error);
        }

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    /**
     * Copies the flight plan at the specified index to the currently active flight plan index.
     * @param index The index to copy into the currently active flight plan.
     * @param callback A callback to call when the operation has completed.
     */
    public async copyFlightPlanIntoCurrent(index: number, callback = EmptyCallback.Void): Promise<void> {
        const copiedFlightPlan = this._flightPlans[index].copy();
        const { activeWaypointIndex } = copiedFlightPlan;

        this._flightPlans[this._currentFlightPlanIndex] = copiedFlightPlan;

        if (this._currentFlightPlanIndex === 0) {
            await GPS.setActiveWaypoint(activeWaypointIndex).catch(console.error);
        }

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    /**
     * Clears the currently active flight plan.
     * @param callback A callback to call when the operation has completed.
     */
    public async clearFlightPlan(callback = EmptyCallback.Void): Promise<void> {
        await this._flightPlans[this._currentFlightPlanIndex].clearPlan().catch(console.error);
        for (const fixInfo of this._fixInfos) {
            fixInfo.setRefFix();
        }
        this.updateFlightPlanVersion().catch(console.error);

        callback();
    }

    public async deleteFlightPlan(flightPlanIndex): Promise<void> {
        if (this._flightPlans[flightPlanIndex]) {
            delete this._flightPlans[flightPlanIndex];
        }
    }

    /**
     * Gets the origin of the currently active flight plan.
     */
    public getOrigin(flightPlanIndex = this._currentFlightPlanIndex): WayPoint | undefined {
        return this._flightPlans[flightPlanIndex].originAirfield;
    }

    /**
     * Gets the origin of the currently active flight plan, even after it has been cleared for a direct-to.
     */
    public getPersistentOrigin(flightPlanIndex = this._currentFlightPlanIndex): WayPoint | undefined {
        return this._flightPlans[flightPlanIndex].persistentOriginAirfield;
    }

    /**
     * Sets the origin in the currently active flight plan.
     * @param icao The ICAO designation of the origin airport.
     * @param callback A callback to call when the operation has completed.
     */
    public async setOrigin(icao: string, callback = () => { }): Promise<void> {
        const sameAirport = this.getOrigin()?.ident === icao;
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const airport = await this._parentInstrument.facilityLoader.getFacilityRaw(icao).catch(console.error);
        if (airport) {
            airport.additionalData = {};
            airport.additionalData.legType = LegType.IF;

            await currentFlightPlan.clearPlan().catch(console.error);
            await currentFlightPlan.addWaypoint(airport, 0);
            // clear pilot trans alt
            this.setOriginTransitionAltitude(undefined, false);
            // TODO get origin trans alt from database
            // until then, don't erase the database value from ATSU if same airport as before
            if (!sameAirport) {
                this.setOriginTransitionAltitude(undefined, true);
            }
            this.updateFlightPlanVersion().catch(console.error);
        }
        callback();
    }

    /**
     * Gets the index of the active waypoint in the flight plan.
     * @param forceSimVarCall Unused
     * @param useCorrection Unused
     */
    public getActiveWaypointIndex(forceSimVarCall = false, useCorrection = false, flightPlanIndex = NaN): number {
        if (isNaN(flightPlanIndex)) {
            return this._flightPlans[this._currentFlightPlanIndex].activeWaypointIndex;
        }

        return this._flightPlans[flightPlanIndex]?.activeWaypointIndex ?? -1;
    }

    public isActiveWaypointAtEnd(forceSimVarCall = false, useCorrection = false, flightPlanIndex = NaN): boolean {
        if (isNaN(flightPlanIndex)) {
            return this._flightPlans[this._currentFlightPlanIndex].activeWaypointIndex + 1 === this.getWaypointsCount(this._currentFlightPlanIndex) - 1;
        }
        return this._flightPlans[flightPlanIndex].activeWaypointIndex === this.getWaypointsCount(flightPlanIndex) - 1;
    }

    /**
     * Sets the index of the active waypoint in the flight plan.
     * @param index The index to make active in the flight plan.
     * @param callback A callback to call when the operation has completed.
     * @param fplnIndex The index of the flight plan
     */
    public setActiveWaypointIndex(index: number, callback = EmptyCallback.Void, fplnIndex = this._currentFlightPlanIndex): void {
        const currentFlightPlan = this._flightPlans[fplnIndex];
        // we allow the last leg to be sequenced therefore the index can be 1 past the end of the plan length
        if (index >= 0 && index <= currentFlightPlan.length) {
            currentFlightPlan.activeWaypointIndex = index;
            Coherent.call('SET_ACTIVE_WAYPOINT_INDEX', index + 1).catch(console.error);

            if (currentFlightPlan.directTo.isActive && currentFlightPlan.directTo.waypointIsInFlightPlan
                && currentFlightPlan.activeWaypointIndex > currentFlightPlan.directTo.planWaypointIndex) {
                currentFlightPlan.directTo.isActive = false;
            }
        }

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    /** Unknown */
    public recomputeActiveWaypointIndex(callback = EmptyCallback.Void): void {
        callback();
    }

    /**
     * Gets the index of the waypoint prior to the currently active waypoint.
     * @param forceSimVarCall Unused
     */
    public getPreviousActiveWaypoint(forceSimVarCall = false): WayPoint {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const previousWaypointIndex = currentFlightPlan.activeWaypointIndex - 1;

        return currentFlightPlan.getWaypoint(previousWaypointIndex);
    }

    /**
     * Gets the ident of the active waypoint.
     * @param forceSimVarCall Unused
     */
    public getActiveWaypointIdent(forceSimVarCall = false): string {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        if (currentFlightPlan.activeWaypoint) {
            return currentFlightPlan.activeWaypoint.ident;
        }

        return '';
    }

    /**
     * Gets the active waypoint index from fs9gps. Currently unimplemented.
     * @param forceSimVarCall Unused
     */
    public getGPSActiveWaypointIndex(forceSimVarCall = false): number {
        return this.getActiveWaypointIndex();
    }

    /**
     * Gets the active waypoint.
     * @param forceSimVarCall Unused
     * @param useCorrection Unused
     */
    public getActiveWaypoint(forceSimVarCall = false, useCorrection = false, flightPlanIndex = NaN): WayPoint {
        if (isNaN(flightPlanIndex)) {
            flightPlanIndex = this._currentFlightPlanIndex;
        }

        return this._flightPlans[flightPlanIndex].activeWaypoint;
    }

    /**
     * Gets the next waypoint following the active waypoint.
     * @param forceSimVarCall Unused
     */
    public getNextActiveWaypoint(forceSimVarCall = false): WayPoint {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const nextWaypointIndex = currentFlightPlan.activeWaypointIndex + 1;

        return currentFlightPlan.getWaypoint(nextWaypointIndex);
    }

    /**
     * Gets the distance, in NM, to the active waypoint.
     */
    public getDistanceToActiveWaypoint(): number {
        // TODO Replace with ADIRS getLatitude() getLongitude()
        const lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        const long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
        const ll = new LatLongAlt(lat, long);

        const waypoint = this.getActiveWaypoint();
        if (waypoint && waypoint.infos) {
            return Avionics.Utils.computeDistance(ll, waypoint.infos.coordinates);
        }

        return 0;
    }

    /**
     *
     * @param fplnIndex index of the flight plan of interest, default active fp
     * @returns distance in NM, or -1 on error
     */
    public getDistanceToDestination(fplnIndex: number = -1): number {
        if (fplnIndex < 0) {
            fplnIndex = this._currentFlightPlanIndex;
        }

        const destIndex = this.getDestinationIndex();
        if (destIndex < 0) {
            return -1;
        }

        // TODO get proper pos from FMGC
        const fmPos = {
            lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
            long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
        };

        const fpln = this._flightPlans[fplnIndex];
        const stats = fpln.computeWaypointStatistics(fmPos);

        return stats.get(destIndex)?.distanceFromPpos ?? -1;
    }

    public getApproachStats(): ApproachStats | undefined {
        const name = this.getApproach(FlightPlans.Active)?.name;
        if (!name) {
            return undefined;
        }

        const distanceFromPpos = this.getDistanceToDestination(FlightPlans.Active);

        return {
            name,
            distanceFromPpos,
        }
    }

    /**
     * Gets the bearing, in degrees, to the active waypoint.
     */
    public getBearingToActiveWaypoint(): number {
        // TODO Replace with ADIRS getLatitude() getLongitude()
        const lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        const long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
        const ll = new LatLongAlt(lat, long);

        const waypoint = this.getActiveWaypoint();
        if (waypoint && waypoint.infos) {
            return Avionics.Utils.computeGreatCircleHeading(ll, waypoint.infos.coordinates);
        }

        return 0;
    }

    /**
     * Gets the estimated time enroute to the active waypoint.
     */
    public getETEToActiveWaypoint(): number {
        // TODO Replace with ADIRS getLatitude() getLongitude()
        const lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        const long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
        const ll = new LatLongAlt(lat, long);

        const waypoint = this.getActiveWaypoint();
        if (waypoint && waypoint.infos) {
            const dist = Avionics.Utils.computeDistance(ll, waypoint.infos.coordinates);
            let groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
            if (groundSpeed < 50) {
                groundSpeed = 50;
            }
            if (groundSpeed > 0.1) {
                return dist / groundSpeed * 3600;
            }
        }

        return 0;
    }

    /**
     * Gets the destination airfield of the current flight plan, if any.
     */
    public getDestination(flightPlanIndex = this._currentFlightPlanIndex): WayPoint | undefined {
        return this._flightPlans[flightPlanIndex].destinationAirfield;
    }

    /**
     * Gets the index of the destination airfield in the current flight plan, if any
     * @param flightPlanIndex flight plan index
     * @returns Index of destination
     */
    public getDestinationIndex(): number {
        if (this.getDestination()) {
            return this.getWaypointsCount() - 1;
        }
        return -1;
    }

    /**
     * Gets the currently selected departure information for the current flight plan.
     */
    public getDeparture(flightPlanIndex = NaN): WayPoint | undefined {
        const origin = this.getOrigin();
        if (isNaN(flightPlanIndex)) {
            flightPlanIndex = this._currentFlightPlanIndex;
        }
        const currentFlightPlan = this._flightPlans[flightPlanIndex];

        if (origin) {
            const originInfos = origin.infos as AirportInfo;
            if (originInfos.departures !== undefined && currentFlightPlan.procedureDetails.departureIndex !== -1) {
                return originInfos.departures[currentFlightPlan.procedureDetails.departureIndex];
            }
        }

        return undefined;
    }

    /**
     * Gets the currently selected departure information for the current flight plan, even after a direct-to.
     */
    public getDepartureName(): string | undefined {
        const origin = this.getPersistentOrigin();
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (origin) {
            const originInfos = origin.infos as AirportInfo;
            if (originInfos.departures !== undefined && currentFlightPlan.procedureDetails.departureIndex !== -1) {
                return originInfos.departures[currentFlightPlan.procedureDetails.departureIndex].name;
            }
        }

        return undefined;
    }

    /**
     * Gets the currently selected arrival information for the current flight plan.
     */
    public getArrival(): any | undefined {
        const destination = this.getDestination();
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (destination) {
            const originInfos = destination.infos as AirportInfo;
            if (originInfos.arrivals !== undefined && currentFlightPlan.procedureDetails.arrivalIndex !== -1) {
                return originInfos.arrivals[currentFlightPlan.procedureDetails.arrivalIndex];
            }
        }

        return undefined;
    }

    /**
     * Gets the currently selected approach information for the current flight plan.
     */
    public getAirportApproach(): any | undefined {
        const destination = this.getDestination();
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (destination) {
            const originInfos = destination.infos as AirportInfo;
            if (originInfos.approaches !== undefined && currentFlightPlan.procedureDetails.approachIndex !== -1) {
                return originInfos.approaches[currentFlightPlan.procedureDetails.approachIndex];
            }
        }

        return undefined;
    }

    /**
     * Gets the departure waypoints for the current flight plan.
     */
    public getDepartureWaypoints(): WayPoint[] {
        return this._flightPlans[this._currentFlightPlanIndex].departure.waypoints;
    }

    /**
     * Gets a map of the departure waypoints (?)
     */
    public getDepartureWaypointsMap(): WayPoint[] {
        return this._flightPlans[this._currentFlightPlanIndex].departure.waypoints;
    }

    /**
     * Gets the enroute waypoints for the current flight plan.
     * @param outFPIndex An array of waypoint indexes to be pushed to.
     */
    public getEnRouteWaypoints(outFPIndex: number[]): WayPoint[] {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const enrouteSegment = currentFlightPlan.enroute;

        if (enrouteSegment !== FlightPlanSegment.Empty) {
            for (let i = 0; i < enrouteSegment.waypoints.length; i++) {
                outFPIndex.push(enrouteSegment.offset + i);
            }
        }

        return enrouteSegment.waypoints;
    }

    /**
     * Gets the index of the last waypoint in the enroute segment of the current flight plan.
     */
     public getEnRouteWaypointsFirstIndex(flightPlanIndex = this._currentFlightPlanIndex): number | null {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        const enrouteSegment = currentFlightPlan?.enroute;

        return enrouteSegment?.offset;
    }

    /**
     * Gets the index of the last waypoint in the enroute segment of the current flight plan.
     */
    public getEnRouteWaypointsLastIndex(flightPlanIndex = this._currentFlightPlanIndex): number | null {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        const enrouteSegment = currentFlightPlan?.enroute;

        return enrouteSegment ? enrouteSegment.offset + (enrouteSegment.waypoints.length - 1) : null;
    }

    /**
     * Gets the arrival waypoints for the current flight plan.
     */
    public getArrivalWaypoints(): WayPoint[] {
        return this._flightPlans[this._currentFlightPlanIndex].arrival.waypoints;
    }

    /**
     * Gets the arrival waypoints for the current flight plan as a map. (?)
     */
    public getArrivalWaypointsMap(): WayPoint[] {
        return this._flightPlans[this._currentFlightPlanIndex].arrival.waypoints;
    }

    /**
     * Gets the waypoints for the current flight plan with altitude constraints.
     */
    public getWaypointsWithAltitudeConstraints(): WayPoint[] {
        return this._flightPlans[this._currentFlightPlanIndex].waypoints;
    }

    /**
     * Gets the flight plan segment for a flight plan waypoint.
     * @param waypoint The waypoint we want to find the segment for.
     */
    public getSegmentFromWaypoint(waypoint: WayPoint | undefined, flightPlanIndex = NaN): FlightPlanSegment {
        if (isNaN(flightPlanIndex)) {
            flightPlanIndex = this._currentFlightPlanIndex;
        }

        const index = waypoint === undefined ? this.getActiveWaypointIndex() : this.indexOfWaypoint(waypoint);
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        return currentFlightPlan.findSegmentByWaypointIndex(index);
    }

    /**
     * Sets the destination for the current flight plan.
     * @param icao The ICAO designation for the destination airfield.
     * @param callback A callback to call once the operation completes.
     */
    public async setDestination(icao: string, callback = () => { }): Promise<void> {
        const sameAirport = this.getDestination()?.ident === icao;
        const waypoint = await this._parentInstrument.facilityLoader.getFacilityRaw(icao);
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const destinationIndex = currentFlightPlan.length - 1;

        if (currentFlightPlan.hasDestination) {
            currentFlightPlan.removeWaypoint(destinationIndex);
        }
        currentFlightPlan.addWaypoint(waypoint);

        // make the waypoint before a discontinuity
        /*
        const { waypoints } = currentFlightPlan;
        if (waypoints.length > 0 && destinationIndex > 0) {
            const previous = currentFlightPlan.waypoints[destinationIndex - 1];
            // ensure we do not overwrite a possible discontinuityCanBeCleared
            if (!previous.endsInDiscontinuity) {
                previous.endsInDiscontinuity = true;
                previous.discontinuityCanBeCleared = true;
            }
        }
        */

        // clear pilot trans level
        this.setDestinationTransitionLevel(undefined, false);
        // TODO get destination trans level from database
        // until then, don't erase the database value from ATSU if same airport as before
        if (!sameAirport) {
            this.setDestinationTransitionLevel(undefined, true);
        }

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    /**
     * Adds a waypoint to the current flight plan.
     * @param icao The ICAO designation for the waypoint.
     * @param index The index of the waypoint to add.
     * @param callback A callback to call once the operation completes.
     * @param setActive Whether or not to set the added waypoint as active immediately.
     */
    public async addWaypoint(icao: string, index = Infinity, callback = () => { }, setActive = true): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const waypoint = await this._parentInstrument.facilityLoader.getFacilityRaw(icao)
            .catch((e) => {
                console.log(`addWaypoint: [${icao}] Error`);
                console.error(e);
            });
        if (waypoint) {
            currentFlightPlan.addWaypoint(waypoint, index);
            if (setActive) {
                // currentFlightPlan.activeWaypointIndex = index;
            }
            this.updateFlightPlanVersion().catch(console.error);
            callback();
        }
    }

    /**
     * Adds a user waypoint to the current flight plan.
     * @param waypoint The user waypoint to add.
     * @param index The index to add the waypoint at in the flight plan.
     * @param callback A callback to call once the operation completes.
     */
    public async addUserWaypoint(waypoint: WayPoint, index = Infinity, callback = () => { }): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        currentFlightPlan.addWaypoint(waypoint, index);

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    public setLegAltitudeDescription(waypoint: WayPoint, code: number, callback = () => { }): void {
        if (waypoint) {
            waypoint.legAltitudeDescription = code;
            this.updateFlightPlanVersion().catch(console.error);
        }
        callback();
    }

    /**
     * Sets the altitude constraint for a waypoint in the current flight plan.
     * @param altitude The altitude to set for the waypoint.
     * @param index The index of the waypoint to set.
     * @param callback A callback to call once the operation is complete.
     * @param isDescentConstraint For enroute waypoints, indicates whether constraint is a descent or climb constraint
     */
    public setWaypointAltitude(altitude: number, index: number, callback = () => { }, isDescentConstraint?: boolean): void {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const waypoint = currentFlightPlan.getWaypoint(index);

        if (waypoint) {
            waypoint.legAltitude1 = altitude;
            if (isDescentConstraint !== undefined && !waypoint.additionalData.constraintType) {
                // this propagates through intermediate waypoints
                if (isDescentConstraint) {
                    this.setFirstDesConstraintWaypoint(index);
                } else {
                    this.setLastClbConstraintWaypoint(index);
                }
            }
            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Sets the speed constraint for a waypoint in the current flight plan.
     * @param speed The speed to set for the waypoint.
     * @param index The index of the waypoint to set.
     * @param callback A callback to call once the operation is complete.
     * @param isDescentConstraint For enroute waypoints, indicates whether constraint is a descent or climb constraint
     */
    public setWaypointSpeed(speed: number, index: number, callback = () => { }, isDescentConstraint?: boolean): void {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const waypoint = currentFlightPlan.getWaypoint(index);
        if (waypoint) {
            waypoint.speedConstraint = speed;
            // this propagates through intermediate waypoints
            if (isDescentConstraint) {
                this.setFirstDesConstraintWaypoint(index);
            } else {
                this.setLastClbConstraintWaypoint(index);
            }
            this.updateFlightPlanVersion();
        }
        callback();
    }

    private setLastClbConstraintWaypoint(index: number) {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        for (let i = index; i >= 0; i--) {
            const waypoint = currentFlightPlan.getWaypoint(i);
            if (waypoint) {
                waypoint.additionalData.constraintType = WaypointConstraintType.CLB;
            }
        }
    }

    private setFirstDesConstraintWaypoint(index: number) {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        for (let i = index; i < this.getWaypointsCount(); i++) {
            const waypoint = currentFlightPlan.getWaypoint(i);
            if (waypoint) {
                waypoint.additionalData.constraintType = WaypointConstraintType.DES;
            }
        }
    }

    /**
     * Sets additional data on a waypoint in the current flight plan.
     * @param index The index of the waypoint to set additional data for.
     * @param key The key of the data.
     * @param value The value of the data.
     * @param callback A callback to call once the operation is complete.
     */
    public setWaypointAdditionalData(index: number, key: string, value: any, callback = () => { }): void {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const waypoint = currentFlightPlan.getWaypoint(index);

        if (waypoint) {
            waypoint.additionalData[key] = value;
            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Gets additional data on a waypoint in the current flight plan.
     * @param index The index of the waypoint to set additional data for.
     * @param key The key of the data.
     * @param callback A callback to call with the value once the operation is complete.
     */
    public getWaypointAdditionalData(index: number, key: string, callback: (any) => void = () => { }) {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const waypoint = currentFlightPlan.getWaypoint(index);

        if (waypoint) {
            callback(waypoint.additionalData[key]);
        } else {
            callback(undefined);
        }
    }

    /**
     * Reverses the currently active flight plan.
     * @param {() => void} callback A callback to call when the operation is complete.
     */
    public invertActiveFlightPlan(callback = () => { }): void {
        this._flightPlans[this._currentFlightPlanIndex].reverse();

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    /**
     * Not sure what this is supposed to do.
     * @param callback Stuff?
     */
    public getApproachIfIcao(callback: (any) => void = () => { }): void {
        callback(this.getApproach());
    }

    /**
     * Unused
     * @param {*} _callback Unused
     */
    public addFlightPlanUpdateCallback(_callback) {
    }

    /**
     * Adds a waypoint to the currently active flight plan by ident(?)
     * @param ident The ident of the waypoint.
     * @param index The index to add the waypoint at.
     * @param callback A callback to call when the operation finishes.
     */
    public addWaypointByIdent(ident: string, index: number, callback = EmptyCallback.Void): void {
        this.addWaypoint(ident, index, callback).catch(console.error);
    }

    /**
     * Removes a waypoint from the currently active flight plan.
     * @param index The index of the waypoint to remove.
     * @param noDiscontinuity Don't create a discontinuity
     * @param callback A callback to call when the operation finishes.
     */
    public removeWaypoint(index: number, noDiscontinuity = false, callback = () => { }): void {
        this._flightPlans[this._currentFlightPlanIndex].removeWaypoint(index, noDiscontinuity);

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    addWaypointOverfly(index: number, thenSetActive = false, callback = () => { }): void {
        this._flightPlans[this._currentFlightPlanIndex].setWaypointOverfly(index, true);

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    removeWaypointOverfly(index: number, thenSetActive = false, callback = () => { }): void {
        this._flightPlans[this._currentFlightPlanIndex].setWaypointOverfly(index, false);

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    addOrEditManualHold(
        index: number,
        desiredHold: HoldData,
        modifiedHold: HoldData,
        defaultHold: HoldData,
    ): number {
        const holdIndex = this._flightPlans[this._currentFlightPlanIndex].addOrEditManualHold(
            index,
            desiredHold,
            modifiedHold,
            defaultHold,
        );

        this.updateFlightPlanVersion().catch(console.error);
        return holdIndex;
    }

    /**
     * Truncates a flight plan after a specific waypoint.
     * @param index The index of the first waypoint to remove.
     * @param callback A callback to call when the operation finishes.
     */
    public truncateWaypoints(index: number, thenSetActive = false, callback = () => { }): void {
        const fp = this._flightPlans[this._currentFlightPlanIndex];
        for (let i = fp.length; i >= index; i--) {
            fp.removeWaypoint(index);
        }

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    /**
     * Gets the index of a given waypoint in the current flight plan.
     * @param waypoint The waypoint to get the index of.
     */
    public indexOfWaypoint(waypoint: WayPoint): number {
        return this._flightPlans[this._currentFlightPlanIndex].waypoints.indexOf(waypoint);
    }

    /**
     * Gets the number of waypoints in a flight plan.
     * @param flightPlanIndex The index of the flight plan. If omitted, will get the current flight plan.
     */
    public getWaypointsCount(flightPlanIndex = NaN): number {
        if (isNaN(flightPlanIndex)) {
            return this._flightPlans[this._currentFlightPlanIndex]?.length ?? 0;
        }

        return this._flightPlans[flightPlanIndex]?.length ?? 0;
    }

    /**
     * Gets a count of the number of departure waypoints in the current flight plan.
     */
    public getDepartureWaypointsCount(): number {
        return this._flightPlans[this._currentFlightPlanIndex].departure.waypoints.length;
    }

    /**
     * Gets a count of the number of arrival waypoints in the current flight plan.
     */
    public getArrivalWaypointsCount(): number {
        return this._flightPlans[this._currentFlightPlanIndex].arrival.waypoints.length;
    }

    /**
     * Gets a waypoint from a flight plan.
     * @param index The index of the waypoint to get.
     * @param flightPlanIndex The index of the flight plan to get the waypoint from. If omitted, will get from the current flight plan.
     * @param considerApproachWaypoints Whether or not to consider approach waypoints.
     */
    public getWaypoint(index: number, flightPlanIndex = NaN, considerApproachWaypoints = false): WayPoint {
        if (isNaN(flightPlanIndex)) {
            flightPlanIndex = this._currentFlightPlanIndex;
        }

        return this._flightPlans[flightPlanIndex].getWaypoint(index);
    }

    /**
     * Gets all non-approach waypoints from a flight plan.
     *
     * @param flightPlanIndex The index of the flight plan to get the waypoints from. If omitted, will get from the current flight plan.
     */
    public getWaypoints(flightPlanIndex = NaN): WayPoint[] {
        if (isNaN(flightPlanIndex)) {
            flightPlanIndex = this._currentFlightPlanIndex;
        }

        return this._flightPlans[flightPlanIndex].nonApproachWaypoints;
    }

    /**
     * Gets all waypoints from a flight plan.
     * @param flightPlanIndex The index of the flight plan to get the waypoints from. If omitted, will get from the current flight plan.
     */
    public getAllWaypoints(flightPlanIndex?: number): WayPoint[] {
        if (flightPlanIndex === undefined) {
            flightPlanIndex = this._currentFlightPlanIndex;
        }

        return this._flightPlans[flightPlanIndex].waypoints;
    }

    /**
     * Gets the departure runway index, based on the departure in a flight plan.
     */
    public getDepartureRunwayIndex(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        if (currentFlightPlan.hasOrigin) {
            return currentFlightPlan.procedureDetails.departureRunwayIndex;
        }

        return -1;
    }

    /**
     * Gets the index value of the origin runway (oneWayRunways) in a flight plan.
     */
    public getOriginRunwayIndex(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.procedureDetails.originRunwayIndex !== -1 && currentFlightPlan.originAirfield) {
            return currentFlightPlan.procedureDetails.originRunwayIndex;
        }
        return -1;
    }

    /**
     * Gets the string value of the departure runway in the current flight plan.
     */
    public getOriginRunway(): OneWayRunway {
        const runwayIndex = this.getOriginRunwayIndex();
        if (runwayIndex !== -1) {
            return this.getOrigin().infos.oneWayRunways[runwayIndex];
        }
        return undefined;
    }

    /**
     * Gets the best runway based on the current plane heading.
     */
    public getDetectedCurrentRunway(): OneWayRunway {
        const origin = this.getOrigin();

        if (origin && origin.infos instanceof AirportInfo) {
            const runways = origin.infos.oneWayRunways;

            if (runways && runways.length > 0) {
                const direction = Simplane.getHeadingMagnetic();
                let bestRunway = runways[0];
                let bestDeltaAngle = Math.abs(Avionics.Utils.diffAngle(direction, bestRunway.direction));

                for (let i = 1; i < runways.length; i++) {
                    const deltaAngle = Math.abs(Avionics.Utils.diffAngle(direction, runways[i].direction));
                    if (deltaAngle < bestDeltaAngle) {
                        bestDeltaAngle = deltaAngle;
                        bestRunway = runways[i];
                    }
                }

                return bestRunway;
            }
        }
        return undefined;
    }

    /**
     * Gets the departure procedure index for the current flight plan.
     */
    public getDepartureProcIndex(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        return currentFlightPlan.procedureDetails.departureIndex;
    }

    /**
     * Sets the departure procedure index for the current flight plan.
     * @param index The index of the departure procedure in the origin airport departures information.
     * @param callback A callback to call when the operation completes.
     */
    public async setDepartureProcIndex(index: number, callback = () => { }): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.procedureDetails.departureIndex !== index) {
            currentFlightPlan.procedureDetails.departureIndex = index;
            await currentFlightPlan.buildDeparture().catch(console.error);

            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Sets the departure runway index for the current flight plan.
     * @param index The index of the runway in the origin airport runway information.
     * @param callback A callback to call when the operation completes.
     */
    public async setDepartureRunwayIndex(index: number, callback = EmptyCallback.Void): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.procedureDetails.departureRunwayIndex !== index) {
            currentFlightPlan.procedureDetails.departureRunwayIndex = index;
            await currentFlightPlan.buildDeparture().catch(console.error);

            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Sets the origin runway index for the current flight plan.
     * @param index The index of the runway in the origin airport runway information.
     * @param callback A callback to call when the operation completes.
     */
    public async setOriginRunwayIndex(index: number, callback = EmptyCallback.Void): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        if (currentFlightPlan.procedureDetails.originRunwayIndex !== index) {
            currentFlightPlan.procedureDetails.originRunwayIndex = index;
            await currentFlightPlan.buildDeparture().catch(console.error);

            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    public async setOriginRunwayIndexFromDeparture() {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.hasOrigin
            && currentFlightPlan.procedureDetails.departureRunwayIndex !== -1
            && currentFlightPlan.procedureDetails.departureIndex !== -1
            && currentFlightPlan.originAirfield
        ) {

            const transition = (currentFlightPlan.originAirfield.infos as AirportInfo)
                .departures[currentFlightPlan.procedureDetails.departureIndex]
                .runwayTransitions[currentFlightPlan.procedureDetails.departureRunwayIndex];
            const runways = (currentFlightPlan.originAirfield.infos as AirportInfo).oneWayRunways;
            await this.setOriginRunwayIndex(runways.findIndex(r => r.number === transition.runwayNumber && r.designator === transition.runwayDesignation));
        }
    }

    /**
     * Gets the departure transition index for the current flight plan.
     */
    public getDepartureEnRouteTransitionIndex(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        return currentFlightPlan.procedureDetails.departureTransitionIndex;
    }

    /**
     * Sets the departure transition index for the current flight plan.
     * @param index The index of the departure transition to select.
     * @param callback A callback to call when the operation completes.
     */
    public async setDepartureEnRouteTransitionIndex(index: number, callback = EmptyCallback.Void): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.procedureDetails.departureTransitionIndex !== index) {
            currentFlightPlan.procedureDetails.departureTransitionIndex = index;
            await currentFlightPlan.buildDeparture().catch(console.error);

            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Unused
     */
    public getDepartureDiscontinuity() {
    }

    /**
     * Unused
     * @param callback A callback to call when the operation completes.
     */
    public clearDepartureDiscontinuity(callback = EmptyCallback.Void) {
        callback();
    }

    /**
     * Removes the departure from the currently active flight plan.
     * @param callback A callback to call when the operation completes.
     */
    public async removeDeparture(callback = () => { }): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        currentFlightPlan.procedureDetails.departureIndex = -1;
        await currentFlightPlan.buildDeparture().catch(console.error);

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    /**
     * Gets the arrival procedure index in the currenly active flight plan.
     */
    public getArrivalProcIndex(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        if (currentFlightPlan.hasDestination && currentFlightPlan.procedureDetails.arrivalIndex !== -1) {
            return currentFlightPlan.procedureDetails.arrivalIndex;
        }

        return -1;
    }

    /**
     * Gets the arrival transition procedure index in the currently active flight plan.
     */
    public getArrivalTransitionIndex(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        return currentFlightPlan.procedureDetails.arrivalTransitionIndex;
    }

    /**
     * Sets the arrival procedure index for the current flight plan.
     * @param {Number} index The index of the arrival procedure to select.
     * @param {() => void} callback A callback to call when the operation completes.
     */
    public async setArrivalProcIndex(index, callback = () => { }) {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.procedureDetails.arrivalIndex !== index) {
            // console.log('FPM: setArrivalProcIndex: SET STAR ', currentFlightPlan.destinationAirfield.infos.arrivals[index].name);
            currentFlightPlan.procedureDetails.arrivalTransitionIndex = -1;
            currentFlightPlan.procedureDetails.arrivalIndex = index;
            currentFlightPlan.procedureDetails.approachTransitionIndex = -1;

            await currentFlightPlan.rebuildArrivalApproach();

            this.updateFlightPlanVersion().catch(console.error);
        }

        // TODO check for transition level coded in procedure...
        // pick higher of procedure or destination airfield trans fl

        callback();
    }

    /**
     * Unused
     */
    public getArrivalDiscontinuity() {
    }

    /**
     * Unused
     * @param {*} callback
     */
    public clearArrivalDiscontinuity(callback = EmptyCallback.Void) {
        callback();
    }

    /**
     * Clears a discontinuity from the end of a waypoint.
     * @param index
     */
    public clearDiscontinuity(index: number): boolean {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        const waypoint = currentFlightPlan.getWaypoint(index);
        const nextWaypoint = currentFlightPlan.getWaypoint(index + 1);

        if (waypoint !== undefined && nextWaypoint !== undefined && waypoint.discontinuityCanBeCleared) {
            waypoint.endsInDiscontinuity = false;
            switch (nextWaypoint.additionalData.legType) {
            case LegType.FA:
            case LegType.FC:
            case LegType.FD:
            case LegType.FM:
            case LegType.HA:
            case LegType.HF:
            case LegType.HM:
            case LegType.PI:
                this.addWaypointByIdent(nextWaypoint.icao, index + 1, () => this.updateFlightPlanVersion().catch(console.error));
                break;
            default:
                this.updateFlightPlanVersion().catch(console.error);
            }

            return true;
        }

        this.updateFlightPlanVersion().catch(console.error);
        return false;
    }

    /**
     * Sets the arrival transition index for the current flight plan.
     * @param {Number} index The index of the arrival transition to select.
     * @param {() => void} callback A callback to call when the operation completes.
     */
    public async setArrivalEnRouteTransitionIndex(index, callback = () => { }): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        // console.log('FPM: setArrivalEnRouteTransitionIndex: SET TRANSITION - ARRIVAL',
        // currentFlightPlan.destinationAirfield.infos.arrivals[currentFlightPlan.procedureDetails.arrivalIndex].enRouteTransitions[index].name);

        if (currentFlightPlan.procedureDetails.arrivalTransitionIndex !== index) {
            currentFlightPlan.procedureDetails.arrivalTransitionIndex = index;
            await currentFlightPlan.rebuildArrivalApproach();

            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Sets the arrival runway index in the currently active flight plan.
     * @param {Number} index The index of the runway to select.
     * @param {() => void} callback A callback to call when the operation completes.
     */
    public async setArrivalRunwayIndex(index, callback = () => { }): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.procedureDetails.arrivalRunwayIndex !== index) {
            /* if (currentFlightPlan.procedureDetails.arrivalIndex >= 0) {
                console.log(`setArrivalRunwayIndex: Finishing at
                ${currentFlightPlan.destinationAirfield.infos.arrivals[currentFlightPlan.procedureDetails.arrivalIndex].runwayTransitions[index].name}`);
            } else {
                console.log('setArrivalRunwayIndex: Finishing at none');
            } */
            currentFlightPlan.procedureDetails.arrivalRunwayIndex = index;
            await currentFlightPlan.rebuildArrivalApproach();

            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Sets the destination runway index in the currently active flight plan.
     * @param index The index of the runway to select.
     * @param runwayExtension The length of the runway extension fix to create, or -1 if none.
     * @param callback A callback to call when the operation completes.
     */
    public async setDestinationRunwayIndex(index: number, runwayExtension = -1, callback: () => void = () => { }): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        // console.log('setDestinationRunwayIndex - APPROACH');

        if (currentFlightPlan.procedureDetails.destinationRunwayIndex !== index
            || currentFlightPlan.procedureDetails.destinationRunwayExtension !== runwayExtension) {
            currentFlightPlan.procedureDetails.destinationRunwayIndex = index;
            currentFlightPlan.procedureDetails.destinationRunwayExtension = runwayExtension;

            await currentFlightPlan.buildApproach().catch(console.error);
            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Sets the destination runway index using the current selected approach
     */
    public async setDestinationRunwayIndexFromApproach() {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.hasDestination && currentFlightPlan.procedureDetails.approachIndex !== -1) {
            console.error('Destination runway index is -1 with valid STAR');
            const approach = (currentFlightPlan.destinationAirfield.infos as AirportInfo).approaches[currentFlightPlan.procedureDetails.approachIndex];
            const destRunways = (currentFlightPlan.destinationAirfield.infos as AirportInfo).oneWayRunways;

            await this.setDestinationRunwayIndex(destRunways.findIndex(r => r.number === approach.runwayNumber && r.designator === approach.runwayDesignator));
        }
    }

    /**
     * Gets the index of the approach in the currently active flight plan.
     */
    public getApproachIndex(): number {
        return this._flightPlans[this._currentFlightPlanIndex].procedureDetails.approachIndex;
    }

    /**
     * Sets the approach index in the currently active flight plan.
     * @param index The index of the approach in the destination airport information.
     * @param callback A callback to call when the operation has completed.
     * @param transition The approach transition index to set in the approach information.
     */
    public async setApproachIndex(index: number, callback = () => { }, transition = -1): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        // console.log(currentFlightPlan);

        if (currentFlightPlan.procedureDetails.approachIndex !== index) {
            // console.log('FPM: setApproachIndex - APPROACH', currentFlightPlan.destinationAirfield.infos.approaches[index].name);
            currentFlightPlan.procedureDetails.approachIndex = index;
            currentFlightPlan.procedureDetails.approachTransitionIndex = -1;
            currentFlightPlan.procedureDetails.arrivalIndex = -1;
            currentFlightPlan.procedureDetails.arrivalTransitionIndex = -1;
            await currentFlightPlan.rebuildArrivalApproach();

            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Whether or not an approach is loaded in the current flight plan.
     * @param forceSimVarCall Unused
     */
    public isLoadedApproach(forceSimVarCall = false): boolean {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        return currentFlightPlan.procedureDetails.approachIndex !== -1;
    }

    /**
     * Whether or not the approach is active in the current flight plan.
     * @param forceSimVarCall Unused
     */
    public isActiveApproach(forceSimVarCall = false): boolean {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        return currentFlightPlan.approach.waypoints.length > 0
            && currentFlightPlan.activeWaypointIndex >= currentFlightPlan.approach.offset;
    }

    /**
     * Activates the approach segment in the current flight plan.
     * @param {() => void} callback
     */
    public async activateApproach(callback = EmptyCallback.Void): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        if (!this.isActiveApproach() && currentFlightPlan.approach.offset >= 0) {
            await GPS.setActiveWaypoint(currentFlightPlan.approach.offset).catch(console.error);
        }

        callback();
    }

    /**
     * Deactivates the approach segments in the current flight plan.
     */
    public deactivateApproach() {
    }

    /**
     * Attemptes to auto-activate the approach in the current flight plan.
     */
    public tryAutoActivateApproach() {
    }

    /**
     * Gets the index of the active waypoint on the approach in the current flight plan.
     */
    public getApproachActiveWaypointIndex() {
        return this._flightPlans[this._currentFlightPlanIndex].activeWaypointIndex;
    }

    /**
     * Gets the approach procedure from the current flight plan destination airport procedure information.
     */
    public getApproach(flightPlanIndex = this._currentFlightPlanIndex): RawApproach {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        if (currentFlightPlan.hasDestination && currentFlightPlan.procedureDetails.approachIndex !== -1) {
            return (currentFlightPlan.destinationAirfield.infos as AirportInfo).approaches[currentFlightPlan.procedureDetails.approachIndex];
        }

        return undefined;
    }

    /**
     * Gets the index of the approach transition in the current flight plan.
     */
    public getApproachTransitionIndex(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        return currentFlightPlan.procedureDetails.approachTransitionIndex;
    }

    /**
     * Gets the last waypoint index before the start of the approach segment in
     * the current flight plan.
     */
    public getLastIndexBeforeApproach(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        // TODO: if we have an approach return last index
        if (currentFlightPlan.approach !== FlightPlanSegment.Empty) {
            return currentFlightPlan.approach.offset - 1;
        }
        return this.getWaypointsCount();
    }

    /**
     * Gets the destination runway from the current flight plan.
     */
    public getDestinationRunway(): OneWayRunway {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        const runwayIndex = this.getDestinationRunwayIndex();
        if (runwayIndex !== -1) {
            return (currentFlightPlan.destinationAirfield.infos as AirportInfo).oneWayRunways[runwayIndex];
        }
        return undefined;
    }

    /**
     * Gets the destination runway index (oneWayRunways) from the current flight plan.
     */
    public getDestinationRunwayIndex(): number {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        if (currentFlightPlan.procedureDetails.destinationRunwayIndex !== -1 && currentFlightPlan.destinationAirfield) {
            return currentFlightPlan.procedureDetails.destinationRunwayIndex;
        }

        if (currentFlightPlan.hasDestination && currentFlightPlan.procedureDetails.approachIndex !== -1) {
            console.error('Destination runway index is -1 with valid STAR');
            const approach = (currentFlightPlan.destinationAirfield.infos as AirportInfo).approaches[currentFlightPlan.procedureDetails.approachIndex];
            const runways = (currentFlightPlan.destinationAirfield.infos as AirportInfo).oneWayRunways;

            return runways.findIndex(r => r.number === approach.runwayNumber && r.designator === approach.runwayDesignator);
        }
        return -1;
    }

    /**
     * Gets the approach waypoints for the current flight plan.
     */
    public getApproachWaypoints(): WayPoint[] {
        return this._flightPlans[this._currentFlightPlanIndex].approach.waypoints;
    }

    /**
     * Sets the approach transition index for the current flight plan.
     * @param index The index of the transition in the destination airport approach information.
     * @param callback A callback to call when the operation completes.
     */
    public async setApproachTransitionIndex(index: number, callback = () => { }): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        // console.log('setApproachTransitionIndex - APPROACH');

        if (currentFlightPlan.procedureDetails.approachTransitionIndex !== index) {
            // console.log(`setApproachIndex: APPR TRANS ${currentFlightPlan.destinationAirfield.infos.approaches[currentFlightPlan.procedureDetails.approachIndex].transitions[index].name}`);
            currentFlightPlan.procedureDetails.approachTransitionIndex = index;
            await currentFlightPlan.rebuildArrivalApproach();

            this.updateFlightPlanVersion().catch(console.error);
        }

        callback();
    }

    /**
     * Removes the arrival segment from the current flight plan.
     * @param callback A callback to call when the operation completes.
     */
    public async removeArrival(callback = () => { }): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        // console.log('remove arrival - ARRIVAL');

        currentFlightPlan.procedureDetails.arrivalIndex = -1;
        currentFlightPlan.procedureDetails.arrivalRunwayIndex = -1;
        currentFlightPlan.procedureDetails.arrivalTransitionIndex = -1;

        await currentFlightPlan.buildArrival().catch(console.error);

        this.updateFlightPlanVersion().catch(console.error);
        callback();
    }

    /**
     * Inserts direct-to an ICAO designated fix.
     *
     * @param icao The ICAO designation for the fix to fly direct-to.
     */
    public async insertDirectTo(waypoint: WayPoint): Promise<void> {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];

        await currentFlightPlan.addDirectTo(waypoint);

        this.updateFlightPlanVersion().catch(console.error);
    }

    /**
     * Cancels the current direct-to and proceeds back along the flight plan.
     * @param callback A callback to call when the operation completes.
     */
    public cancelDirectTo(callback = EmptyCallback.Void): void {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        // currentFlightPlan.directTo.cancel();

        callback();
    }

    /**
     * Gets whether or not the flight plan is current in a direct-to procedure.
     */
    public getIsDirectTo(): boolean {
        return this._flightPlans[this._currentFlightPlanIndex].directTo.isActive;
    }

    /**
     * Gets the target of the direct-to procedure in the current flight plan.
     */
    public getDirectToTarget(): WayPoint {
        const currentFlightPlan = this._flightPlans[this._currentFlightPlanIndex];
        if (currentFlightPlan.directTo.waypointIsInFlightPlan) {
            return currentFlightPlan.waypoints[currentFlightPlan.directTo.planWaypointIndex];
        }

        return currentFlightPlan.directTo.waypoint;
    }

    /**
     * Gets the origin/start waypoint of the direct-to procedure in the current flight plan.
     */
    public getDirecToOrigin(): WayPoint {
        return this._flightPlans[this._currentFlightPlanIndex].directTo.interceptPoints[0];
    }

    public getCoordinatesHeadingAtDistanceAlongFlightPlan(_distance) {
    }

    /**
     * Gets the coordinates of a point that is a specific distance from the destination along the flight plan.
     * @param distance The distance from destination we want the coordinates for.
     */
    public getCoordinatesAtNMFromDestinationAlongFlightPlan(distance: number): LatLongAlt | null {
        const allWaypoints = this.getAllWaypoints();
        const destination = this.getDestination();

        if (destination) {
            const fromStartDistance = destination.cumulativeDistanceInFP - distance;
            let prevIndex;
            let prev;
            let next;
            for (let i = 0; i < allWaypoints.length - 1; i++) {
                prevIndex = i;
                prev = allWaypoints[i];
                next = allWaypoints[i + 1];
                if (prev.cumulativeDistanceInFP < fromStartDistance && next.cumulativeDistanceInFP > fromStartDistance) {
                    break;
                }
            }
            const prevCD = prev.cumulativeDistanceInFP;
            const nextCD = next.cumulativeDistanceInFP;
            const d = (fromStartDistance - prevCD) / (nextCD - prevCD);
            const output = new LatLongAlt();
            output.lat = Avionics.Utils.lerpAngle(prev.infos.coordinates.lat, next.infos.coordinates.lat, d);
            output.long = Avionics.Utils.lerpAngle(prev.infos.coordinates.long, next.infos.coordinates.long, d);
            return output;
        }

        return null;
    }

    /**
     * Gets the current stored flight plan
     */
    public _getFlightPlan(): void {
        if (!LnavConfig.DEBUG_SAVE_FPLN_LOCAL_STORAGE) {
            return;
        }
        const fpln = window.localStorage.getItem(FlightPlanManager.FlightPlanKey);
        if (fpln === null || fpln === '') {
            this._flightPlans = [];
            const initFpln = new ManagedFlightPlan();
            initFpln.setParentInstrument(this._parentInstrument);
            this._flightPlans.push(initFpln);
        } else if (window.localStorage.getItem(FlightPlanManager.FlightPlanCompressedKey) === '1') {
            this._flightPlans = JSON.parse(LZUTF8.decompress(fpln, { inputEncoding: 'StorageBinaryString' }));
        } else {
            try {
                this._flightPlans = JSON.parse(fpln);
            } catch (e) {
                // Assume we failed because compression status did not match up. Try to decompress anyway.

                this._flightPlans = JSON.parse(LZUTF8.decompress(fpln, { inputEncoding: 'StorageBinaryString' }));
            }
        }
    }

    public getCurrentFlightPlan(): ManagedFlightPlan {
        return this._flightPlans[this._currentFlightPlanIndex];
    }

    public getFlightPlan(index): ManagedFlightPlan {
        return this._flightPlans[index];
    }

    /**
     * Updates the synchronized flight plan version and saves it to shared storage.
     */
    public async updateFlightPlanVersion(): Promise<void> {
        if (this._isSyncPaused) {
            return;
        }

        if (LnavConfig.DEBUG_SAVE_FPLN_LOCAL_STORAGE) {
            let fpJson = JSON.stringify(this._flightPlans.map((fp) => fp.serialize()));
            if (fpJson.length > 2500000) {
                fpJson = LZUTF8.compress(fpJson, { outputEncoding: 'StorageBinaryString' });
                window.localStorage.setItem(FlightPlanManager.FlightPlanCompressedKey, '1');
            } else {
                window.localStorage.setItem(FlightPlanManager.FlightPlanCompressedKey, '0');
            }
            window.localStorage.setItem(FlightPlanManager.FlightPlanKey, fpJson);
        }
        SimVar.SetSimVarValue(FlightPlanManager.FlightPlanVersionKey, 'number', ++this._currentFlightPlanVersion);
        if (NXDataStore.get('FP_SYNC', 'LOAD') === 'SAVE') {
            FlightPlanAsoboSync.SaveToGame(this).catch(console.error);
        }
    }

    public pauseSync(): void {
        this._isSyncPaused = true;
        console.log('FlightPlan Sync Paused');
    }

    public resumeSync(): void {
        this._isSyncPaused = false;
        this.updateFlightPlanVersion().catch(console.error);
        console.log('FlightPlan Sync Resume');
    }

    get currentFlightPlanVersion(): number {
        return this._currentFlightPlanVersion;
    }

    public getOriginTransitionAltitude(flightPlanIndex: number = this._currentFlightPlanIndex): Feet | undefined {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        return currentFlightPlan.originTransitionAltitudePilot ?? currentFlightPlan.originTransitionAltitudeDb;
    }

    /**
     * The transition altitude for the origin in the *active* flight plan
     */
    get originTransitionAltitude(): number | undefined {
        return this.getOriginTransitionAltitude(0);
    }

    public getOriginTransitionAltitudeIsFromDb(flightPlanIndex: number = 0): boolean {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        return currentFlightPlan.originTransitionAltitudePilot === undefined;
    }

    /**
     * Is the transition altitude for the origin in the *active* flight plan from the database?
     */
    get originTransitionAltitudeIsFromDb(): boolean {
        return this.getOriginTransitionAltitudeIsFromDb(0);
    }

    /**
     * Set the transition altitude for the origin
     * @param altitude transition altitude
     * @param database is this value from the database, or pilot?
     * @param flightPlanIndex index of flight plan to be edited, defaults to current plan being edited (not active!)
     */
    public setOriginTransitionAltitude(altitude?: number, database: boolean = false, flightPlanIndex = this._currentFlightPlanIndex) {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        if (database) {
            currentFlightPlan.originTransitionAltitudeDb = altitude;
        } else {
            currentFlightPlan.originTransitionAltitudePilot = altitude;
        }
        this.updateFlightPlanVersion();
    }

    public getDestinationTransitionLevel(flightPlanIndex: number = this._currentFlightPlanIndex): FlightLevel | undefined {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        return currentFlightPlan.destinationTransitionLevelPilot ?? currentFlightPlan.destinationTransitionLevelDb;
    }

    /**
     * The transition level for the destination in the *active* flight plan
     */
    get destinationTransitionLevel(): FlightLevel | undefined {
        return this.getDestinationTransitionLevel(0);
    }

    public getDestinationTransitionLevelIsFromDb(flightPlanIndex: number = this._currentFlightPlanIndex): boolean {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        return currentFlightPlan.destinationTransitionLevelPilot === undefined;
    }

    /**
     * Is the transition level for the destination in the *active* flight plan from the database?
     */
    get destinationTransitionLevelIsFromDb(): boolean {
        return this.getDestinationTransitionLevelIsFromDb(0);
    }

    /**
     * Set the transition level for the destination
     * @param flightLevel transition level
     * @param database is this value from the database, or pilot?
     * @param flightPlanIndex index of flight plan to be edited, defaults to current plan being edited (not active!)
     */
    public setDestinationTransitionLevel(flightLevel?: FlightLevel, database: boolean = false, flightPlanIndex = this._currentFlightPlanIndex) {
        const currentFlightPlan = this._flightPlans[flightPlanIndex];
        if (database) {
            currentFlightPlan.destinationTransitionLevelDb = flightLevel;
        } else {
            currentFlightPlan.destinationTransitionLevelPilot = flightLevel;
        }
        this.updateFlightPlanVersion();
    }

    public getFixInfo(index: 0 | 1 | 2 | 3): FixInfo {
        return this._fixInfos[index];
    }

    public isWaypointInUse(icao: string): boolean {
        for (const fp of this._flightPlans) {
            for (let i = 0; i < fp?.waypoints.length; i++) {
                if (fp.getWaypoint(i).icao === icao) {
                    return true;
                }
            }
        }
        for (const fixInfo of this._fixInfos) {
            if (fixInfo?.getRefFix()?.infos.icao === icao) {
                return true;
            }
        }
        return false;
    }

    get activeFlightPlan(): ManagedFlightPlan | undefined {
        return this._flightPlans[FlightPlans.Active];
    }

    getApproachType(flightPlanIndex = this._currentFlightPlanIndex): ApproachType | undefined {
        const fp = this._flightPlans[flightPlanIndex];
        return fp?.procedureDetails.approachType ?? undefined;
    }

    getGlideslopeIntercept(flightPlanIndex = this._currentFlightPlanIndex): number | undefined {
        const fp = this._flightPlans[flightPlanIndex];
        return fp?.glideslopeIntercept ?? undefined;
    }

    private updateActiveArea(): void {
        const activeFp = this._flightPlans[FlightPlans.Active];
        if (!activeFp) {
            this.activeArea = FlightArea.Terminal;
            return;
        }

        this.activeArea = this.calculateActiveArea(activeFp);
    }

    private calculateActiveArea(activeFp: ManagedFlightPlan): FlightArea {
        const activeIndex = activeFp.activeWaypointIndex;

        const appr = activeFp.getSegment(SegmentType.Approach);
        const arrival = activeFp.getSegment(SegmentType.Arrival);
        const departure = activeFp.getSegment(SegmentType.Departure);

        if (departure !== FlightPlanSegment.Empty && activeIndex < (departure.offset + departure.waypoints.length)) {
            return FlightArea.Terminal;
        }

        if (arrival !== FlightPlanSegment.Empty
            && activeIndex >= arrival.offset
            && activeIndex < (arrival.offset + arrival.waypoints.length)) {
            return FlightArea.Terminal;
        }

        if (appr !== FlightPlanSegment.Empty
            && activeIndex >= appr.offset
            && activeIndex < (appr.offset + appr.waypoints.length)
            && activeFp.finalApproachActive) {
            const apprType = activeFp.procedureDetails.approachType;
            switch (apprType) {
            case ApproachType.APPROACH_TYPE_ILS:
                return FlightArea.PrecisionApproach;
            case ApproachType.APPROACH_TYPE_GPS:
            case ApproachType.APPROACH_TYPE_RNAV:
                return FlightArea.GpsApproach;
            case ApproachType.APPROACH_TYPE_VOR:
            case ApproachType.APPROACH_TYPE_VORDME:
                return FlightArea.VorApproach;
            default:
                return FlightArea.NonPrecisionApproach;
            }
        }

        return FlightArea.Enroute;
    }
}
