// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    Airport,
    Approach,
    Arrival,
    Departure,
    LegType,
    ProcedureTransition,
    Runway, Waypoint,
    WaypointDescriptor,
} from 'msfs-navdata';
import { OriginSegment } from '@fmgc/flightplanning/new/segments/OriginSegment';
import { FlightPlanElement } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
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

export enum FlightPlanQueuedOperation {
    Restring,
    RebuildArrivalAndApproach,
}

export abstract class BaseFlightPlan {
    get legCount() {
        return this.allLegs.length;
    }

    get lastIndex() {
        return Math.max(0, this.legCount - 1);
    }

    get firstMissedApproachLeg() {
        return this.allLegs.length - this.missedApproachSegment.allLegs.length;
    }

    activeLegIndex = 1;

    get activeLeg(): FlightPlanElement {
        return this.allLegs[this.activeLegIndex];
    }

    sequence() {
        this.activeLegIndex++;
    }

    version = 0;

    incrementVersion() {
        this.version++;
    }

    queuedOperations: FlightPlanQueuedOperation[] = [];

    enqueueOperation(op: FlightPlanQueuedOperation): void {
        const existing = this.queuedOperations.find((it) => it === op);

        if (!existing) {
            this.queuedOperations.push(op);
        }
    }

    async flushOperationQueue() {
        for (const operation of this.queuedOperations) {
            switch (operation) {
            case FlightPlanQueuedOperation.Restring:
                this.restring();
                break;
            case FlightPlanQueuedOperation.RebuildArrivalAndApproach:
                // eslint-disable-next-line no-await-in-loop
                await this.rebuildArrivalAndApproachSegments();
                break;
            default:
                console.error(`Unknown queue operation: ${operation}`);
            }
        }

        this.queuedOperations.length = 0;
    }

    originSegment = new OriginSegment(this);

    departureRunwayTransitionSegment = new DepartureRunwayTransitionSegment(this);

    departureSegment = new DepartureSegment(this);

    departureEnrouteTransitionSegment = new DepartureEnrouteTransitionSegment(this);

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
        return this.originSegment.allLegs[0];
    }

    get destinationLeg() {
        return this.elementAt(this.destinationLegIndex);
    }

    get endsAtRunway() {
        if (this.approachSegment.allLegs.length === 0) {
            return true;
        }

        const lastApproachLeg = this.approachSegment.allLegs[this.approachSegment.allLegs.length - 1];

        return lastApproachLeg && lastApproachLeg.isDiscontinuity === false && lastApproachLeg.definition.waypointDescriptor === WaypointDescriptor.Runway;
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

    maybeElementAt(index: number): FlightPlanElement {
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

    protected get orderedSegments() {
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

    get originAirport(): Airport {
        return this.originSegment.originAirport;
    }

    async setOriginAirport(icao: string) {
        await this.originSegment.setOriginIcao(icao);
        await this.departureSegment.setDepartureProcedure(undefined);
        this.enrouteSegment.allLegs.length = 0;
        await this.arrivalSegment.setArrivalProcedure(undefined);
        await this.approachSegment.setApproachProcedure(undefined);

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

    async setDestinationAirport(icao: string) {
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

    insertElementAfter(index: number, element: FlightPlanElement, insertDiscontinuity = false) {
        if (index < 0 || index > this.allLegs.length) {
            throw new Error(`[FMS/FPM] Tried to insert waypoint out of bounds (index=${index})`);
        }

        let startSegment;
        let indexInStartSegment;

        if (this.legCount > 0) {
            [startSegment, indexInStartSegment] = this.segmentPositionForIndex(index);
        } else {
            startSegment = this.enrouteSegment;
            indexInStartSegment = 0;
        }

        startSegment.insertAfter(indexInStartSegment, element);

        if (insertDiscontinuity) {
            startSegment.insertAfter(indexInStartSegment + 1, { isDiscontinuity: true });

            this.incrementVersion();
            return;
        }

        if (element.isDiscontinuity === false && element.isXF()) {
            const duplicate = this.findDuplicate(element.terminationWaypoint(), index + 1);

            if (duplicate) {
                const [,, duplicatePlanIndex] = duplicate;

                this.removeRange(index + 2, duplicatePlanIndex + 1);
            }
        }

        this.incrementVersion();
        this.redistributeLegsAt(index + 1);
    }

    private findDuplicate(waypoint: Waypoint, afterIndex?: number): [FlightPlanSegment, number, number] | null {
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

        if (segment.class === SegmentClass.Departure) {
            const toInsertInEnroute: FlightPlanElement[] = [];

            let emptyAllNext = false;

            if (segment === this.departureRunwayTransitionSegment) {
                emptyAllNext = true;

                toInsertInEnroute.push(...this.departureRunwayTransitionSegment.truncate(indexInSegment));
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

        if (lastLegInFirst.type === LegType.IF) {
            // Always connect if first segment end with an IF leg
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
            }

            first.strung = false;
            return;
        }

        // Otherwise, clear a possible discontinuity and remove all elements before the matching leg and the last leg of the first segment
        if (lastElementInFirst.isDiscontinuity === true) {
            first.allLegs.pop();
        }

        for (let i = 0; i < cutBefore; i++) {
            second.allLegs.shift();
        }

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

                if (element.definition.type === LegType.IF) {
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

        await this.destinationSegment.refresh(false);
    }

    public removeRange(start: number, end: number) {
        const [startSegment, indexInStartSegment] = this.segmentPositionForIndex(start);
        const [endSegment, indexInEndSegment] = this.segmentPositionForIndex(end);

        if (!startSegment || !endSegment) {
            throw new Error('[FMS/FPM] Range out of bounds');
        }

        if (startSegment === endSegment) {
            startSegment.removeRange(indexInStartSegment, indexInEndSegment);
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
                    segment.removeBefore(indexInEndSegment);
                    return;
                }

                segment.allLegs.length = 0;
            }
        }
    }
}
