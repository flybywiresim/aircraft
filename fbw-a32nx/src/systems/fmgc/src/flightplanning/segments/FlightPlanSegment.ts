// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Fix } from '@flybywiresim/fbw-sdk';
import {
  Discontinuity,
  FlightPlanElement,
  FlightPlanLeg,
  SerializedFlightPlanLeg,
} from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { CopyOptions } from '@fmgc/flightplanning/plans/CloningOptions';

export abstract class FlightPlanSegment {
  abstract class: SegmentClass;

  /**
   * All the leg contained in this segment
   */
  abstract get allLegs(): FlightPlanElement[];

  abstract set allLegs(legs: FlightPlanElement[]);

  get legCount() {
    return this.allLegs.length;
  }

  /**
   * Returns the index of the last non-discontinuity leg
   */
  get lastLegIndex() {
    for (let i = this.allLegs.length - 1; i >= 0; i--) {
      const element = this.allLegs[i];

      if (element.isDiscontinuity === false) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Returns the last non-discontinuity leg
   */
  get lastLeg() {
    const lastLegIndex = this.lastLegIndex;
    return lastLegIndex >= 0 ? (this.allLegs[lastLegIndex] as FlightPlanLeg) : undefined;
  }

  /**
   * Whether the segment has already been strung
   */
  strung = false;

  constructor(public readonly flightPlan: BaseFlightPlan) {}

  /**
   * Creates an identical copy of this segment
   *
   * @param forPlan the (new) flight plan for which the segment is being cloned
   * @param options the copy options
   */
  abstract clone(forPlan: BaseFlightPlan, options?: number): FlightPlanSegment;

  /**
   * Inserts an element at a specified index
   *
   * @param index   the index to insert the element at
   * @param element the element to insert
   */
  insertBefore(index: number, element: FlightPlanElement) {
    if (element.isDiscontinuity === false) {
      element.segment = this;
    }

    this.allLegs.splice(index, 0, element);

    this.flightPlan.syncSegmentLegsChange(this);
  }

  /**
   * Inserts an element after a specified index
   *
   * @param index   the index to insert the element after
   * @param element the element to insert
   */
  insertAfter(index: number, element: FlightPlanElement) {
    if (element.isDiscontinuity === false) {
      element.segment = this;
    }

    this.allLegs.splice(index + 1, 0, element);

    this.flightPlan.syncSegmentLegsChange(this);
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

  clear(): FlightPlanElement[] {
    const legs = this.allLegs.slice();

    this.allLegs.length = 0;
    this.flightPlan.syncSegmentLegsChange(this);
    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);

    return legs;
  }

  insertNecessaryDiscontinuities() {
    for (let i = 0; i < this.allLegs.length; i++) {
      const element = this.allLegs[i];
      const nextElement = this.allLegs[i + 1];

      if (element.isDiscontinuity === true) {
        continue;
      }

      if ((nextElement?.isDiscontinuity ?? false) === false && element.isVectors()) {
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
  findIndexOfWaypoint(waypoint: Fix, afterIndex?: number): number {
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

  /**
   * Returns the index of a leg in the segment that terminates at the specified waypoint, or -1 if none is found
   *
   * @param waypoint the waypoint to look for
   */
  findLastIndexOfWaypoint(waypoint: Fix, beforeIndex?: number): number {
    for (let i = this.allLegs.length - 1; i >= 0; i--) {
      if (i >= beforeIndex) {
        continue;
      }

      const leg = this.allLegs[i];

      if (leg.isDiscontinuity === false && leg.terminatesWithWaypoint(waypoint)) {
        return i;
      }
    }

    return -1;
  }

  serialize(): SerializedFlightPlanSegment {
    return { allLegs: this.allLegs.map((it) => (it.isDiscontinuity === false ? it.serialize() : it)) };
  }
}

export interface SerializedFlightPlanSegment {
  allLegs: (SerializedFlightPlanLeg | Discontinuity)[];
  facilityDatabaseID?: string;
  procedureIdent?: string;
}
