// Copyright (c) 2021-2023 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    Airport,
    AltitudeDescriptor,
    Approach,
    ApproachWaypointDescriptor,
    Arrival,
    Departure,
    Fix,
    LegType,
    ProcedureTransition,
    Runway,
    WaypointDescriptor,
} from '@flybywiresim/fbw-sdk';
import { OriginSegment } from '@fmgc/flightplanning/new/segments/OriginSegment';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { DepartureSegment } from '@fmgc/flightplanning/new/segments/DepartureSegment';
import { ArrivalSegment } from '@fmgc/flightplanning/new/segments/ArrivalSegment';
import { ApproachSegment } from '@fmgc/flightplanning/new/segments/ApproachSegment';
import { DestinationSegment } from '@fmgc/flightplanning/new/segments/DestinationSegment';
import { DepartureEnrouteTransitionSegment } from '@fmgc/flightplanning/new/segments/DepartureEnrouteTransitionSegment';
import { DepartureRunwayTransitionSegment } from '@fmgc/flightplanning/new/segments/DepartureRunwayTransitionSegment';
import { FlightPlanSegment, SerializedFlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { EnrouteSegment } from '@fmgc/flightplanning/new/segments/EnrouteSegment';
import { ArrivalEnrouteTransitionSegment } from '@fmgc/flightplanning/new/segments/ArrivalEnrouteTransitionSegment';
import { MissedApproachSegment } from '@fmgc/flightplanning/new/segments/MissedApproachSegment';
import { ArrivalRunwayTransitionSegment } from '@fmgc/flightplanning/new/segments/ArrivalRunwayTransitionSegment';
import { ApproachViaSegment } from '@fmgc/flightplanning/new/segments/ApproachViaSegment';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { HoldData, WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { procedureLegIdentAndAnnotation } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';
import { FlightPlanSyncEvents, PerformanceDataFlightPlanSyncEvents } from '@fmgc/flightplanning/new/sync/FlightPlanSyncEvents';
import { EventBus, Publisher, Subscription } from '@microsoft/msfs-sdk';
import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';
import { AlternateFlightPlan } from '@fmgc/flightplanning/new/plans/AlternateFlightPlan';
import { FixInfoEntry } from '@fmgc/flightplanning/new/plans/FixInfo';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/new/legs/FlightPlanLegDefinition';
import { PendingAirways } from '@fmgc/flightplanning/new/plans/PendingAirways';
import { FlightPlanPerformanceData, SerializedFlightPlanPerformanceData } from '@fmgc/flightplanning/new/plans/performance/FlightPlanPerformanceData';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/new/plans/ReadonlyFlightPlan';
import { AltitudeConstraint, ConstraintUtils, SpeedConstraint } from '@fmgc/flightplanning/data/constraint';

export enum FlightPlanQueuedOperation {
    Restring,
    RebuildArrivalAndApproach,
    SyncSegmentLegs,
}

export abstract class BaseFlightPlan<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> implements ReadonlyFlightPlan {
    private readonly syncPub: Publisher<FlightPlanSyncEvents>;

    private readonly perfSyncPub: Publisher<PerformanceDataFlightPlanSyncEvents<P>>;

    public pendingAirways: PendingAirways | undefined;

    private subscriptions: Subscription[] = [];

    protected constructor(public readonly index: number, public readonly bus: EventBus) {
        this.syncPub = this.bus.getPublisher<FlightPlanSyncEvents>();
        this.perfSyncPub = this.bus.getPublisher<PerformanceDataFlightPlanSyncEvents<P>>();

        const subs = this.bus.getSubscriber<FlightPlanSyncEvents>();

        const isAlternatePlan = this instanceof AlternateFlightPlan;

        // FIXME we need to destroy those subscriptions, this is a memory leak
        // FIXME we should not be doing this here anyway...

        this.subscriptions.push(subs.on('flightPlan.setActiveLegIndex').handle((event) => {
            if (!this.ignoreSync) {
                if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
                    return;
                }

                this.activeLegIndex = event.activeLegIndex;

                this.incrementVersion();
            }
        }));

        this.subscriptions.push(subs.on('flightPlan.setSegmentLegs').handle((event) => {
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
        }));

        this.subscriptions.push(subs.on('flightPlan.legDefinitionEdit').handle((event) => {
            if (!this.ignoreSync) {
                if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
                    return;
                }

                const element = this.legElementAt(event.atIndex);

                Object.assign(element.definition, event.newDefinition);

                this.incrementVersion();
            }
        }));

        this.subscriptions.push(subs.on('flightPlan.setLegCruiseStep').handle((event) => {
            if (!this.ignoreSync) {
                if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
                    return;
                }

                const element = this.legElementAt(event.atIndex);

                element.cruiseStep = event.cruiseStep;

                this.incrementVersion();
            }
        }));

        this.subscriptions.push(subs.on('flightPlan.setFixInfoEntry').handle((event) => {
            if (!this.ignoreSync) {
                if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
                    return;
                }

                if (this instanceof FlightPlan) {
                    this.setFixInfoEntry(event.index, event.fixInfo, false);

                    this.incrementVersion();
                }
            }
        }));
    }

    destroy() {
        for (const subscription of this.subscriptions) {
            subscription.destroy();
        }
    }

    get legCount() {
        return this.allLegs.length;
    }

    get lastIndex() {
        return Math.max(0, this.legCount - 1);
    }

    get firstMissedApproachLegIndex() {
        return this.allLegs.length - this.missedApproachSegment.allLegs.length;
    }

    get firstApproachLegIndex() {
        return this.firstMissedApproachLegIndex - this.approachSegment.allLegs.length;
    }

    activeLegIndex = 0;

    get activeLeg(): FlightPlanElement {
        return this.allLegs[this.activeLegIndex];
    }

    get isApproachActive(): boolean {
        // `this.approach` can be undefined for runway-by-itself approaches
        return this.approach !== undefined && this.activeLegIndex >= this.firstApproachLegIndex && this.activeLegIndex < this.firstMissedApproachLegIndex;
    }

    /**
     * Finds the index of the first XF leg whose fix has the same ident as the ident provided, or -1 if none is found
     *
     * @param ident the ident to look for
     */
    findLegIndexByFixIdent(ident: string): number {
        for (let i = 0; i < this.allLegs.length; i++) {
            const element = this.allLegs[i];

            if (element.isDiscontinuity === true) {
                continue;
            }

            if (!element.isXF()) {
                continue;
            }

            if (element.terminationWaypoint().ident !== ident) {
                continue;
            }

            return i;
        }

        return -1;
    }

    sequence() {
        this.incrementVersion();

        if (this.activeLeg.isDiscontinuity === false && this.activeLeg.definition.approachWaypointDescriptor === ApproachWaypointDescriptor.MissedApproachPoint) {
            this.enrouteSegment.allLegs.length = 0;

            const cloneMissedApproachPointLeg = this.activeLeg.clone(this.enrouteSegment);
            const clonedMissedApproachLegs = this.missedApproachSegment.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(this.enrouteSegment) : it));

            cloneMissedApproachPointLeg.type = LegType.IF;
            this.enrouteSegment.allLegs.push(cloneMissedApproachPointLeg);
            this.enrouteSegment.allLegs.push(...clonedMissedApproachLegs);
            this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
            this.enrouteSegment.strung = true;
            this.enrouteSegment.isSequencedMissedApproach = true;

            this.syncSegmentLegsChange(this.enrouteSegment);

            // We don't have to await any of this because of how we use it, but this might be something to clean up in the future

            this.arrivalSegment.setProcedure(undefined);

            this.approachSegment.setProcedure(this.approachSegment.procedure?.ident);
            this.approachViaSegment.setProcedure(this.approachViaSegment.procedure?.ident);

            this.enqueueOperation(FlightPlanQueuedOperation.Restring);
            this.flushOperationQueue().then(() => {
                const activeIndex = this.allLegs.findIndex((it) => it === clonedMissedApproachLegs[0]);

                this.activeLegIndex = activeIndex;

                this.sendEvent('flightPlan.setActiveLegIndex', { planIndex: this.index, forAlternate: this instanceof AlternateFlightPlan, activeLegIndex: activeIndex });
            });
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

    sendPerfEvent<K extends keyof PerformanceDataFlightPlanSyncEvents<P>>(topic: K, data: PerformanceDataFlightPlanSyncEvents<P>[K]) {
        this.ignoreSync = true;
        this.perfSyncPub.pub(topic, data, true, false);
        this.ignoreSync = false;
    }

    syncSegmentLegsChange(segment: FlightPlanSegment) {
        const segmentIndex = this.orderedSegments.indexOf(segment);

        const legs = segment.allLegs.map((it) => (it.isDiscontinuity === false ? it.serialize() : it));

        console.log(`[FpSync] SyncSegmentLegs(${segment.constructor.name})`);

        this.sendEvent('flightPlan.setSegmentLegs', { planIndex: this.index, forAlternate: false, segmentIndex, legs });
    }

    syncLegDefinitionChange(atIndex: number) {
        const leg = this.elementAt(atIndex);

        if (leg.isDiscontinuity === false) {
            this.sendEvent('flightPlan.legDefinitionEdit', { planIndex: this.index, atIndex, forAlternate: this instanceof AlternateFlightPlan, newDefinition: leg.definition });
        }
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

    hasElement(index: number): boolean {
        return index >= 0 && index < this.allLegs.length;
    }

    elementAt(index: number): FlightPlanElement {
        const legs = this.allLegs;

        if (index < 0 || index >= legs.length) {
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

    /**
     * @deprecated this needs to be refactored into something harmonized with the VNAV profile
     */
    public computeWaypointStatistics(): Map<number, WaypointStats> {
        // TODO port over (fms-v2)

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
    private previousSegment(before: FlightPlanSegment) {
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
    private nextSegment(after: FlightPlanSegment) {
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

    protected replaceSegment(segment: FlightPlanSegment) {
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

        if (this instanceof FlightPlan) {
            this.setPerformanceData('databaseTransitionAltitude', this.originAirport.transitionAltitude);
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
        return this.departureRunwayTransitionSegment.procedure;
    }

    get originDeparture(): Departure {
        return this.departureSegment.originDeparture;
    }

    async setDeparture(procedureIdent: string | undefined) {
        await this.departureSegment.setProcedure(procedureIdent).then(() => this.incrementVersion());

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get departureEnrouteTransition(): ProcedureTransition {
        return this.departureEnrouteTransitionSegment.procedure;
    }

    /**
     * Sets the departure enroute transition
     *
     * @param transitionIdent the transition ident or `undefined` for NONE
     */
    async setDepartureEnrouteTransition(transitionIdent: string | undefined) {
        await this.departureEnrouteTransitionSegment.setProcedure(transitionIdent);

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get arrivalEnrouteTransition(): ProcedureTransition {
        return this.arrivalEnrouteTransitionSegment.procedure;
    }

    /**
     * Sets the arrival enroute transition
     *
     * @param transitionIdent the transition ident or `undefined` for NONE
     */
    async setArrivalEnrouteTransition(transitionIdent: string | undefined) {
        await this.arrivalEnrouteTransitionSegment.setProcedure(transitionIdent);

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get arrival() {
        return this.arrivalSegment.procedure;
    }

    async setArrival(procedureIdent: string | undefined) {
        await this.arrivalSegment.setProcedure(procedureIdent).then(() => this.incrementVersion());

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get arrivalRunwayTransition() {
        return this.arrivalRunwayTransitionSegment.procedure;
    }

    get approachVia() {
        return this.approachViaSegment.procedure;
    }

    /**
     * Sets the approach via
     *
     * @param transitionIdent the transition ident or `undefined` for NONE
     */
    async setApproachVia(transitionIdent: string | undefined) {
        await this.approachViaSegment.setProcedure(transitionIdent);

        await this.flushOperationQueue();
        this.incrementVersion();
    }

    get approach() {
        return this.approachSegment.procedure;
    }

    async setApproach(procedureIdent: string | undefined) {
        await this.approachSegment.setProcedure(procedureIdent).then(() => this.incrementVersion());

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

    async setDestinationRunway(runwayIdent: string | undefined) {
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

        if (index > 0) {
            const previousElement = this.elementAt(index - 1);

            if (previousElement.isDiscontinuity === false) {
                // Not allowed to clear disco after MANUAL
                if (previousElement.isVectors()) {
                    return false;
                }

                if (insertDiscontinuity) {
                    segment.allLegs.splice(indexInSegment, 1, { isDiscontinuity: true });
                } else {
                    segment.allLegs.splice(indexInSegment, 1);
                }

                if (previousElement.isXI()) {
                    segment.allLegs.splice(indexInSegment - 1, 1);
                }
            } else {
                segment.allLegs.splice(indexInSegment, 1);
            }
        } else {
            segment.allLegs.splice(indexInSegment, 1);
        }

        this.syncSegmentLegsChange(segment);

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

    autoConstraintTypeForLegIndex(index: number): WaypointConstraintType {
        const [segment] = this.segmentPositionForIndex(index);

        switch (segment) {
        case this.originSegment:
        case this.departureRunwayTransitionSegment:
        case this.departureSegment:
        case this.departureEnrouteTransitionSegment:
            return WaypointConstraintType.CLB;
        case this.arrivalEnrouteTransitionSegment:
        case this.arrivalSegment:
        case this.arrivalRunwayTransitionSegment:
        case this.approachViaSegment:
        case this.approachSegment:
            return WaypointConstraintType.DES;
        default:
            return WaypointConstraintType.Unknown;
        }
    }

    glideslopeIntercept(): number | undefined {
        for (const leg of this.approachSegment.allLegs) {
            if (leg.isDiscontinuity === false
                && leg.definition.approachWaypointDescriptor === ApproachWaypointDescriptor.FinalApproachFix
                && (leg.definition.altitudeDescriptor === AltitudeDescriptor.AtAlt1GsMslAlt2 || leg.definition.altitudeDescriptor === AltitudeDescriptor.AtOrAboveAlt1GsMslAlt2)) {
                return leg.definition.altitude2;
            }
        }

        return undefined;
    }

    /**
     * Inserts a waypoint before a leg at an index.
     *
     * @param index the index of the leg to insert the waypoint before
     * @param waypoint the waypoint to insert
     */
    async insertWaypointBefore(index: number, waypoint: Fix) {
        const [insertSegment, insertIndexInSegment] = this.segmentPositionForIndex(index);

        const prependInMissedApproach = insertSegment === this.missedApproachSegment && insertIndexInSegment === 0;

        if (!prependInMissedApproach) {
            this.redistributeLegsAt(index - 1);
        }

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
        const redistributeIndex = index + 1 < (this.legCount - 1) ? index + 1 : index;

        const truncateDirection = this.redistributeLegsAt(redistributeIndex); // NEXT WPT revises the leg that comes after the target leg

        const leg = FlightPlanLeg.fromEnrouteFix(this.enrouteSegment, waypoint, undefined, LegType.DF);

        const waypointExists = this.findDuplicate(waypoint, index);

        const [newSegment] = this.segmentPositionForIndex(index + 1);

        if (truncateDirection === 1 && newSegment instanceof EnrouteSegment) {
            // redistributeLegsAt caused the leg at (index + 1) to now be in the enroute segment, and this change applied forwards.
            // We need to do insertElementBefore on the next segment instead

            await this.insertElementBefore(index + 1, leg, !waypointExists);
        } else {
            await this.insertElementAfter(index, leg, !waypointExists);
        }
    }

    /**
     * NEW DEST revision. Changes the destination airport and removes all routing ahead of an index, with a discontinuity in between.
     *
     * @param index the index of the leg to insert the waypoint after
     * @param airportIdent the airport to use as the new destination
     */
    async newDest(index: number, airportIdent: string) {
        this.redistributeLegsAt(index);

        const leg = this.legElementAt(index);
        const legIndexInEnroute = this.enrouteSegment.allLegs.indexOf(leg);

        const legsToDelete = this.enrouteSegment.allLegs.length - (legIndexInEnroute + 1);

        await this.setApproach(undefined);
        await this.setApproachVia(undefined);
        await this.setArrivalEnrouteTransition(undefined);
        await this.setArrival(undefined);
        await this.setDestinationAirport(airportIdent);
        await this.setDestinationRunway(undefined);

        this.enrouteSegment.allLegs.splice(legIndexInEnroute + 1, legsToDelete);

        if (this.enrouteSegment.allLegs[this.enrouteSegment.legCount - 1].isDiscontinuity === false) {
            this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
        }
        this.enrouteSegment.strung = true;

        await this.flushOperationQueue();
    }

    startAirwayEntry(revisedLegIndex: number) {
        const leg = this.elementAt(revisedLegIndex);

        if (leg.isDiscontinuity === true) {
            throw new Error('Cannot start airway entry at a discontinuity');
        }

        if (!leg.isXF() && !leg.isHX()) {
            throw new Error('Cannot create a pending airways entry from a non XF or HX leg');
        }

        this.pendingAirways = new PendingAirways(this, revisedLegIndex, leg);
    }

    async addOrEditManualHold(atIndex: number, desiredHold: HoldData, modifiedHold: HoldData, defaultHold: HoldData): Promise<number> {
        const targetLeg = this.elementAt(atIndex);

        if (targetLeg.isDiscontinuity === true) {
            throw new Error('[FPM] Target leg of a direct to cannot be a discontinuity');
        }

        const waypoint = targetLeg.terminationWaypoint();

        if (targetLeg.type === LegType.HA || targetLeg.type === LegType.HF || targetLeg.type === LegType.HM) {
            targetLeg.type = LegType.HM;
            targetLeg.definition.turnDirection = desiredHold.turnDirection;
            targetLeg.definition.magneticCourse = desiredHold.inboundMagneticCourse;
            targetLeg.definition.length = desiredHold.distance;
            targetLeg.definition.lengthTime = desiredHold.time;

            targetLeg.modifiedHold = modifiedHold;
            if (targetLeg.defaultHold === undefined) {
                targetLeg.defaultHold = defaultHold;
            }

            return atIndex;
        }

        const manualHoldLeg = FlightPlanLeg.manualHold(this.enrouteSegment, waypoint, desiredHold);

        manualHoldLeg.modifiedHold = modifiedHold;
        manualHoldLeg.defaultHold = defaultHold;

        await this.insertElementAfter(atIndex, manualHoldLeg);

        return atIndex + 1;
    }

    revertHoldToComputed(atIndex: number) {
        const targetLeg = this.elementAt(atIndex);

        if (targetLeg.isDiscontinuity === true || !targetLeg.isHX()) {
            throw new Error('[FPM] Target leg of a direct to cannot be a discontinuity or a non-HX leg');
        }

        targetLeg.modifiedHold = undefined;
    }

    // TODO make this private, adjust tests to test nextWaypoint instead
    async insertElementAfter(index: number, element: FlightPlanElement, insertDiscontinuity = false) {
        if (index < 0 || index > this.allLegs.length) {
            throw new Error(`[FMS/FPM] Tried to insert waypoint out of bounds (index=${index})`);
        }

        let insertSegment: FlightPlanSegment;
        let insertIndexInSegment: number;

        if (this.legCount > 0) {
            [insertSegment, insertIndexInSegment] = this.segmentPositionForIndex(index);
        } else {
            insertSegment = this.enrouteSegment;
            insertIndexInSegment = 0;
        }

        const prependInMissedApproach = insertSegment === this.approachSegment && insertIndexInSegment === this.approachSegment.allLegs.length - 1;

        if (prependInMissedApproach) {
            insertSegment = this.missedApproachSegment;
            insertIndexInSegment = 0;

            // If we are inserting after the last leg of the approach (the missed approach point, we really
            // want to insert before the first leg of the missed approach

            insertSegment.insertBefore(insertIndexInSegment, element);
        } else {
            insertSegment.insertAfter(insertIndexInSegment, element);
        }

        if (insertDiscontinuity) {
            this.incrementVersion();

            const elementAfterInserted = this.allLegs[index + 2];

            if (elementAfterInserted && elementAfterInserted.isDiscontinuity === false) {
                if (prependInMissedApproach) {
                    insertSegment.insertAfter(insertIndexInSegment, { isDiscontinuity: true });
                } else {
                    insertSegment.insertAfter(insertIndexInSegment + 1, { isDiscontinuity: true });
                }

                this.incrementVersion();
            }
        }

        this.enqueueOperation(FlightPlanQueuedOperation.Restring);
        await this.flushOperationQueue();
        this.incrementVersion();
    }

    private async insertElementBefore(index: number, element: FlightPlanElement, insertDiscontinuity = false) {
        if (index < 1 || index > this.allLegs.length) {
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

        startSegment.insertBefore(indexInStartSegment, element);

        if (insertDiscontinuity) {
            this.incrementVersion();

            const elementAfterInserted = startSegment.allLegs[indexInStartSegment + 1];

            if (elementAfterInserted.isDiscontinuity === false) {
                startSegment.insertBefore(indexInStartSegment + 1, { isDiscontinuity: true });
                this.incrementVersion();
            }
        }

        this.enqueueOperation(FlightPlanQueuedOperation.Restring);
        await this.flushOperationQueue();
        this.incrementVersion();
    }

    editLegDefinition(index: number, changes: Partial<FlightPlanLegDefinition>, notify = true): void {
        const leg = this.legElementAt(index);

        Object.assign(leg.definition, changes);

        if (notify) {
            this.syncLegDefinitionChange(index);
        }
    }

    setOverflyAt(index: number, overfly: boolean): void {
        const leg = this.legElementAt(index);

        leg.definition.overfly = overfly;

        this.incrementVersion();

        this.syncLegDefinitionChange(index);
    }

    toggleOverflyAt(index: number): void {
        const leg = this.legElementAt(index);

        leg.definition.overfly = !leg.definition.overfly;

        this.incrementVersion();

        this.syncLegDefinitionChange(index);
    }

    setPilotEnteredAltitudeConstraintAt(index: number, isDescentConstraint: boolean, constraint?: AltitudeConstraint) {
        const element = this.elementAt(index);

        if (element.isDiscontinuity === true) {
            return;
        }

        element.pilotEnteredAltitudeConstraint = constraint;
        if (!constraint) {
            element.definition.altitudeDescriptor = AltitudeDescriptor.None;
            element.definition.altitude1 = undefined;
            element.definition.altitude2 = undefined;
        }

        this.syncLegDefinitionChange(index);

        if (isDescentConstraint) {
            this.setFirstDesConstraintWaypoint(index);
        } else {
            this.setLastClbConstraintWaypoint(index);
        }

        this.incrementVersion();
    }

    setPilotEnteredSpeedConstraintAt(index: number, isDescentConstraint: boolean, constraint?: SpeedConstraint) {
        const element = this.elementAt(index);

        if (element.isDiscontinuity === true) {
            return;
        }

        element.pilotEnteredSpeedConstraint = constraint;
        if (!constraint) {
            element.definition.speedDescriptor = undefined;
            element.definition.speed = undefined;
        }

        this.syncLegDefinitionChange(index);

        if (isDescentConstraint) {
            this.setFirstDesConstraintWaypoint(index);
        } else {
            this.setLastClbConstraintWaypoint(index);
        }

        this.incrementVersion();
    }

    setAltitudeDescriptionAt(index: number, value: AltitudeDescriptor) {
        const element = this.elementAt(index);

        if (element.isDiscontinuity === true) {
            return;
        }

        element.definition.altitudeDescriptor = value;
        this.syncLegDefinitionChange(index);

        this.incrementVersion();
    }

    setAltitudeAt(index: number, value: number, isDescentConstraint?: boolean) {
        const element = this.elementAt(index);

        if (element.isDiscontinuity === true) {
            return;
        }

        element.definition.altitude1 = value;
        this.syncLegDefinitionChange(index);

        if (element.constraintType === WaypointConstraintType.Unknown) {
            if (isDescentConstraint) {
                this.setFirstDesConstraintWaypoint(index);
            } else {
                this.setLastClbConstraintWaypoint(index);
            }
        }

        this.incrementVersion();
    }

    setSpeedAt(index: number, value: number, isDescentConstraint?: boolean) {
        const element = this.elementAt(index);

        if (element.isDiscontinuity === true) {
            return;
        }

        element.definition.speed = value;
        this.syncLegDefinitionChange(index);

        if (isDescentConstraint) {
            this.setFirstDesConstraintWaypoint(index);
        } else {
            this.setLastClbConstraintWaypoint(index);
        }

        this.incrementVersion();
    }

    addOrUpdateCruiseStep(index: number, toAltitude: number) {
        const leg = this.legElementAt(index);

        leg.cruiseStep = {
            distanceBeforeTermination: 0,
            toAltitude,
            waypointIndex: index,
            isIgnored: false,
        };
        this.sendEvent('flightPlan.setLegCruiseStep', { planIndex: this.index, forAlternate: this instanceof AlternateFlightPlan, atIndex: index, cruiseStep: leg.cruiseStep });

        this.unignoreAllCruiseSteps();

        this.incrementVersion();
    }

    removeCruiseStep(index: number) {
        const leg = this.legElementAt(index);

        leg.cruiseStep = undefined;
        this.sendEvent('flightPlan.setLegCruiseStep', { planIndex: this.index, forAlternate: this instanceof AlternateFlightPlan, atIndex: index, cruiseStep: undefined });

        this.unignoreAllCruiseSteps();

        this.incrementVersion();
    }

    private unignoreAllCruiseSteps() {
        for (let i = 0; i < this.allLegs.length; i++) {
            const element = this.allLegs[i];

            if (element.isDiscontinuity === true) {
                continue;
            }

            if (!element.cruiseStep) {
                continue;
            }

            element.cruiseStep.isIgnored = false;
            this.sendEvent('flightPlan.setLegCruiseStep', { planIndex: this.index, forAlternate: this instanceof AlternateFlightPlan, atIndex: i, cruiseStep: element.cruiseStep });
        }
    }

    private setLastClbConstraintWaypoint(index: number) {
        for (let i = index; i >= (index >= this.firstMissedApproachLegIndex ? this.firstMissedApproachLegIndex : 0); i--) {
            const element = this.elementAt(i);

            if (element && element.isDiscontinuity === false) {
                element.constraintType = WaypointConstraintType.CLB;
            }
        }
    }

    private setFirstDesConstraintWaypoint(index: number) {
        for (let i = index; i < this.firstMissedApproachLegIndex; i++) {
            const element = this.elementAt(i);

            if (element && element.isDiscontinuity === false) {
                element.constraintType = WaypointConstraintType.DES;
            }
        }
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
    redistributeLegsAt(index: number): number {
        if (!this.hasElement(index)) {
            return 0;
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
                const removed = this.departureRunwayTransitionSegment.clear();

                toInsertInEnroute.push(...removed);
            }

            if (segment === this.departureSegment) {
                emptyAllNext = true;

                toInsertInEnroute.push(...this.departureSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.departureSegment.clear();

                this.syncSegmentLegsChange(this.departureSegment);

                toInsertInEnroute.push(...removed);
            }

            if (segment === this.departureEnrouteTransitionSegment) {
                toInsertInEnroute.push(...this.departureEnrouteTransitionSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.departureEnrouteTransitionSegment.clear();

                this.syncSegmentLegsChange(this.departureEnrouteTransitionSegment);

                toInsertInEnroute.push(...removed);
            }

            for (const element of toInsertInEnroute) {
                if (element.isDiscontinuity === false) {
                    element.segment = this.enrouteSegment;
                }
            }

            this.enrouteSegment.allLegs.unshift(...toInsertInEnroute);
            this.syncSegmentLegsChange(this.enrouteSegment);

            return 1;
        }

        if (segment.class === SegmentClass.Arrival) {
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
                const removed = this.approachViaSegment.clear();

                toInsertInEnroute.unshift(...removed);
            }

            if (segment === this.arrivalRunwayTransitionSegment) {
                emptyAllNext = true;

                toInsertInEnroute.unshift(...this.arrivalRunwayTransitionSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.arrivalRunwayTransitionSegment.clear();

                toInsertInEnroute.unshift(...removed);
            }

            if (segment === this.arrivalSegment) {
                emptyAllNext = true;

                toInsertInEnroute.unshift(...this.arrivalSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.arrivalSegment.clear();

                toInsertInEnroute.unshift(...removed);
            }

            if (segment === this.arrivalEnrouteTransitionSegment) {
                toInsertInEnroute.unshift(...this.arrivalEnrouteTransitionSegment.truncate(indexInSegment));
            } else if (emptyAllNext) {
                const removed = this.arrivalEnrouteTransitionSegment.clear();

                toInsertInEnroute.unshift(...removed);
            }

            for (const element of toInsertInEnroute) {
                if (element.isDiscontinuity === false) {
                    element.segment = this.enrouteSegment;
                }
            }

            this.enrouteSegment.allLegs.push(...toInsertInEnroute);
            this.syncSegmentLegsChange(this.enrouteSegment);

            return -1;
        }

        // Do nothing

        return 0;
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

        this.ensureNoDiscontinuityAsFinalElement();

        this.incrementVersion();

        this.ensureNoDuplicates();
        this.adjustIFLegs();

        this.incrementVersion();
    }

    private stringSegmentsForwards(first: FlightPlanSegment, second: FlightPlanSegment) {
        if (!first || !second || first.strung || first.allLegs.length === 0 || second.allLegs.length === 0 || (second instanceof EnrouteSegment && second.isSequencedMissedApproach)) {
            return;
        }

        const lastElementInFirst = first.allLegs[first.allLegs.length - 1];
        let lastLegInFirst = lastElementInFirst;

        if (lastLegInFirst?.isDiscontinuity === true) {
            lastLegInFirst = first.allLegs[first.allLegs.length - 2];

            if (!lastLegInFirst || lastLegInFirst?.isDiscontinuity === true) {
                return;
            }
        }

        if (first instanceof OriginSegment && first.lastLeg?.waypointDescriptor === WaypointDescriptor.Runway) {
            // Always string origin with only a runway to next segment
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

        const originAndDestination = first instanceof OriginSegment && second instanceof DestinationSegment;

        let cutBefore = -1;
        if (!originAndDestination) {
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
        }

        // If no matching leg is found, insert a discontinuity (if there isn't one already) at the end of the first segment
        if (cutBefore === -1 || originAndDestination) {
            if (lastElementInFirst.isDiscontinuity === false && second.allLegs[0]?.isDiscontinuity === false) {
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
            const prevElement = elements[i - 1];
            const element = elements[i];

            // IF -> XX if no discontinuity before, and element present
            if (i !== 0 && element && element.isDiscontinuity === false && element.type === LegType.IF) {
                if (prevElement && prevElement.isDiscontinuity === true) {
                    continue;
                }

                if (element.definition.type === LegType.IF && element.ident !== 'T-P') {
                    element.type = LegType.TF;
                } else {
                    element.type = element.definition.type;
                }
            }

            // XX -> IF if no element, or discontinuity before, or 0th leg
            if (element && element.isDiscontinuity === false && element.type !== LegType.IF) {
                if (!prevElement || (prevElement && prevElement.isDiscontinuity === true) || i === 0) {
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

                    // We can have duplicates in or after an enroute which is a sequenced missed approach and another segment
                    if ((segment instanceof EnrouteSegment && segment.isSequencedMissedApproach)
                        || (duplicateSegment instanceof EnrouteSegment && duplicateSegment.isSequencedMissedApproach)
                    ) {
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

    /**
     * Removes discontinuities at the very end of the flightplan
     * During stringing, discontinuities are inserted after VM/FM legs, this is correct, except at the very end
     * Sometimes missed approach procedures end in VM/FM legs and we don't want to show a discontinuity after them
     */
    private ensureNoDiscontinuityAsFinalElement() {
        const orderedSegments = this.orderedSegments;
        for (let i = orderedSegments.length - 1; i >= 0; i--) {
            const segment = orderedSegments[i];

            if (segment.legCount === 0) {
                continue;
            }

            let numIterations = 0;
            while (segment.legCount > 0 && segment.allLegs[segment.legCount - 1].isDiscontinuity === true && numIterations++ < 10) {
                segment.allLegs.pop();
            }

            break;
        }
    }

    private arrivalAndApproachSegmentsBeingRebuilt = false;

    private async rebuildArrivalAndApproachSegments() {
        // We call the segment functions here, otherwise we infinitely enqueue restrings and rebuilds since calling
        // the methods on BaseFlightPlan flush the op queue

        this.arrivalAndApproachSegmentsBeingRebuilt = true;

        if (this.approach) {
            await this.approachSegment.setProcedure(this.approach.ident);
        }

        if (this.approachVia) {
            await this.approachViaSegment.setProcedure(this.approachVia.ident);
        }

        if (this.arrival) {
            await this.arrivalSegment.setProcedure(this.arrival.ident);
        }

        if (this.arrivalEnrouteTransition) {
            await this.arrivalEnrouteTransitionSegment.setProcedure(this.arrivalEnrouteTransition.ident);
        }

        const previousSegmentToArrival = this.previousSegment(this.arrivalEnrouteTransitionSegment);
        if (previousSegmentToArrival && previousSegmentToArrival.allLegs[previousSegmentToArrival.legCount - 1].isDiscontinuity === true) {
            previousSegmentToArrival.strung = false;
        }

        await this.destinationSegment.refresh(false);
    }

    /**
     * Removes all legs between start and end
     *
     * @param start start of the range, inclusive
     * @param end end of the range, exclusive
     */
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

    serialize(): SerializedFlightPlan {
        return {
            activeLegIndex: this.activeLegIndex,

            fixInfo: this instanceof FlightPlan ? this.fixInfos : [],

            performanceData: this instanceof FlightPlan ? this.performanceData.serialize() : undefined,

            segments: {
                originSegment: this.originSegment.serialize(),
                departureRunwayTransitionSegment: this.departureRunwayTransitionSegment.serialize(),
                departureSegment: this.departureSegment.serialize(),
                departureEnrouteTransitionSegment: this.departureEnrouteTransitionSegment.serialize(),
                enrouteSegment: this.enrouteSegment.serialize(),
                arrivalEnrouteTransitionSegment: this.arrivalEnrouteTransitionSegment.serialize(),
                arrivalSegment: this.arrivalSegment.serialize(),
                arrivalRunwayTransitionSegment: this.arrivalRunwayTransitionSegment.serialize(),
                approachViaSegment: this.approachViaSegment.serialize(),
                approachSegment: this.approachSegment.serialize(),
                destinationSegment: this.destinationSegment.serialize(),
                missedApproachSegment: this.missedApproachSegment.serialize(),
            },

            alternateFlightPlan: this instanceof FlightPlan ? this.alternateFlightPlan.serialize() : undefined,
        };
    }

    /**
     * Finds the lowest climb constraint in the flight plan
     * @returns the lowest climb constraint in feet or Infinity if none
     */
    protected lowestClimbConstraint(): number {
        let lowestClimbConstraint = Infinity;
        for (let i = 0; i < this.firstMissedApproachLegIndex; i++) {
            const leg = this.allLegs[i];
            if (leg.isDiscontinuity === true) {
                continue;
            }

            const climbConstraint = leg.constraintType === WaypointConstraintType.CLB ? ConstraintUtils.maximumAltitude(leg.altitudeConstraint) : Infinity;
            if (climbConstraint < lowestClimbConstraint) {
                lowestClimbConstraint = climbConstraint;
            }
        }

        return lowestClimbConstraint;
    }
}

export interface SerializedFlightPlan {
    activeLegIndex: number,

    fixInfo: readonly FixInfoEntry[],

    performanceData?: SerializedFlightPlanPerformanceData,

    segments: {
        originSegment: SerializedFlightPlanSegment,
        departureRunwayTransitionSegment: SerializedFlightPlanSegment,
        departureSegment: SerializedFlightPlanSegment,
        departureEnrouteTransitionSegment: SerializedFlightPlanSegment,
        enrouteSegment: SerializedFlightPlanSegment,
        arrivalEnrouteTransitionSegment: SerializedFlightPlanSegment,
        arrivalSegment: SerializedFlightPlanSegment,
        arrivalRunwayTransitionSegment: SerializedFlightPlanSegment,
        approachViaSegment: SerializedFlightPlanSegment,
        approachSegment: SerializedFlightPlanSegment,
        destinationSegment: SerializedFlightPlanSegment,
        missedApproachSegment: SerializedFlightPlanSegment,
    },

    alternateFlightPlan?: SerializedFlightPlan,
}
