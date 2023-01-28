// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Fix, LegType } from 'msfs-navdata';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';

export abstract class FlightPlanSegment {
    abstract class: SegmentClass

    /**
     * All the leg contained in this segment
     */
    abstract get allLegs(): FlightPlanElement[]

    abstract set allLegs(legs: FlightPlanElement[])

    get legCount() {
        return this.allLegs.length;
    }

    /**
     * Returns the last non-discontinuity leg
     */
    get lastLeg() {
        for (let i = this.allLegs.length - 1; i >= 0; i--) {
            const element = this.allLegs[i];

            if (element.isDiscontinuity === false) {
                return element as FlightPlanLeg;
            }
        }

        return undefined;
    }

    /**
     * Whether the segment has already been strung
     */
    strung = false

    constructor(
        public readonly flightPlan: BaseFlightPlan,
    ) {
    }

    /**
     * Creates an identical copy of this segment
     *
     * @param forPlan the (new) flight plan for which the segment is being cloned
     */
    abstract clone(forPlan: BaseFlightPlan): FlightPlanSegment

    /**
     * Inserts an element at a specified index, not checking for duplicates
     *
     * @param index   the index to insert the element at
     * @param element the element to insert
     */
    insertAfter(index: number, element: FlightPlanElement) {
        this.allLegs.splice(index + 1, 0, element);

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    }

    /**
     * Removes all legs including and after `fromIndex` from the segment and merges them into the enroute segment
     *
     * @param atPoint
     */
    truncate(atPoint: number): FlightPlanElement[] {
        if (this.class === SegmentClass.Departure) {
            // Move legs after cut to enroute
            const removed = this.allLegs.splice(atPoint);

            this.flightPlan.syncSegmentLegsChange(this);
            this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
            return removed;
        }

        if (this.class === SegmentClass.Arrival) {
            // Move legs before cut to enroute
            const removed = [];
            for (let i = 0; i < atPoint + 1; i++) {
                removed.push(this.allLegs.shift());
            }

            this.flightPlan.syncSegmentLegsChange(this);
            this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
            return removed;
        }

        throw new Error(`[FMS/FPM] Cannot truncate segment of class '${SegmentClass[this.class]}'`);
    }

    /**
     * Removes all legs between from and to
     *
     * @param from start of the range, inclusive
     * @param to   end of the range, exclusive
     */
    removeRange(from: number, to: number) {
        this.allLegs.splice(from, to - from);

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    }

    /**
     * Removes all legs before to
     *
     * @param before end of the range, exclusive
     */
    removeBefore(before: number) {
        for (let i = 0; i < before; i++) {
            this.allLegs.shift();
        }

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    }

    /**
     * Removes all legs after from
     *
     * @param from start of the range, inclusive
     */
    removeAfter(from: number) {
        this.allLegs.splice(from);

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    }

    insertNecessaryDiscontinuities() {
        // We do not consider the last leg as we do not want to insert a discontinuity at the end of the flight plan
        for (let i = 0; i < this.allLegs.length - 1; i++) {
            const element = this.allLegs[i];
            const nextElement = this.allLegs[i + 1];

            if (element.isDiscontinuity === true) {
                continue;
            }

            if ((nextElement?.isDiscontinuity ?? false) === false && (element.type === LegType.VM || element.type === LegType.FM)) {
                this.allLegs.splice(i + 1, 0, { isDiscontinuity: true });
                this.flightPlan.syncSegmentLegsChange(this);
                i++;
            }
        }
    }

    /**
     * Returns the index of a leg in the segment that terminates at the specified waypoint, or -1 if none is found
     *
     * @param waypoint the waypoint to look for
     */
    findIndexOfWaypoint(waypoint: Fix, afterIndex? :number): number {
        for (let i = 0; i < this.allLegs.length; i++) {
            if (i <= afterIndex) {
                continue;
            }

            const leg = this.allLegs[i];

            if (leg.isDiscontinuity === false && leg.terminatesWithWaypoint(waypoint)) {
                return i;
            }
        }

        return -1;
    }
}
