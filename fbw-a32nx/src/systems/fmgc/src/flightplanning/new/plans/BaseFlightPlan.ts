// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Approach, Arrival, Departure, Fix, LegType, ProcedureTransition, Runway, WaypointDescriptor } from 'msfs-navdata';
import { OriginSegment } from '@fmgc/flightplanning/new/segments/OriginSegment';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { DepartureSegment } from '@fmgc/flightplanning/new/segments/DepartureSegment';
import { ArrivalSegment } from '@fmgc/flightplanning/new/segments/ArrivalSegment';
import { ApproachSegment } from '@fmgc/flightplanning/new/segments/ApproachSegment';
import { DestinationSegment } from '@fmgc/flightplanning/new/segments/DestinationSegment';
import { DepartureEnrouteTransitionSegment } from '@fmgc/flightplanning/new/segments/DepartureEnrouteTransitionSegment';
import { DepartureRunwayTransitionSegment } from '@fmgc/flightplanning/new/segments/DepartureRunwayTransitionSegment';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { EnrouteSegment } from '@fmgc/flightplanning/new/segments/EnrouteSegment';
import { ArrivalEnrouteTransitionSegment } from '@fmgc/flightplanning/new/segments/ArrivalEnrouteTransitionSegment';
import { MissedApproachSegment } from '@fmgc/flightplanning/new/segments/MissedApproachSegment';
import { ArrivalRunwayTransitionSegment } from '@fmgc/flightplanning/new/segments/ArrivalRunwayTransitionSegment';
import { ApproachViaSegment } from '@fmgc/flightplanning/new/segments/ApproachViaSegment';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { procedureLegIdentAndAnnotation } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';
import { FlightPlanSyncEvents } from '@fmgc/flightplanning/new/sync/FlightPlanSyncEvents';
import { EventBus, Publisher } from 'msfssdk';
import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';
import { AlternateFlightPlan } from '@fmgc/flightplanning/new/plans/AlternateFlightPlan';

export enum FlightPlanQueuedOperation {
    Restring,
    RebuildArrivalAndApproach,
    SyncSegmentLegs,
}

export abstract class BaseFlightPlan {
    private readonly syncPub: Publisher<FlightPlanSyncEvents>;

    constructor(public readonly index: number, public readonly bus: EventBus) {
        this.syncPub = this.bus.getPublisher<FlightPlanSyncEvents>();

        const subs = this.bus.getSubscriber<FlightPlanSyncEvents>();

        const isAlternatePlan = this instanceof AlternateFlightPlan;

        // FIXME we need to destroy those subscriptions, this is a memory leak

        subs.on('flightPlan.setActiveLegIndex').handle((event) => {
            if (!this.ignoreSync) {
                if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
                    return;
                }

                this.activeLegIndex = event.activeLegIndex;

                this.incrementVersion();
            }
        });

        subs.on('flightPlan.setSegmentLegs').handle((event) => {
            if (!this.ignoreSync) {
                if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
                    return;
                }

                const segment = this.orderedSegments[event.segmentIndex];

                const elements: FlightPlanElement[] = event.legs.map((it) => {
                    if (it.isDiscontinuity === false) {
                        return FlightPlanLeg.deserialize(it, segment);
                    }
                    return it;
                });

                segment.allLegs = elements;

                this.incrementVersion();
            }
        });

        subs.on('flightPlan.setFixInfoEntry').handle((event) => {
            if (!this.ignoreSync) {
                if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
                    return;
                }

                if (this instanceof FlightPlan) {
                    this.setFixInfoEntry(event.index, event.fixInfo, false);

                    this.incrementVersion();
                }
            }
        });
    }

    get legCount() {
        return this.allLegs.length;
    }

    get lastIndex() {
        return Math.max(0, this.legCount - 1);
    }

    get firstMissedApproachLeg() {
        return this.allLegs.length - this.missedApproachSegment.allLegs.length;
    }

    activeLegIndex = 0;

    get activeLeg(): FlightPlanElement {
        return this.allLegs[this.activeLegIndex];
    }

    sequence() {
        if (this.activeLegIndex + 1 >= this.firstMissedApproachLegIndex) {
            this.enrouteSegment.allLegs.length = 0;

            const missedApproachPointLeg = this.approachSegment.allLegs[this.approachSegment.allLegs.length - 1];
            const cloneMissedApproachPointLeg = missedApproachPointLeg.isDiscontinuity === false ? missedApproachPointLeg.clone(this.enrouteSegment) : missedApproachPointLeg;
            const clonedMissedApproachLegs = this.missedApproachSegment.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(this.enrouteSegment) : it));

            if (cloneMissedApproachPointLeg.isDiscontinuity === false) {
                cloneMissedApproachPointLeg.type = LegType.IF;

                this.enrouteSegment.allLegs.push(cloneMissedApproachPointLeg);
            }
            this.enrouteSegment.allLegs.push(...clonedMissedApproachLegs);
            this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
            this.enrouteSegment.strung = true;
            this.enrouteSegment.isSequencedMissedApproach = true;

            this.syncSegmentLegsChange(this.enrouteSegment);

            // We don't have to await any of this because of how we use it, but this might be something to clean up in the future

            this.arrivalEnrouteTransitionSegment.setArrivalEnrouteTransition(undefined);
            this.arrivalSegment.setArrivalProcedure(undefined);

            this.approachSegment.setApproachProcedure(this.approachSegment.approachProcedure?.ident);
            this.approachViaSegment.setApproachVia(this.approachViaSegment.approachViaProcedure?.ident);

            this.enqueueOperation(FlightPlanQueuedOperation.Restring);
            this.flushOperationQueue();

            const activeIndex = this.allLegs.findIndex((it) => it === clonedMissedApproachLegs[0]);

            this.activeLegIndex = activeIndex;

            this.sendEvent('flightPlan.setActiveLegIndex', { planIndex: this.index, forAlternate: this instanceof AlternateFlightPlan, activeLegIndex: activeIndex });
        } else {
            this.activeLegIndex++;

            this.sendEvent('flightPlan.setActiveLegIndex', { planIndex: this.index, forAlternate: false, activeLegIndex: this.activeLegIndex });
        }
    }

    version = 0;

    incrementVersion() {
        this.version++;
    }

    queuedOperations: [op: FlightPlanQueuedOperation, param: any][] = [];

    enqueueOperation(op: FlightPlanQueuedOperation, param?: any): void {
        const existing = this.queuedOperations.find((it) => it[0] === op && it[1] === param);

        if (existing === undefined) {
            this.queuedOperations.push([op, param]);
        }
    }

    async flushOperationQueue() {
        for (const [operation, param] of this.queuedOperations) {
            switch (operation) {
            case FlightPlanQueuedOperation.Restring:
                this.restring();
                break;
            case FlightPlanQueuedOperation.RebuildArrivalAndApproach:
                // eslint-disable-next-line no-await-in-loop
                await this.rebuildArrivalAndApproachSegments();
                break;
            case FlightPlanQueuedOperation.SyncSegmentLegs:
                const segment = param as FlightPlanSegment;

                this.syncSegmentLegsChange(segment);
                break;
            default:
                console.error(`Unknown queue operation: ${operation}`);
            }
        }

        this.queuedOperations.length = 0;
    }

    protected ignoreSync = false;

    sendEvent<K extends keyof FlightPlanSyncEvents>(topic: K, data: FlightPlanSyncEvents[K]) {
        this.ignoreSync = true;
        this.syncPub.pub(topic, data, true, false);
        this.ignoreSync = false;
    }

    syncSegmentLegsChange(segment: FlightPlanSegment) {
        const segmentIndex = this.orderedSegments.indexOf(segment);

        const legs = segment.allLegs.map((it) => (it.isDiscontinuity === false ? it.serialize() : it));

        this.sendEvent('flightPlan.setSegmentLegs', { planIndex: this.index, forAlternate: false, segmentIndex, legs });
    }

    originSegment = new OriginSegment(this);

    departureRunwayTransitionSegment = new DepartureRunwayTransitionSegment(this);

    departureSegment = new DepartureSegment(this);

    departureEnrouteTransitionSegment = new DepartureEnrouteTransitionSegment(this)

    enrouteSegment = new EnrouteSegment(this);

    arrivalEnrouteTransitionSegment = new ArrivalEnrouteTransitionSegment(this);

    arrivalSegment = new ArrivalSegment(this);

    arrivalRunwayTransitionSegment = new ArrivalRunwayTransitionSegment(this);

    approachViaSegment = new ApproachViaSegment(this);

    approachSegment = new ApproachSegment(this);

    destinationSegment = new DestinationSegment(this);

    missedApproachSegment = new MissedApproachSegment(this);

    availableOriginRunways: Runway[] = [];

    availableDepartures: Departure[] = [];

    availableDestinationRunways: Runway[] = [];

    availableArrivals: Arrival[] = [];

    availableApproaches: Approach[] = [];

    availableApproachVias: ProcedureTransition[] = [];

    get originLeg() {
        return this.allLegs[0];
    }

    get originLegIndex() {
        return this.originSegment.allLegs.length > 0 ? 0 : -1;
    }

    get destinationLeg() {
        return this.elementAt(this.destinationLegIndex);
    }

    get destinationLegIndex() {
        let targetSegment;

        if (this.destinationSegment.allLegs.length > 0) {
            targetSegment = this.destinationSegment;
        } else if (this.approachSegment.allLegs.length > 0) {
            targetSegment = this.approachSegment;
        } else {
            return -1;
        }

        let accumulator = 0;
        for (const segment of this.orderedSegments) {
            accumulator += segment.allLegs.length;

            if (segment === targetSegment) {
                break;
            }
        }

        return accumulator - 1;
    }

    get endsAtRunway() {
        if (this.approachSegment.allLegs.length === 0) {
            return true;
        }

        const lastApproachLeg = this.approachSegment.allLegs[this.approachSegment.allLegs.length - 1];

        return lastApproachLeg && lastApproachLeg.isDiscontinuity === false && lastApproachLeg.definition.waypointDescriptor === WaypointDescriptor.Runway;
    }

    get lastLegIndex() {
        return this.legCount - 1;
    }

    hasElement(index: number): boolean {
        return index >= 0 && index < this.allLegs.length;
    }

    elementAt(index: number): FlightPlanElement {
        const legs = this.allLegs;

        if (index < 0 || index > legs.length) {
            throw new Error('[FMS/FPM] leg index out of bounds');
        }

        return legs[index];
    }

    legElementAt(index: number): FlightPlanLeg {
        const element = this.elementAt(index);

        if (element.isDiscontinuity === true) {
            throw new Error('[FMS/FPM] element was not a leg');
        }

        return element;
    }

    maybeElementAt(index: number): FlightPlanElement | undefined {
        const legs = this.allLegs;

        return legs[index];
    }

    private lastAllLegsVersion = -1;

    private cachedAllLegs = [];

    get allLegs(): FlightPlanElement[] {
        if (this.lastAllLegsVersion !== this.version) {
            this.lastAllLegsVersion = this.version;

            this.cachedAllLegs = [
                ...this.originSegment.allLegs,
                ...this.departureRunwayTransitionSegment.allLegs,
                ...this.departureSegment.allLegs,
                ...this.departureEnrouteTransitionSegment.allLegs,
                ...this.enrouteSegment.allLegs,
                ...this.arrivalEnrouteTransitionSegment.allLegs,
                ...this.arrivalSegment.allLegs,
                ...this.arrivalRunwayTransitionSegment.allLegs,
                ...this.approachViaSegment.allLegs,
                ...this.approachSegment.allLegs,
                ...(this.endsAtRunway ? (this.destinationSegment.allLegs) : []),
                ...this.missedApproachSegment.allLegs,
            ];
        }

        return this.cachedAllLegs;
    }

    public computeWaypointStatistics(): Map<number, WaypointStats> {
        const stats = new Map<number, WaypointStats>();

        for (let i = 0; i < this.allLegs.length; i++) {
            const element = this.allLegs[i];

            if (element.isDiscontinuity === true) {
                continue;
            }

            const data = {
                ident: element.ident,
                bearingInFp: 0,
                distanceInFP: 0,
                distanceFromPpos: 0,
                timeFromPpos: 0,
                etaFromPpos: 0,
                magneticVariation: 0,
            };

            stats.set(i, data);
        }

        return stats;
    }

    public get orderedSegments(): FlightPlanSegment[] {
        return [
            this.originSegment,
            this.departureRunwayTransitionSegment,
            this.departureSegment,
            this.departureEnrouteTransitionSegment,
            this.enrouteSegment,
            this.arrivalEnrouteTransitionSegment,
            this.arrivalSegment,
            this.arrivalRunwayTransitionSegment,
            this.approachViaSegment,
            this.approachSegment,
            this.destinationSegment,
            this.missedApproachSegment,
        ];
    }

    /**
     * Returns the last flight plan segment containing at least one leg
     *
     * @param before the segment
     */
    public previousSegment(before: FlightPlanSegment) {
        const segments = this.orderedSegments;
        const segmentIndex = segments.findIndex((s) => s === before);

        if (segmentIndex === -1) {
            throw new Error('[FMS/FPM] Invalid segment passed to prevSegment');
        }

        let prevSegmentIndex = segmentIndex - 1;
        let prevSegment = segments[prevSegmentIndex];

        if (!prevSegment) {
            return undefined;
        }

        while (prevSegment && prevSegment.allLegs.length === 0 && prevSegmentIndex > 0) {
            prevSegmentIndex--;
            prevSegment = segments[prevSegmentIndex];
        }

        if (prevSegment && prevSegment.allLegs.length > 0) {
            return prevSegment;
        }

        return undefined;
    }

    /**
     * Returns the next flight plan segment containing at least one leg
     *
     * @param after the segment
     */
    public nextSegment(after: FlightPlanSegment) {
        const segments = this.orderedSegments;
        const segmentIndex = segments.findIndex((s) => s === after);

        if (segmentIndex === -1) {
            throw new Error('[FMS/FPM] Invalid segment passed to nextSegment');
        }

        let nextSegmentIndex = segmentIndex + 1;
        let nextSegment = segments[nextSegmentIndex];

        if (!nextSegment) {
            return undefined;
        }

        while (nextSegment && nextSegment.allLegs.length === 0 && nextSegmentIndex < segments.length) {
            nextSegmentIndex++;
            nextSegment = segments[nextSegmentIndex];
        }

        if (nextSegment && nextSegment.allLegs.length > 0) {
            return nextSegment;
        }

        return undefined;
    }

    public replaceSegment(segment: FlightPlanSegment) {
        if (segment instanceof OriginSegment) {
            this.originSegment = segment;
        } else if (segment instanceof DepartureRunwayTransitionSegment) {
            this.departureRunwayTransitionSegment = segment;
        } else if (segment instanceof DepartureSegment) {
            this.departureSegment = segment;
        } else if (segment instanceof DepartureEnrouteTransitionSegment) {
            this.departureEnrouteTransitionSegment = segment;
        } else if (segment instanceof EnrouteSegment) {
            this.enrouteSegment = segment;
        } else if (segment instanceof ArrivalEnrouteTransitionSegment) {
            this.arrivalEnrouteTransitionSegment = segment;
        } else if (segment instanceof ArrivalSegment) {
            this.arrivalSegment = segment;
        } else if (segment instanceof ArrivalRunwayTransitionSegment) {
            this.arrivalRunwayTransitionSegment = segment;
        } else if (segment instanceof ApproachViaSegment) {
            this.approachViaSegment = segment;
        } else if (segment instanceof ApproachSegment) {
            this.approachSegment = segment;
        } else if (segment instanceof DestinationSegment) {
            this.destinationSegment = segment;
        } else if (segment instanceof MissedApproachSegment) {
            this.missedApproachSegment = segment;
        }
    }

    get originAirport(): Airport {
        return this.originSegment.originAirport;
    }

    async setOriginAirport(icao: string) {
        await this.originSegment.setOriginIcao(icao);
        await this.departureSegment.setDepartureProcedure(undefined);
        this.enrouteSegment.allLegs.length = 0;
        await this.arrivalSegment.setArrivalProcedure(undefined);
        await this.approachSegment.setApproachProcedure(undefined);

        if (this instanceof FlightPlan) {
            this.performanceData.databaseTransitionAltitude.set(this.originAirport.transitionAltitude);
        }

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get originRunway(): Runway {
        return this.originSegment.originRunway;
    }

    async setOriginRunway(runwayIdent: string) {
        await this.originSegment.setOriginRunway(runwayIdent);

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get departureRunwayTransition(): ProcedureTransition {
        return this.departureRunwayTransitionSegment.departureRunwayTransitionProcedure;
    }

    get originDeparture(): Departure {
        return this.departureSegment.originDeparture;
    }

    async setDeparture(procedureIdent: string | undefined) {
        await this.departureSegment.setDepartureProcedure(procedureIdent).then(() => this.incrementVersion());

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get departureEnrouteTransition(): ProcedureTransition {
        return this.departureEnrouteTransitionSegment.departureEnrouteTransitionProcedure;
    }

    /**
     * Sets the departure enroute transition
     *
     * @param transitionIdent the transition ident or `undefined` for NONE
     */
    async setDepartureEnrouteTransition(transitionIdent: string | undefined) {
        this.departureEnrouteTransitionSegment.setDepartureEnrouteTransition(transitionIdent);

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get arrivalEnrouteTransition(): ProcedureTransition {
        return this.arrivalEnrouteTransitionSegment.arrivalEnrouteTransitionProcedure;
    }

    /**
     * Sets the arrival enroute transition
     *
     * @param transitionIdent the transition ident or `undefined` for NONE
     */
    async setArrivalEnrouteTransition(transitionIdent: string | undefined) {
        await this.arrivalEnrouteTransitionSegment.setArrivalEnrouteTransition(transitionIdent);

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get arrival() {
        return this.arrivalSegment.arrivalProcedure;
    }

    async setArrival(procedureIdent: string | undefined) {
        await this.arrivalSegment.setArrivalProcedure(procedureIdent).then(() => this.incrementVersion());

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get arrivalRunwayTransition() {
        return this.arrivalRunwayTransitionSegment.arrivalRunwayTransitionProcedure;
    }

    get approachVia() {
        return this.approachViaSegment.approachViaProcedure;
    }

    /**
     * Sets the approach via
     *
     * @param transitionIdent the transition ident or `undefined` for NONE
     */
    async setApproachVia(transitionIdent: string | undefined) {
        await this.approachViaSegment.setApproachVia(transitionIdent);

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get approach() {
        return this.approachSegment.approachProcedure;
    }

    async setApproach(procedureIdent: string | undefined) {
        await this.approachSegment.setApproachProcedure(procedureIdent).then(() => this.incrementVersion());

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get destinationAirport(): Airport {
        return this.destinationSegment.destinationAirport;
    }

    async setDestinationAirport(icao: string | undefined) {
        await this.destinationSegment.setDestinationIcao(icao).then(() => this.incrementVersion());

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get destinationRunway(): Runway {
        return this.destinationSegment.destinationRunway;
    }

    async setDestinationRunway(runwayIdent: string) {
        await this.destinationSegment.setDestinationRunway(runwayIdent).then(() => this.incrementVersion());

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    removeElementAt(index: number, insertDiscontinuity = false): boolean {
        if (index < 0) {
            throw new Error('[FMS/FPM] Tried to remove element for out-of-bounds index');
        }

        const [segment, indexInSegment] = this.segmentPositionForIndex(index);

        // TODO if clear leg before a hold, delete hold too? some other legs like this too..
        // TODO normally, need to insert a disco

        if (insertDiscontinuity && index > 0) {
            const previousElement = this.elementAt(index - 1);

            if (previousElement.isDiscontinuity === false) {
                segment.allLegs.splice(indexInSegment, 1, { isDiscontinuity: true });
            } else {
                segment.allLegs.splice(indexInSegment, 1);
            }
        } else {
            segment.allLegs.splice(indexInSegment, 1);
        }

        this.incrementVersion();

        this.adjustIFLegs();
        this.redistributeLegsAt(index);

        this.incrementVersion();

        return true;
    }

    /**
     * Finds the segment and index in segment of a given flight plan index
     *
     * @param index the given index
     *
     * @private
     */
    segmentPositionForIndex(index: number): [segment: FlightPlanSegment, indexInSegment: number] {
        if (index < 0) {
            throw new Error('[FMS/FPM] Tried to get segment for out-of-bounds index');
        }

        let accumulator = 0;
        for (const segment of this.orderedSegments) {
            accumulator += segment.allLegs.length;

            if (accumulator > index) {
                return [segment, index - (accumulator - segment.allLegs.length)];
            }
        }

        throw new Error('[FMS/FPM] Tried to get segment for out-of-bounds index');
    }

    /**
     * Inserts a waypoint before a leg at an index.
     *
     * @param index the index of the leg to insert the waypoint before
     * @param waypoint the waypoint to insert
     */
    async insertWaypointBefore(index: number, waypoint: Fix) {
        this.redistributeLegsAt(index - 1);

        const leg = FlightPlanLeg.fromEnrouteFix(this.enrouteSegment, waypoint);

        await this.insertElementAfter(index - 1, leg, false);
    }

    /**
     * NEXT WPT revision. Inserts a waypoint after a leg at an index, adding a discontinuity if the waypoint isn't downstream in the plan
     *
     * @param index the index of the leg to insert the waypoint after
     * @param waypoint the waypoint to insert
     */
    async nextWaypoint(index: number, waypoint: Fix) {
        this.redistributeLegsAt(index);

        const leg = FlightPlanLeg.fromEnrouteFix(this.enrouteSegment, waypoint, undefined, LegType.DF);

        const waypointExists = this.findDuplicate(waypoint, index);

        await this.insertElementAfter(index, leg, !waypointExists);
    }

    // TODO make this private, adjust tests to test nextWaypoint instead
    async insertElementAfter(index: number, element: FlightPlanElement, insertDiscontinuity = false) {
        if (index < 0 || index > this.allLegs.length) {
            throw new Error(`[FMS/FPM] Tried to insert waypoint out of bounds (index=${index})`);
        }

        let startSegment: FlightPlanSegment;
        let indexInStartSegment;

        if (this.legCount > 0) {
            [startSegment, indexInStartSegment] = this.segmentPositionForIndex(index);
        } else {
            startSegment = this.enrouteSegment;
            indexInStartSegment = 0;
        }

        startSegment.insertAfter(indexInStartSegment, element);

        if (insertDiscontinuity) {
            this.incrementVersion();

            const nextElement = this.elementAt(index + 2);

            if (nextElement.isDiscontinuity === false) {
                startSegment.insertAfter(indexInStartSegment + 1, { isDiscontinuity: true });
                this.incrementVersion();
            }
        }

        this.enqueueOperation(FlightPlanQueuedOperation.Restring);
        await this.flushOperationQueue();
        this.incrementVersion();
    }

    setOverflyAt(index: number, overfly: boolean): void {
        const leg = this.legElementAt(index);

        leg.definition.overfly = overfly;

        this.incrementVersion();
    }

    toggleOverflyAt(index: number): void {
        const leg = this.legElementAt(index);

        leg.definition.overfly = !leg.definition.overfly;

        this.incrementVersion();
    }

    private findDuplicate(waypoint: Fix, afterIndex?: number): [FlightPlanSegment, number, number] | null {
        // There is never gonna be a duplicate in the origin

        let indexAccumulator = 0;

        for (const segment of this.orderedSegments) {
            indexAccumulator += segment.allLegs.length;

            if (indexAccumulator > afterIndex) {
                const dupeIndexInSegment = segment.findIndexOfWaypoint(waypoint, afterIndex - (indexAccumulator - segment.allLegs.length));

                const planIndex = indexAccumulator - segment.allLegs.length + dupeIndexInSegment;

                if (planIndex <= afterIndex) {
                    continue;
                }

                if (dupeIndexInSegment !== -1) {
                    return [segment, dupeIndexInSegment, planIndex];
                }
            }
        }

        return null;
    }

    /**
     * Redistributes flight plan elements at a point, either moving previous or next non-enroute legs into the enroute, depending on the index
     *
     * @param index point at which to redistribute
     */
    redistributeLegsAt(index: number) {
        if (!this.hasElement(index)) {
            return;
        }

        const [segment, indexInSegment] = this.segmentPositionForIndex(index);

        segment.strung = true;

        if (segment.class === SegmentClass.Departure) {
            const toInsertInEnroute: FlightPlanElement[] = [];

            let emptyAllNext = false;

            if (segment === this.originSegment) {
                emptyAllNext = true;

                toInsertInEnroute.push(...this.originSegment.truncate(indexInSegment));
            }

            if (segment === this.departureRunwayTransitionSegment) {
                emptyAllNext = true;

                toInsertInEnroute.push(...this.departureRunwayTransitionSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.departureRunwayTransitionSegment.allLegs.slice();
                this.departureRunwayTransitionSegment.allLegs.length = 0;

                toInsertInEnroute.push(...removed);
            }

            if (segment === this.departureSegment) {
                emptyAllNext = true;

                toInsertInEnroute.push(...this.departureSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.departureSegment.allLegs.slice();
                this.departureSegment.allLegs.length = 0;

                toInsertInEnroute.push(...removed);
            }

            if (segment === this.departureEnrouteTransitionSegment) {
                toInsertInEnroute.push(...this.departureEnrouteTransitionSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.departureEnrouteTransitionSegment.allLegs.slice();
                this.departureEnrouteTransitionSegment.allLegs.length = 0;

                toInsertInEnroute.push(...removed);
            }

            for (const element of toInsertInEnroute) {
                if (element.isDiscontinuity === false) {
                    element.annotation = 'TRUNC D';
                    element.segment = this.enrouteSegment;
                }
            }

            this.enrouteSegment.allLegs.unshift(...toInsertInEnroute);
        } else if (segment.class === SegmentClass.Arrival) {
            const toInsertInEnroute: FlightPlanElement[] = [];

            let emptyAllNext = false;

            if (segment === this.approachSegment) {
                emptyAllNext = true;

                toInsertInEnroute.unshift(...this.approachSegment.truncate(indexInSegment));
            }

            if (segment === this.approachViaSegment) {
                emptyAllNext = true;

                toInsertInEnroute.unshift(...this.approachViaSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.approachViaSegment.allLegs.slice();
                this.approachViaSegment.allLegs.length = 0;

                toInsertInEnroute.unshift(...removed);
            }

            if (segment === this.arrivalRunwayTransitionSegment) {
                emptyAllNext = true;

                toInsertInEnroute.unshift(...this.arrivalRunwayTransitionSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.arrivalRunwayTransitionSegment.allLegs.slice();
                this.arrivalRunwayTransitionSegment.allLegs.length = 0;

                toInsertInEnroute.unshift(...removed);
            }

            if (segment === this.arrivalSegment) {
                emptyAllNext = true;

                toInsertInEnroute.unshift(...this.arrivalSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.arrivalSegment.allLegs.slice();
                this.arrivalSegment.allLegs.length = 0;

                toInsertInEnroute.unshift(...removed);
            }

            if (segment === this.arrivalEnrouteTransitionSegment) {
                toInsertInEnroute.unshift(...this.arrivalEnrouteTransitionSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.arrivalEnrouteTransitionSegment.allLegs.slice();
                this.arrivalEnrouteTransitionSegment.allLegs.length = 0;

                toInsertInEnroute.unshift(...removed);
            }

            for (const element of toInsertInEnroute) {
                if (element.isDiscontinuity === false) {
                    element.annotation = 'TRUNC A';
                    element.segment = this.enrouteSegment;
                }
            }

            this.enrouteSegment.allLegs.push(...toInsertInEnroute);
        } else {
            // Do nothing
        }
    }

    private restring() {
        const segments = this.orderedSegments;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const prevSegment = this.previousSegment(segment);
            const nextSegment = this.nextSegment(segment);

            this.stringSegmentsForwards(prevSegment, segment);
            this.stringSegmentsForwards(segment, nextSegment);

            segment.insertNecessaryDiscontinuities();
        }

        this.incrementVersion();

        this.ensureNoDuplicates();
        this.adjustIFLegs();

        this.incrementVersion();
    }

    private stringSegmentsForwards(first: FlightPlanSegment, second: FlightPlanSegment) {
        if (!first || !second || first.strung || first.allLegs.length === 0 || second.allLegs.length === 0) {
            return;
        }

        const lastElementInFirst = first.allLegs[first.allLegs.length - 1];
        let lastLegInFirst = lastElementInFirst;

        if (lastLegInFirst?.isDiscontinuity === true) {
            lastLegInFirst = first.allLegs[first.allLegs.length - 2];

            if (!lastLegInFirst || lastLegInFirst?.isDiscontinuity === true) {
                throw new Error('[FMS/FPM] Segment legs only contained a discontinuity');
            }
        }

        if (first instanceof OriginSegment && first.lastLeg?.waypointDescriptor === WaypointDescriptor.Runway) {
            // Always string origin with only a runway to next segment
            first.strung = true;
            return;
        }

        if (first instanceof OriginSegment && second instanceof DestinationSegment) {
            // Don't do anything for origin and dest - we might have something like NZQN <disco> NZQN, and want to keep it that way
            first.strung = true;
            return;
        }

        if (first instanceof ApproachSegment && second instanceof DestinationSegment) {
            // Always string approach to destination
            first.strung = true;
            return;
        }

        if ((first instanceof DestinationSegment || first instanceof ApproachSegment) && second instanceof MissedApproachSegment) {
            // Always string approach to missed
            first.strung = true;
            return;
        }

        let cutBefore = -1;
        for (let i = 0; i < second.allLegs.length; i++) {
            const element = second.allLegs[i];

            if (element.isDiscontinuity === true) {
                continue;
            }

            const bothXf = lastLegInFirst.isXF() && element.isXF();

            if (bothXf) {
                if (element.terminatesWithWaypoint(lastLegInFirst.terminationWaypoint())) {
                    // Transfer leg type from lastLegInFirst definition onto element
                    element.type = lastLegInFirst.definition.type;
                    Object.assign(element.definition, lastLegInFirst.definition);

                    // FIXME carry procedure ident from second segment
                    [element.ident, element.annotation] = procedureLegIdentAndAnnotation(element.definition, '');

                    first.allLegs.pop();
                    first.flightPlan.syncSegmentLegsChange(first);
                    cutBefore = i;
                    break;
                }
            }

            const xfToFx = lastLegInFirst.isXF() && element.isFX();

            if (xfToFx && lastLegInFirst.terminatesWithWaypoint(element.terminationWaypoint())) {
                cutBefore = i;
                break;
            }
        }

        // If no matching leg is found, insert a discontinuity (if there isn't one already) at the end of the first segment
        if (cutBefore === -1) {
            if (lastElementInFirst.isDiscontinuity === false) {
                first.allLegs.push({ isDiscontinuity: true });
                this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, first);
            }

            first.strung = false;
            return;
        }

        // Otherwise, clear a possible discontinuity and remove all elements before the matching leg and the last leg of the first segment
        if (lastElementInFirst.isDiscontinuity === true) {
            first.allLegs.pop();
            this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, first);
        }

        for (let i = 0; i < cutBefore; i++) {
            second.allLegs.shift();
        }

        this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, second);

        first.strung = true;
    }

    private adjustIFLegs() {
        const elements = this.allLegs;

        for (let i = 0; i < elements.length; i++) {
            if (i === 0) {
                continue;
            }

            const prevElement = elements[i - 1];
            const element = elements[i];

            // IF -> XX if no discontinuity before, and element present
            if (element && element.isDiscontinuity === false && element.type === LegType.IF) {
                if (prevElement && prevElement.isDiscontinuity === true) {
                    continue;
                }

                if (element.definition.type === LegType.IF && element.ident !== 'T-P') {
                    element.type = LegType.TF;
                } else {
                    element.type = element.definition.type;
                }
            }

            // XX -> IF if no element, or discontinuity before
            if (element && element.isDiscontinuity === false && element.type !== LegType.IF) {
                if (!prevElement || (prevElement && prevElement.isDiscontinuity === true)) {
                    element.type = LegType.IF;
                }
            }
        }
    }

    private ensureNoDuplicates() {
        let a = 0;
        let i = 0;
        for (const segment of this.orderedSegments) {
            for (let j = 0; j < segment.allLegs.length; j++) {
                i = a + j;

                if (i < this.activeLegIndex) {
                    continue;
                }

                const leg = segment.allLegs[j];

                if (leg.isDiscontinuity === true) {
                    continue;
                }

                if (!leg.isXF()) {
                    continue;
                }

                const fix = leg.definition.waypoint;

                const duplicate = this.findDuplicate(fix, i);

                if (duplicate) {
                    const [duplicateSegment, duplicateIndexInSegment, duplicatePlanIndex] = duplicate;

                    // We can have duplicates if they are the origin and destination airport
                    if (segment === this.originSegment && duplicateSegment === this.destinationSegment) {
                        continue;
                    }

                    // We can have duplicates in the missed approach
                    if (duplicateSegment === this.missedApproachSegment) {
                        continue;
                    }

                    // We can have duplicates after an enroute which is a sequenced missed approach and another segment
                    if (segment instanceof EnrouteSegment && segment.isSequencedMissedApproach) {
                        continue;
                    }

                    const duplicateLeg = duplicateSegment.allLegs[duplicateIndexInSegment];

                    if (duplicateLeg.isDiscontinuity === true) {
                        continue;
                    }

                    // We can have duplicates with different leg types
                    if (leg.type !== duplicateLeg.type) {
                        continue;
                    }

                    this.removeRange(i + 1, duplicatePlanIndex + 1);
                }
            }

            a += segment.allLegs.length;
        }
    }

    arrivalAndApproachSegmentsBeingRebuilt = false;

    private async rebuildArrivalAndApproachSegments() {
        // We call the segment functions here, otherwise we infinitely enqueue restrings and rebuilds since calling
        // the methods on BaseFlightPlan flush the op queue

        this.arrivalAndApproachSegmentsBeingRebuilt = true;

        if (this.approach) {
            await this.approachSegment.setApproachProcedure(this.approach.ident);
        }

        if (this.approachVia) {
            await this.approachViaSegment.setApproachVia(this.approachVia.ident);
        }

        if (this.arrival) {
            await this.arrivalSegment.setArrivalProcedure(this.arrival.ident);
        }

        if (this.arrivalEnrouteTransition) {
            await this.arrivalEnrouteTransitionSegment.setArrivalEnrouteTransition(this.arrivalEnrouteTransition.ident);
        }

        const previousSegmentToArrival = this.previousSegment(this.arrivalEnrouteTransitionSegment);
        previousSegmentToArrival.strung = false;

        await this.destinationSegment.refresh(false);
    }

    protected removeRange(start: number, end: number) {
        const [startSegment, indexInStartSegment] = this.segmentPositionForIndex(start);
        const [endSegment, indexInEndSegment] = this.segmentPositionForIndex(end - 1);

        if (!startSegment || !endSegment) {
            throw new Error('[FMS/FPM] Range out of bounds');
        }

        if (startSegment === endSegment) {
            startSegment.removeRange(indexInStartSegment, indexInEndSegment + 1);
        } else {
            let startFound = false;
            for (const segment of this.orderedSegments) {
                if (!startFound && segment !== startSegment) {
                    continue;
                }

                if (segment === startSegment) {
                    startFound = true;

                    segment.removeAfter(indexInStartSegment);
                    continue;
                }

                if (segment === endSegment) {
                    segment.removeBefore(indexInEndSegment + 1);
                    break;
                }

                segment.allLegs.length = 0;
            }
        }
    }
}
