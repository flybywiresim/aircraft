// Copyright (c) 2021-2023 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Airport,
  AltitudeDescriptor,
  Approach,
  ApproachType,
  ApproachWaypointDescriptor,
  Arrival,
  Departure,
  Fix,
  LegType,
  ProcedureTransition,
  Runway,
  SpeedDescriptor,
  TurnDirection,
  WaypointDescriptor,
} from '@flybywiresim/fbw-sdk';
import { OriginSegment } from '@fmgc/flightplanning/segments/OriginSegment';
import { FlightPlanElement, FlightPlanLeg, FlightPlanLegFlags } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { DepartureSegment } from '@fmgc/flightplanning/segments/DepartureSegment';
import { ArrivalSegment } from '@fmgc/flightplanning/segments/ArrivalSegment';
import { ApproachSegment } from '@fmgc/flightplanning/segments/ApproachSegment';
import { DestinationSegment } from '@fmgc/flightplanning/segments/DestinationSegment';
import { DepartureEnrouteTransitionSegment } from '@fmgc/flightplanning/segments/DepartureEnrouteTransitionSegment';
import { DepartureRunwayTransitionSegment } from '@fmgc/flightplanning/segments/DepartureRunwayTransitionSegment';
import { FlightPlanSegment, SerializedFlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { EnrouteSegment } from '@fmgc/flightplanning/segments/EnrouteSegment';
import { ArrivalEnrouteTransitionSegment } from '@fmgc/flightplanning/segments/ArrivalEnrouteTransitionSegment';
import { MissedApproachSegment } from '@fmgc/flightplanning/segments/MissedApproachSegment';
import { ArrivalRunwayTransitionSegment } from '@fmgc/flightplanning/segments/ArrivalRunwayTransitionSegment';
import { ApproachViaSegment } from '@fmgc/flightplanning/segments/ApproachViaSegment';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { HoldData, WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { procedureLegIdentAndAnnotation } from '@fmgc/flightplanning/legs/FlightPlanLegNaming';
import {
  FlightPlanEvents,
  PerformanceDataFlightPlanSyncEvents,
  SyncFlightPlanEvents,
} from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { BitFlags, EventBus, Publisher, Subscription } from '@microsoft/msfs-sdk';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { AlternateFlightPlan } from '@fmgc/flightplanning/plans/AlternateFlightPlan';
import { FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { WaypointConstraintType, ConstraintUtils, AltitudeConstraint } from '@fmgc/flightplanning/data/constraint';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { PendingAirways } from '@fmgc/flightplanning/plans/PendingAirways';
import {
  FlightPlanPerformanceData,
  SerializedFlightPlanPerformanceData,
} from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/plans/ReadonlyFlightPlan';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { bearingTo } from 'msfs-geo';
import { RestringOptions } from './RestringOptions';

export enum FlightPlanQueuedOperation {
  Restring,
  RebuildArrivalAndApproach,
  SyncSegmentLegs,
}

export abstract class BaseFlightPlan<P extends FlightPlanPerformanceData = FlightPlanPerformanceData>
  implements ReadonlyFlightPlan
{
  private readonly perfSyncPub: Publisher<PerformanceDataFlightPlanSyncEvents<P>>;

  public pendingAirways: PendingAirways | undefined;

  private subscriptions: Subscription[] = [];

  protected constructor(
    public readonly index: number,
    public readonly bus: EventBus,
  ) {
    this.perfSyncPub = this.bus.getPublisher<PerformanceDataFlightPlanSyncEvents<P>>();

    const subs = this.bus.getSubscriber<SyncFlightPlanEvents>();

    const isAlternatePlan = this instanceof AlternateFlightPlan;

    const flightPlanEventsPub = this.bus.getPublisher<FlightPlanEvents>();

    this.subscriptions.push(
      subs.on('SYNC_flightPlan.setActiveLegIndex').handle((event) => {
        if (!this.ignoreSync) {
          if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
            return;
          }

          this.activeLegIndex = event.activeLegIndex;

          this.incrementVersion();

          flightPlanEventsPub.pub('flightPlan.setActiveLegIndex', event);
        }
      }),
    );

    this.subscriptions.push(
      subs.on('SYNC_flightPlan.setSegmentLegs').handle((event) => {
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

          flightPlanEventsPub.pub('flightPlan.setSegmentLegs', event);
        }
      }),
    );

    this.subscriptions.push(
      subs.on('SYNC_flightPlan.legFlagsEdit').handle((event) => {
        if (!this.ignoreSync) {
          if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
            return;
          }

          const element = this.legElementAt(event.atIndex);

          element.flags = event.newFlags;

          this.incrementVersion();

          flightPlanEventsPub.pub('flightPlan.legFlagsEdit', event);
        }
      }),
    );

    this.subscriptions.push(
      subs.on('SYNC_flightPlan.legDefinitionEdit').handle((event) => {
        if (!this.ignoreSync) {
          if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
            return;
          }

          const element = this.legElementAt(event.atIndex);

          Object.assign(element.definition, event.newDefinition);

          this.incrementVersion();

          flightPlanEventsPub.pub('flightPlan.legDefinitionEdit', event);
        }
      }),
    );

    this.subscriptions.push(
      subs.on('SYNC_flightPlan.setLegCruiseStep').handle((event) => {
        if (!this.ignoreSync) {
          if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
            return;
          }

          const element = this.legElementAt(event.atIndex);

          element.cruiseStep = event.cruiseStep;

          this.incrementVersion();

          flightPlanEventsPub.pub('flightPlan.setLegCruiseStep', event);
        }
      }),
    );

    this.subscriptions.push(
      subs.on('SYNC_flightPlan.setFixInfoEntry').handle((event) => {
        if (!this.ignoreSync) {
          if (event.planIndex !== this.index || isAlternatePlan !== event.forAlternate) {
            return;
          }

          if (this instanceof FlightPlan) {
            this.setFixInfoEntry(event.index, event.fixInfo, false);

            this.incrementVersion();

            flightPlanEventsPub.pub('flightPlan.setFixInfoEntry', event);
          }
        }
      }),
    );
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

  activeLegIndex = 1;

  get activeLeg(): FlightPlanElement {
    return this.allLegs[this.activeLegIndex];
  }

  protected setActiveLegIndex(index: number) {
    this.activeLegIndex = index;
    this.sendEvent('flightPlan.setActiveLegIndex', {
      planIndex: this.index,
      forAlternate: this instanceof AlternateFlightPlan,
      activeLegIndex: index,
    });
  }

  /**
   * Returns the index of the last leg before the active leg, or -1 if none is found
   * We can have a discontinuity before the active leg. In this case, return the leg before that discontinuity
   */
  get fromLegIndex(): number {
    for (let i = Math.min(this.activeLegIndex, this.legCount) - 1; i >= 0; i--) {
      if (this.allLegs[i].isDiscontinuity === false) {
        return i;
      }
    }

    return -1;
  }

  get isDepartureProcedureActive(): boolean {
    return (
      this.departureSegment.procedure !== undefined &&
      ((this.departureRunwayTransitionSegment.legCount > 0 && this.activeLegIndex < this.findLastDepartureLeg()[2]) ||
        this.isProcedureBeingFlownInSegment(this.departureSegment.procedure.ident, this.enrouteSegment)) // legs of departure are moved to enroute after direct
    );
  }

  get isApproachActive(): boolean {
    // `this.approach` can be undefined for runway-by-itself approaches
    return (
      this.approach !== undefined &&
      this.activeLegIndex >= this.firstApproachLegIndex &&
      this.activeLegIndex < this.firstMissedApproachLegIndex
    );
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

    if (
      this.activeLeg &&
      this.activeLeg.isDiscontinuity === false &&
      this.activeLeg.definition.approachWaypointDescriptor === ApproachWaypointDescriptor.MissedApproachPoint
    ) {
      this.stringMissedApproach();
    }

    this.activeLegIndex++;

    this.sendEvent('flightPlan.setActiveLegIndex', {
      planIndex: this.index,
      forAlternate: false,
      activeLegIndex: this.activeLegIndex,
    });
  }

  private removeConstraintsUntil(untilLegIndex: number) {
    for (let i = this.activeLegIndex; i < untilLegIndex; i++) {
      const leg = this.allLegs[i];

      if (leg.isDiscontinuity === false) {
        leg.clearConstraints();
      }
    }
  }

  async stringMissedApproach(onConstraintsDeleted = (_: FlightPlanLeg): void => {}) {
    // Make sure we've not already strung the missed approach
    // Being on an enroute segment would be an indication of that, unless there's no approach legs at all (after DIR to MAP for example),
    // then restring anyways
    if (
      !this.activeLeg ||
      this.activeLeg.isDiscontinuity === true ||
      (this.approachSegment.legCount > 0 && this.activeLeg.segment.class !== SegmentClass.Arrival)
    ) {
      return;
    }

    const missedApproachPointIndex = this.allLegs.findIndex(
      (it) =>
        it.isDiscontinuity === false &&
        it.definition.approachWaypointDescriptor === ApproachWaypointDescriptor.MissedApproachPoint,
    );

    if (missedApproachPointIndex === -1) {
      return;
    }

    this.removeConstraintsUntil(missedApproachPointIndex + 1);
    onConstraintsDeleted(this.legElementAt(missedApproachPointIndex));

    // Move arrival/approach into enroute
    this.redistributeLegsAt(missedApproachPointIndex);

    // Copy missed approach into enroute segment
    const clonedMissedApproachLegs = this.missedApproachSegment.allLegs.map((it) =>
      it.isDiscontinuity === false ? it.clone(this.enrouteSegment) : it,
    );
    this.enrouteSegment.allLegs.push(...clonedMissedApproachLegs);
    this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
    this.enrouteSegment.strung = true;
    this.enrouteSegment.isSequencedMissedApproach = true;

    this.syncSegmentLegsChange(this.enrouteSegment);

    await this.arrivalSegment.setProcedure(undefined);

    this.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
    await this.flushOperationQueue();

    this.incrementVersion();

    // It's important that we restring after rebuilding the arrival/approach
    this.enqueueOperation(FlightPlanQueuedOperation.Restring);
    await this.flushOperationQueue();

    // Set active leg again because the index might've changed when we moved it into enroute
    const activeIndex = this.allLegs.findIndex((it) => it === this.activeLeg);
    this.setActiveLegIndex(activeIndex);
  }

  version = 0;

  incrementVersion() {
    this.version++;
  }

  queuedOperations: [op: FlightPlanQueuedOperation, param: any][] = [];

  enqueueOperation(op: FlightPlanQueuedOperation, param?: any): void {
    if (LnavConfig.VERBOSE_FPM_LOG) {
      console.trace('[fpm] enqueueOperation', op, param);
    }

    const existing = this.queuedOperations.find((it) => it[0] === op && it[1] === param);

    if (existing) {
      if (op === FlightPlanQueuedOperation.Restring) {
        // Always restring at the end of the queue
        this.queuedOperations = this.queuedOperations.filter((op) => op !== existing);
      } else {
        return;
      }
    }

    this.queuedOperations.push([op, param]);
  }

  async flushOperationQueue() {
    if (LnavConfig.VERBOSE_FPM_LOG) {
      console.trace('[fpm] flushOperationQueue');
    }

    // This needs to be an indexed for loop, as Coherent does not respect the ECMAScript spec and doesn't include items
    // added iteration in for...of loops. This is an issue, as in `restring` calls, we can queue SyncSegmentLegs operations.
    for (let i = 0; i < this.queuedOperations.length; i++) {
      const [operation, param] = this.queuedOperations[i];

      switch (operation) {
        case FlightPlanQueuedOperation.Restring: {
          const options = param as RestringOptions;

          this.restring(options);
          break;
        }
        case FlightPlanQueuedOperation.RebuildArrivalAndApproach:
          await this.rebuildArrivalAndApproachSegments();
          break;
        case FlightPlanQueuedOperation.SyncSegmentLegs: {
          const segment = param as FlightPlanSegment;

          this.syncSegmentLegsChange(segment);
          break;
        }
        default:
          console.error(`Unknown queue operation: ${operation}`);
      }
    }

    this.queuedOperations.length = 0;
  }

  protected ignoreSync = false;

  sendEvent<K extends keyof FlightPlanEvents>(topic: K, data: FlightPlanEvents[K]) {
    this.ignoreSync = true;
    this.bus.getPublisher<FlightPlanEvents>().pub(topic, data, true, false);
    this.bus
      .getPublisher<SyncFlightPlanEvents>()
      .pub(`SYNC_${topic}`, data as SyncFlightPlanEvents[`SYNC_${typeof topic}`], true, false);
    this.ignoreSync = false;
  }

  sendPerfEvent<K extends keyof PerformanceDataFlightPlanSyncEvents<P>>(
    topic: K,
    data: PerformanceDataFlightPlanSyncEvents<P>[K],
  ) {
    this.ignoreSync = true;
    this.perfSyncPub.pub(topic, data, true, false);
    this.ignoreSync = false;
  }

  syncSegmentLegsChange(segment: FlightPlanSegment) {
    if (LnavConfig.VERBOSE_FPM_LOG) {
      console.log(`[fpm] syncSegmentLegsChange - ${segment.constructor.name}`);
    }

    const segmentIndex = this.orderedSegments.indexOf(segment);

    const legs = segment.allLegs.map((it) => (it.isDiscontinuity === false ? it.serialize() : it));

    this.sendEvent('flightPlan.setSegmentLegs', { planIndex: this.index, forAlternate: false, segmentIndex, legs });
  }

  syncLegFlagsChange(atIndex: number) {
    const leg = this.elementAt(atIndex);

    if (leg.isDiscontinuity === false) {
      this.sendEvent('flightPlan.legFlagsEdit', {
        planIndex: this.index,
        atIndex,
        forAlternate: this instanceof AlternateFlightPlan,
        newFlags: leg.flags,
      });
    }
  }

  syncLegDefinitionChange(atIndex: number) {
    const leg = this.elementAt(atIndex);

    if (leg.isDiscontinuity === false) {
      this.sendEvent('flightPlan.legDefinitionEdit', {
        planIndex: this.index,
        atIndex,
        forAlternate: this instanceof AlternateFlightPlan,
        newDefinition: leg.definition,
      });
    }
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
    const originLegIndex = this.originLegIndex;
    return originLegIndex >= 0 ? this.allLegs[originLegIndex] : undefined;
  }

  get originLegIndex() {
    return this.allLegs.findIndex((it) => it.isDiscontinuity === false && it.flags & FlightPlanLegFlags.Origin);
  }

  get destinationLeg() {
    return this.elementAt(this.destinationLegIndex);
  }

  get destinationLegIndex() {
    let targetSegment: FlightPlanSegment = undefined;

    if (this.destinationSegment.allLegs.length > 0) {
      targetSegment = this.destinationSegment;
    } else if (this.approachSegment.allLegs.length > 0) {
      targetSegment = this.approachSegment;
    } else if (this.enrouteSegment.allLegs.length > 0) {
      targetSegment = this.enrouteSegment;
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

    return (
      lastApproachLeg &&
      lastApproachLeg.isDiscontinuity === false &&
      lastApproachLeg.definition.waypointDescriptor === WaypointDescriptor.Runway
    );
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
        ...(this.endsAtRunway ? this.destinationSegment.allLegs : []),
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
    return this.departureSegment.procedure;
  }

  async setDeparture(databaseId: string | undefined) {
    await this.departureSegment.setProcedure(databaseId).then(() => this.incrementVersion());

    await this.flushOperationQueue();
    this.incrementVersion();
  }

  get departureEnrouteTransition(): ProcedureTransition {
    return this.departureEnrouteTransitionSegment.procedure;
  }

  /**
   * Sets the departure enroute transition
   *
   * @param databaseId the transition databaseId or `undefined` for NONE
   */
  async setDepartureEnrouteTransition(databaseId: string | undefined) {
    await this.departureEnrouteTransitionSegment.setProcedure(databaseId);

    await this.flushOperationQueue();
    this.incrementVersion();
  }

  get arrivalEnrouteTransition(): ProcedureTransition {
    return this.arrivalEnrouteTransitionSegment.procedure;
  }

  /**
   * Sets the arrival enroute transition
   *
   * @param databaseId the transition databaseId or `undefined` for NONE
   */
  async setArrivalEnrouteTransition(databaseId: string | undefined) {
    await this.arrivalEnrouteTransitionSegment.setProcedure(databaseId);

    await this.flushOperationQueue();
    this.incrementVersion();
  }

  get arrival() {
    return this.arrivalSegment.procedure;
  }

  async setArrival(databaseId: string | undefined) {
    await this.arrivalSegment.setProcedure(databaseId).then(() => this.incrementVersion());

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
   * @param databaseId the transition databaseId or `undefined` for NONE
   */
  async setApproachVia(databaseId: string | undefined) {
    await this.approachViaSegment.setProcedure(databaseId);

    await this.flushOperationQueue();
    this.incrementVersion();
  }

  get approach() {
    return this.approachSegment.procedure;
  }

  /**
   * Sets the approach
   *
   * @param databaseId the approach databaseId or `undefined` for NONE
   */
  async setApproach(databaseId: string | undefined) {
    await this.approachSegment.setProcedure(databaseId).then(() => this.incrementVersion());

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

    if (index > 0) {
      const previousElement = this.elementAt(index - 1);
      const element = this.elementAt(index);
      const [prevSegment, prevIndexInSegment] = this.segmentPositionForIndex(index - 1);
      const nextElement = this.maybeElementAt(index + 1);

      // Also clear hold if we clear leg before hold
      const numElementsToDelete = nextElement?.isDiscontinuity === false && nextElement.isHX() ? 2 : 1;

      if (previousElement.isDiscontinuity === false) {
        if (element.isDiscontinuity === false) {
          // Use `removeRange` because the next leg might be in the next segment
          this.removeRange(index, index + numElementsToDelete);

          if (insertDiscontinuity) {
            segment.allLegs.splice(indexInSegment, 0, { isDiscontinuity: true });
          }

          // Also clear INTCPT if we clear the leg after it
          if (previousElement.isXI()) {
            prevSegment.allLegs.splice(prevIndexInSegment, 1);
          }
        } else if (nextElement?.isDiscontinuity === false) {
          if (previousElement.terminatesWithWaypoint(nextElement.terminationWaypoint())) {
            // Disco with same point before and after it
            this.mergeConstraints(previousElement, nextElement);

            // Only keep one waypoint - see FBW-22-09
            this.removeRange(index, index + 2);
          } else {
            // Regular disco
            if (nextElement.isXF()) {
              const [nextSegment, nextIndexInSegment] = this.segmentPositionForIndex(index + 1);

              // Convert next element to TF
              // We do this because we get the wrong turn direction sometimes if we keep it a CF leg for example
              const newNextElement = FlightPlanLeg.fromEnrouteFix(
                nextSegment,
                nextElement.terminationWaypoint(),
                nextElement.annotation,
              )
                .withDefinitionFrom(nextElement)
                .withPilotEnteredDataFrom(nextElement);

              nextSegment.allLegs.splice(nextIndexInSegment, 1, newNextElement);

              if (nextSegment !== segment) {
                this.syncSegmentLegsChange(nextSegment);
              }
            }

            // Remove disco
            segment.allLegs.splice(indexInSegment, 1);
          }

          this.removeForcedTurnAt(index + 2);
        }
      } else {
        this.removeRange(index, index + numElementsToDelete);
      }
    } else {
      segment.allLegs.splice(indexInSegment, 1);
    }

    this.syncSegmentLegsChange(segment);

    this.incrementVersion();
    this.adjustIFLegs();
    this.adjustTFLegs();

    this.ensureNoDuplicateDiscontinuities();

    this.incrementVersion();

    return true;
  }

  private mergeConstraints(first: FlightPlanLeg, second: FlightPlanLeg) {
    // Speed constraints
    const onlyFirstHasPilotSpeedConstraint =
      first.hasPilotEnteredSpeedConstraint() && !second.hasPilotEnteredSpeedConstraint();
    if (!onlyFirstHasPilotSpeedConstraint) {
      first.pilotEnteredSpeedConstraint = second.pilotEnteredSpeedConstraint;
    }

    const secondHasSpeedConstraint = second.hasDatabaseSpeedConstraint() || second.hasPilotEnteredSpeedConstraint();
    const onlyFirstHasSpeedConstraintAtAll = first.hasDatabaseSpeedConstraint() && !secondHasSpeedConstraint;
    if (!onlyFirstHasSpeedConstraintAtAll) {
      first.definition.speedDescriptor = second.definition.speedDescriptor;
      first.definition.speed = second.definition.speed;
    }

    // Altitude constraints
    const onlyFirstHasPilotAltitudeConstraint =
      first.hasPilotEnteredAltitudeConstraint() && !second.hasPilotEnteredAltitudeConstraint();
    if (!onlyFirstHasPilotAltitudeConstraint) {
      first.pilotEnteredAltitudeConstraint = second.pilotEnteredAltitudeConstraint;
    }

    const secondHasAltitudeConstraint =
      second.hasDatabaseAltitudeConstraint() || second.hasPilotEnteredAltitudeConstraint();
    const onlyFirstHasAltitudeConstraintAtAll = first.hasDatabaseAltitudeConstraint() && !secondHasAltitudeConstraint;
    if (!onlyFirstHasAltitudeConstraintAtAll) {
      first.definition.altitudeDescriptor = second.definition.altitudeDescriptor;
      first.definition.altitude1 = second.definition.altitude1;
      first.definition.altitude2 = second.definition.altitude2;
    }
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
   * Converts a segment index to an allLegs index
   * @param segment Segment containing the leg
   * @param indexInSegment Index of the leg in the segment
   * @returns
   */
  private indexForSegmentPosition(segment: FlightPlanSegment, indexInSegment: number): number {
    let accumulator = 0;
    for (const s of this.orderedSegments) {
      if (s === segment) {
        return accumulator + indexInSegment;
      }

      accumulator += s.legCount;
    }

    throw new Error('[FMS/FPM] Tried to get index for out-of-bounds segment position');
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
    // On ILS approaches altitude2 on the FACF is the GS intercept alt,
    // even when there is no descriptor (i.e. there's no alt constraint) - ARINC 424 5.29.
    if (this.approach.type === ApproachType.Ils) {
      for (const leg of this.approachSegment.allLegs) {
        if (
          leg.isDiscontinuity === false &&
          leg.definition.approachWaypointDescriptor === ApproachWaypointDescriptor.FinalApproachCourseFix &&
          leg.definition.altitude2 > 0
        ) {
          return leg.definition.altitude2;
        }
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
    // If the waypoint already exists, remove everything between the two waypoints
    const duplicate = this.findDuplicate(waypoint, index);
    if (duplicate) {
      const [duplicateSegment, _, duplicatePlanIndex] = duplicate;

      if (duplicatePlanIndex < this.firstMissedApproachLegIndex) {
        const duplicateLeg = this.legElementAt(duplicatePlanIndex);

        // Make new leg a TF leg. If this is not allowed, it will be converted when we restring
        const leg = FlightPlanLeg.fromEnrouteFix(duplicateSegment, waypoint)
          .withDefinitionFrom(duplicateLeg)
          .withPilotEnteredDataFrom(duplicateLeg);

        // Remove forced turn on following leg
        this.removeForcedTurnAt(duplicatePlanIndex + 1);
        this.removeRange(index, duplicatePlanIndex + 1);

        // Remove overfly on previous leg because it no longer makes sense
        const previousElement = this.maybeElementAt(index - 1);
        if (previousElement?.isDiscontinuity === false) {
          this.setOverflyAt(index - 1, false);
        }

        await this.insertElementBefore(index, leg);

        return;
      }
    }

    const previousElement = this.maybeElementAt(index - 1);
    if (previousElement?.isDiscontinuity === false) {
      this.setOverflyAt(index - 1, false);

      if (previousElement.isXI()) {
        this.removeElementAt(index - 1);
        index -= 1;
      }
    }

    const leg = FlightPlanLeg.fromEnrouteFix(this.enrouteSegment, waypoint);

    await this.insertElementBefore(index, leg, true);
  }

  /**
   * NEXT WPT revision. Inserts a waypoint after a leg at an index, adding a discontinuity if the waypoint isn't downstream in the plan
   *
   * @param index the index of the leg to insert the waypoint after
   * @param waypoint the waypoint to insert
   */
  async nextWaypoint(index: number, waypoint: Fix) {
    // If the waypoint already exists, remove everything between the two waypoints
    const duplicate = this.findDuplicate(waypoint, index);
    if (duplicate) {
      const [duplicateSegment, _, duplicatePlanIndex] = duplicate;

      if (duplicatePlanIndex < this.firstMissedApproachLegIndex) {
        const duplicateLeg = this.legElementAt(duplicatePlanIndex);

        // Make new leg a TF leg. If this is not allowed, it will be converted when we restring
        const leg = FlightPlanLeg.fromEnrouteFix(duplicateSegment, waypoint)
          .withDefinitionFrom(duplicateLeg)
          .withPilotEnteredDataFrom(duplicateLeg);

        // A forced turn implies an overfly on the previous leg, so also remove it
        // because it no longer makes sense
        this.setOverflyAt(index, false);
        // Remove forced turn on following leg, since it no longer makes sense
        this.removeForcedTurnAt(duplicatePlanIndex + 1);
        this.removeRange(index + 1, duplicatePlanIndex + 1);

        await this.insertElementAfter(index, leg);

        return;
      }
    }

    const afterElement = this.elementAt(index);

    const [insertSegment] = this.segmentPositionForIndex(index);
    const leg = FlightPlanLeg.fromEnrouteFix(
      insertSegment,
      waypoint,
      undefined,
      afterElement.isDiscontinuity === true ? LegType.IF : LegType.TF,
    );

    await this.insertElementAfter(index, leg, true);
  }

  protected removeForcedTurnAt(index: number) {
    const leg = this.maybeElementAt(index);
    if (leg?.isDiscontinuity === false) {
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.log(`[fpm] removeForcedTurnAt - ${leg.ident}`);
      }

      leg.definition.turnDirection = TurnDirection.Either;

      this.syncLegDefinitionChange(index);
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

    await this.approachSegment.setProcedure(undefined);
    await this.approachViaSegment.setProcedure(undefined);
    await this.arrivalEnrouteTransitionSegment.setProcedure(undefined);
    await this.arrivalSegment.setProcedure(undefined);
    await this.destinationSegment.setDestinationIcao(airportIdent);
    await this.destinationSegment.setDestinationRunway(undefined);

    await this.flushOperationQueue();

    this.enrouteSegment.allLegs.splice(legIndexInEnroute + 1, legsToDelete);

    if (this.enrouteSegment.allLegs[this.enrouteSegment.legCount - 1].isDiscontinuity === false) {
      this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
    }
    this.enrouteSegment.strung = true;

    this.syncSegmentLegsChange(this.enrouteSegment);

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

  async addOrEditManualHold(
    atIndex: number,
    desiredHold: HoldData,
    modifiedHold: HoldData,
    defaultHold: HoldData,
  ): Promise<number> {
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

    const [insertSegment, indexInSegment] = this.segmentPositionForIndex(atIndex);
    const manualHoldLeg = FlightPlanLeg.manualHold(insertSegment, waypoint, desiredHold);

    manualHoldLeg.modifiedHold = modifiedHold;
    manualHoldLeg.defaultHold = defaultHold;

    // Call segment method directly because we don't want to restring
    insertSegment.insertAfter(indexInSegment, manualHoldLeg);

    this.syncSegmentLegsChange(insertSegment);
    this.incrementVersion();

    return atIndex + 1;
  }

  revertHoldToComputed(atIndex: number) {
    const targetLeg = this.elementAt(atIndex);

    if (targetLeg.isDiscontinuity === true || !targetLeg.isHX()) {
      throw new Error('[FPM] Target leg of a direct to cannot be a discontinuity or a non-HX leg');
    }

    targetLeg.modifiedHold = undefined;
  }

  private async insertElementAfter(index: number, element: FlightPlanElement, insertDiscontinuity = false) {
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

    const lastDepLegIndexInPlan = this.findLastDepartureLeg()[2];
    const firstArrLegIndexInPlan = this.findFirstArrivalLeg()[2];

    if (insertSegment.class === SegmentClass.Departure && index >= lastDepLegIndexInPlan) {
      if (insertIndexInSegment <= insertSegment.legCount - 1) {
        // If we have a disco as the last departure element, move it into enroute, then prepend the element in the enroute segment
        this.redistributeLegsAt(index);
      }

      insertSegment = this.enrouteSegment;
      insertIndexInSegment = 0;
    } else if (insertSegment.class === SegmentClass.Arrival && index < firstArrLegIndexInPlan) {
      // If we have a disco as the first arrival element, move it into enroute, then append the element in the enroute segment
      this.redistributeLegsAt(index - 1);

      insertSegment = this.enrouteSegment;
      insertIndexInSegment = this.enrouteSegment.legCount;
    }

    const prependInMissedApproach =
      insertSegment === this.approachSegment && insertIndexInSegment === this.approachSegment.allLegs.length - 1;

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
    if (index < 1 || index >= this.allLegs.length) {
      throw new Error(`[FMS/FPM] Tried to insert waypoint out of bounds (index=${index})`);
    }

    let startSegment: FlightPlanSegment;
    let indexInStartSegment: number;

    if (this.legCount > 0) {
      [startSegment, indexInStartSegment] = this.segmentPositionForIndex(index);
    } else {
      startSegment = this.enrouteSegment;
      indexInStartSegment = 0;
    }

    const lastDepLegIndexInPlan = this.findLastDepartureLeg()[2];
    const firstArrLegIndexInPlan = this.findFirstArrivalLeg()[2];

    if (startSegment.class === SegmentClass.Departure && index > lastDepLegIndexInPlan) {
      // If we have a disco as the last departure element, move it into enroute, then prepend the element in the enroute segment
      this.redistributeLegsAt(index);

      startSegment = this.enrouteSegment;
      indexInStartSegment = 0;
    } else if (startSegment.class === SegmentClass.Arrival && index <= firstArrLegIndexInPlan) {
      // If we have a disco as the first arrival element, move it into enroute, then append the element to the end of the enroute segment
      if (indexInStartSegment > 0) {
        this.redistributeLegsAt(index - 1);
      }

      startSegment = this.enrouteSegment;
      indexInStartSegment = this.enrouteSegment.legCount;
    }

    startSegment.insertBefore(indexInStartSegment, element);

    if (insertDiscontinuity) {
      this.incrementVersion();

      const elementAfterInserted = this.allLegs[index + 1];

      if (elementAfterInserted?.isDiscontinuity === false) {
        startSegment.insertBefore(indexInStartSegment + 1, { isDiscontinuity: true });
        this.incrementVersion();
      }
    }

    this.enqueueOperation(FlightPlanQueuedOperation.Restring);
    await this.flushOperationQueue();
    this.incrementVersion();
  }

  /**
   * Inserts a discontinuity after a flightplan element
   * @param index
   */
  async insertDiscontinuityAfter(index: number) {
    const [segment, indexInSegment] = this.segmentPositionForIndex(index);

    if (segment.allLegs[indexInSegment].isDiscontinuity === true) {
      console.warn('[FMS/FPM] Tried to insert discontinuity after a discontinuity');
      return;
    }

    segment.insertAfter(indexInSegment, { isDiscontinuity: true });

    this.incrementVersion();

    // Make sure we don't have a TF leg after the disco
    this.adjustIFLegs();

    this.incrementVersion();
  }

  editLegFlags(index: number, flags: number, notify = true): void {
    const leg = this.legElementAt(index);

    leg.flags = flags;

    if (notify) {
      this.syncLegFlagsChange(index);
    }
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

  setPilotEnteredSpeedConstraintAt(index: number, isDescentConstraint: boolean, speed?: number) {
    const element = this.elementAt(index);

    if (element.isDiscontinuity === true) {
      return;
    }

    if (!speed) {
      element.pilotEnteredSpeedConstraint = undefined;
      element.definition.speedDescriptor = undefined;
      element.definition.speed = undefined;
    } else {
      element.pilotEnteredSpeedConstraint = { speedDescriptor: SpeedDescriptor.Maximum, speed };
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
    this.sendEvent('flightPlan.setLegCruiseStep', {
      planIndex: this.index,
      forAlternate: this instanceof AlternateFlightPlan,
      atIndex: index,
      cruiseStep: leg.cruiseStep,
    });

    this.unignoreAllCruiseSteps();

    this.incrementVersion();
  }

  removeCruiseStep(index: number) {
    const leg = this.legElementAt(index);

    leg.cruiseStep = undefined;
    this.sendEvent('flightPlan.setLegCruiseStep', {
      planIndex: this.index,
      forAlternate: this instanceof AlternateFlightPlan,
      atIndex: index,
      cruiseStep: undefined,
    });

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
      this.sendEvent('flightPlan.setLegCruiseStep', {
        planIndex: this.index,
        forAlternate: this instanceof AlternateFlightPlan,
        atIndex: i,
        cruiseStep: element.cruiseStep,
      });
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
        const dupeIndexInSegment = segment.findIndexOfWaypoint(
          waypoint,
          afterIndex - (indexAccumulator - segment.allLegs.length),
        );

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

  private findDuplicateReverse(waypoint: Fix, beforeIndex?: number): [FlightPlanSegment, number, number] | null {
    let indexAccumulator = 0;
    let result = null;

    for (const segment of this.orderedSegments) {
      if (indexAccumulator >= beforeIndex) {
        break;
      }

      indexAccumulator += segment.allLegs.length;

      const dupeIndexInSegment = segment.findLastIndexOfWaypoint(
        waypoint,
        beforeIndex - (indexAccumulator - segment.allLegs.length),
      );

      if (dupeIndexInSegment === -1) {
        continue;
      }

      const planIndex = indexAccumulator - segment.allLegs.length + dupeIndexInSegment;
      result = [segment, dupeIndexInSegment, planIndex];
    }

    return result;
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

      if (segment === this.destinationSegment) {
        emptyAllNext = true;

        toInsertInEnroute.unshift(...this.destinationSegment.truncate(indexInSegment));
      }

      if (segment === this.approachSegment) {
        emptyAllNext = true;

        toInsertInEnroute.unshift(...this.approachSegment.truncate(indexInSegment));
      } else if (emptyAllNext) {
        const removed = this.approachSegment.clear();

        toInsertInEnroute.unshift(...removed);
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

  private restring(options: RestringOptions = RestringOptions.Default) {
    const segments = this.orderedSegments;
    const departureSegments = segments.filter((s) => s.class === SegmentClass.Departure);
    const arrivalSegments = segments.filter((s) => s.class === SegmentClass.Arrival);

    if (options & RestringOptions.RestringDeparture) {
      // String all departure segments among each other
      for (let i = 0; i < departureSegments.length; i++) {
        const segment = departureSegments[i];
        const nextSegment = this.nextSegment(segment);

        if (nextSegment?.class === SegmentClass.Departure) {
          this.stringSegmentsForwards(segment, nextSegment);
        }

        segment.insertNecessaryDiscontinuities();
      }

      // String entire departure to the rest of the route
      this.stringDepartureToDownstream();
    }

    if (options & RestringOptions.RestringArrival) {
      // String all arrival segments among each other
      for (let i = 0; i < arrivalSegments.length; i++) {
        const segment = arrivalSegments[i];
        const nextSegment = this.nextSegment(segment);

        if (nextSegment?.class === SegmentClass.Arrival) {
          this.stringSegmentsForwards(segment, nextSegment);
        }

        segment.insertNecessaryDiscontinuities();
      }

      // It's important we only string backwards once we've strung everything forwards
      for (let i = 0; i < arrivalSegments.length; i++) {
        const segment = arrivalSegments[i];
        const nextSegment = this.nextSegment(segment);

        if (nextSegment?.class === SegmentClass.Arrival) {
          this.stringSegmentsBackwards(segment, nextSegment);
        }

        segment.insertNecessaryDiscontinuities();
      }

      // String entire arrival to the rest of the route
      this.stringArrivalToUpstream();
    }

    this.ensureNoDuplicateDiscontinuities();
    this.ensureNoDiscontinuityAsFinalElement();

    this.incrementVersion();
    this.adjustIFLegs();
    this.adjustTFLegs();

    this.incrementVersion();
    this.selectActiveLeg();
  }

  private stringSegmentsForwards(first: FlightPlanSegment, second: FlightPlanSegment) {
    if (LnavConfig.VERBOSE_FPM_LOG) {
      console.log(`[fpm] stringSegmentsForwards (${first.constructor.name}, ${second.constructor.name})`);
    }

    if (
      !first ||
      !second ||
      first.strung ||
      first.allLegs.length === 0 ||
      second.allLegs.length === 0 ||
      (second instanceof EnrouteSegment && second.isSequencedMissedApproach)
    ) {
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsForwards - RETURN');
      }
      return;
    }

    let lastElementInFirstIndex = first.allLegs.length - 1;
    const lastElementInFirst = first.allLegs[first.allLegs.length - 1];

    if (lastElementInFirst?.isDiscontinuity === true) {
      lastElementInFirstIndex = first.allLegs.length - 2;
    }

    const lastLegInFirst = first.allLegs[lastElementInFirstIndex];
    if (!lastLegInFirst || lastLegInFirst?.isDiscontinuity === true) {
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsForwards - RETURN - no lastLegInFirst or lastLegInFirst is discontinuity');
      }
      return;
    }

    if (first instanceof OriginSegment && first.lastLeg?.waypointDescriptor === WaypointDescriptor.Runway) {
      // Always string origin with only a runway to next segment
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsForwards - RETURN - last leg of OriginSegment as first segment is a runway');
      }
      first.strung = true;
      return;
    }

    const firstIsArrival =
      first instanceof ArrivalSegment ||
      first instanceof ArrivalEnrouteTransitionSegment ||
      first instanceof ArrivalRunwayTransitionSegment;
    const secondIsApproach = second instanceof ApproachSegment || second instanceof ApproachViaSegment;

    // Arrival and approach will be strung backwards
    if (firstIsArrival && secondIsApproach) {
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsForwards - RETURN - first is arrival + second is approach');
      }
      return;
    }

    if (first instanceof ApproachSegment && second instanceof DestinationSegment) {
      // Always string approach to destination
      first.strung = true;
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsForwards - first.strung = true');
        console.trace('[fpm] stringSegmentsForwards - RETURN - first is approach + second is destination');
      }
      return;
    }

    if (
      (first instanceof DestinationSegment || first instanceof ApproachSegment) &&
      second instanceof MissedApproachSegment
    ) {
      // Always string approach to missed
      first.strung = true;
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsForwards - first.strung = true');
        console.trace('[fpm] stringSegmentsForwards - RETURN - first is destination or approach + second is missed');
      }
      return;
    }

    const originAndDestination = first instanceof OriginSegment && second instanceof DestinationSegment;
    const totalIndex = this.indexForSegmentPosition(first, lastElementInFirstIndex);
    const firstIsBeforeActiveLeg = this.activeLegIndex > -1 && totalIndex < this.activeLegIndex;

    let cutBefore = -1;
    if (!originAndDestination && !firstIsBeforeActiveLeg) {
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

            [element.ident, element.annotation] = procedureLegIdentAndAnnotation(
              element.definition,
              lastLegInFirst.annotation,
            );

            this.mergeConstraints(element, lastLegInFirst);

            if (LnavConfig.VERBOSE_FPM_LOG) {
              console.trace('[fpm] stringSegmentsForwards - popping legs of first');
            }

            first.allLegs.pop();
            this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, first);
            cutBefore = i;
            break;
          }
        }

        const xfToFx = lastLegInFirst.isXF() && element.isFX();

        if (xfToFx && lastLegInFirst.terminatesWithWaypoint(element.terminationWaypoint())) {
          if (LnavConfig.VERBOSE_FPM_LOG) {
            console.log(`[fpm] stringSegmentsForwards - cutBefore (xfToFx) = ${i}`);
          }
          cutBefore = i;
          break;
        }

        const xiToXf = lastLegInFirst.isXI() && element.isXF();

        if (xiToXf) {
          if (LnavConfig.VERBOSE_FPM_LOG) {
            console.log(`[fpm] stringSegmentsForwards - cutBefore (xiToXf)) = ${i}`);
          }

          // Convert TF to CF
          if (element.type === LegType.TF) {
            const prevElement = second.allLegs[i - 1];
            if (!prevElement || prevElement.isDiscontinuity === true) {
              throw new Error('[FMS/FPM] TF leg without a preceding leg');
            } else if (!prevElement.terminationWaypoint()) {
              throw new Error('[FMS/FPM] TF leg without a preceding leg with a termination waypoint');
            }

            const track = bearingTo(prevElement.terminationWaypoint().location, element.terminationWaypoint().location);
            element.type = LegType.CF;
            element.definition.magneticCourse = track;
            // Get correct ident/annotation for CF leg
            [element.ident, element.annotation] = procedureLegIdentAndAnnotation(
              element.definition,
              element.annotation,
            );
          }

          cutBefore = i;
          break;
        }
      }
    }

    // If no matching leg is found, insert a discontinuity (if there isn't one already) at the end of the first segment
    if (cutBefore === -1 || originAndDestination) {
      if (lastElementInFirst.isDiscontinuity === false && second.allLegs[0]?.isDiscontinuity === false) {
        if (LnavConfig.VERBOSE_FPM_LOG) {
          console.trace('[fpm] stringSegmentsForwards - add discontinuity to first');
        }
        first.allLegs.push({ isDiscontinuity: true });
        this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, first);
      }

      first.strung = false;
      return;
    }

    // Otherwise, clear a possible discontinuity and remove all elements before the matching leg and the last leg of the first segment
    if (lastElementInFirst.isDiscontinuity === true) {
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsForwards - popping legs of first');
      }
      first.allLegs.pop();
      this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, first);
    }

    for (let i = 0; i < cutBefore; i++) {
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsForwards - popping legs of second');
      }
      second.allLegs.shift();
    }

    this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, second);

    first.strung = true;
  }

  private stringSegmentsBackwards(first: FlightPlanSegment, second: FlightPlanSegment) {
    if (LnavConfig.VERBOSE_FPM_LOG) {
      console.log(`[fpm] stringSegmentsBackwards (${first.constructor.name}, ${second.constructor.name})`);
    }

    if (!first || !second || first.allLegs.length === 0 || second.allLegs.length === 0) {
      if (LnavConfig.VERBOSE_FPM_LOG) {
        console.trace('[fpm] stringSegmentsBackwards cancelled');
      }
      return;
    }

    const firstIsArrival =
      first instanceof ArrivalSegment ||
      first instanceof ArrivalEnrouteTransitionSegment ||
      first instanceof ArrivalRunwayTransitionSegment;
    const secondIsApproach = second instanceof ApproachSegment || second instanceof ApproachViaSegment;

    // Only arrival and approach are be strung backwards
    if (!firstIsArrival || !secondIsApproach) {
      return;
    }

    let firstElementInSecondIndex = 0;
    const firstElementInSecond = second[0];

    if (firstElementInSecond?.isDiscontinuity === true) {
      firstElementInSecondIndex = 1;
    }

    const firstLegInSecond = second.allLegs[firstElementInSecondIndex];
    if (!firstLegInSecond || firstLegInSecond?.isDiscontinuity === true) {
      return;
    }

    let cutBefore = -1;
    for (let i = first.legCount - 1; i >= 0; i--) {
      const totalIndex = this.indexForSegmentPosition(first, firstElementInSecondIndex);
      const isBeforeActiveLeg = this.activeLegIndex > -1 && totalIndex < this.activeLegIndex;
      if (isBeforeActiveLeg) {
        break;
      }

      const element = first.allLegs[i];

      if (element.isDiscontinuity === true) {
        continue;
      }

      const bothXf = firstLegInSecond.isXF() && element.isXF();

      if (bothXf) {
        if (element.terminatesWithWaypoint(firstLegInSecond.terminationWaypoint())) {
          // Use leg from the first segment for annotation and ident, see FBW-22-08,
          // but merge constraints
          this.mergeConstraints(element, firstLegInSecond);

          second.allLegs.shift();
          second.flightPlan.syncSegmentLegsChange(first);
          cutBefore = i;
          break;
        }
      }

      const xfToFx = element.isXF() && firstLegInSecond.isFX();

      if (xfToFx && element.terminatesWithWaypoint(firstLegInSecond.terminationWaypoint())) {
        cutBefore = i;
        break;
      }
    }

    // If no matching leg is found, insert a discontinuity (if there isn't one already) at the end of the first segment
    if (cutBefore === -1) {
      if (
        first.allLegs[first.legCount - 1]?.isDiscontinuity === false &&
        second.allLegs[0]?.isDiscontinuity === false
      ) {
        first.allLegs.push({ isDiscontinuity: true });
        this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, first);
      }

      return;
    }

    // Otherwise, clear a possible discontinuity and remove all elements before the matching leg and the last leg of the first segment
    if (firstElementInSecond?.isDiscontinuity === true) {
      second.allLegs.shift();
      this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, second);
    }

    for (let i = first.legCount - 1; i > cutBefore; i--) {
      first.allLegs.pop();
    }

    this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, first);
  }

  private stringDepartureToDownstream() {
    // Find last departure leg
    const [lastDepartureSegment, lastDepartureLegIndex, lastDepartureLegIndexInPlan] = this.findLastDepartureLeg();
    if (!lastDepartureSegment) {
      return;
    }
    if (lastDepartureSegment.strung) {
      return;
    }

    const lastDepartureLeg = lastDepartureSegment.allLegs[lastDepartureLegIndex];
    if (lastDepartureLeg.isDiscontinuity === true) {
      throw new Error('[FMS/FPM] Last departure leg cannot be a discontinuity');
    }

    if (lastDepartureLeg.isXF()) {
      // Check if same point occurs downroute
      const duplicate = this.findDuplicate(lastDepartureLeg.terminationWaypoint(), lastDepartureLegIndexInPlan);
      if (duplicate) {
        // If it does, remove everything inbetween
        const [_, __, duplicatePlanIndex] = duplicate;

        const originAndDestination =
          lastDepartureLegIndexInPlan === this.originLegIndex && duplicatePlanIndex === this.destinationLegIndex;
        if (!originAndDestination) {
          this.removeRange(lastDepartureLegIndexInPlan + 1, duplicatePlanIndex + 1);
          lastDepartureSegment.strung = true;

          return;
        }
      }
    }

    if (this.enrouteSegment.allLegs[0]?.isDiscontinuity === false) {
      // Insert disco otherwise
      this.enrouteSegment.allLegs.unshift({ isDiscontinuity: true });
      this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, lastDepartureSegment);
    }
  }

  private stringArrivalToUpstream() {
    // Find first arrival leg
    const [firstArrivalSegment, firstArrivalLegIndex, firstArrivalLegIndexInPlan] = this.findFirstArrivalLeg();
    if (!firstArrivalSegment) {
      return;
    }

    const firstArrivalLeg = firstArrivalSegment.allLegs[firstArrivalLegIndex];
    if (firstArrivalLeg.isDiscontinuity === true) {
      throw new Error('[FMS/FPM] Last departure leg cannot be a discontinuity');
    }

    // Check if same point occurs downroute
    if (firstArrivalLeg.isXF()) {
      const duplicate = this.findDuplicateReverse(firstArrivalLeg.terminationWaypoint(), firstArrivalLegIndexInPlan);
      if (duplicate) {
        // If it does, remove everything inbetween
        const [duplicateSegment, duplicateIndexInSegment, duplicatePlanIndex] = duplicate;

        const duplicateBeforeActiveLeg = duplicatePlanIndex < this.activeLegIndex;
        const originAndDestination =
          duplicatePlanIndex === this.originLegIndex && firstArrivalLegIndexInPlan === this.destinationLegIndex;

        if (!duplicateBeforeActiveLeg && !originAndDestination) {
          const duplicateLeg = duplicateSegment.allLegs[duplicateIndexInSegment];
          if (duplicateLeg.isDiscontinuity === true) {
            throw new Error('[FMS/FPM] Duplicate leg cannot be a discontinuity');
          }

          duplicateLeg.withDefinitionFrom(firstArrivalLeg).withPilotEnteredDataFrom(firstArrivalLeg);

          this.removeRange(duplicatePlanIndex + 1, firstArrivalLegIndexInPlan + 1);
          duplicateSegment.strung = true;

          return;
        }
      }
    }

    // Unstring
    const lastUpstreamElement = this.allLegs[firstArrivalLegIndexInPlan - 1];
    if (lastUpstreamElement?.isDiscontinuity === false) {
      // I'm not sure if constraints should really just be cleared, but we want to remove the STAR constraints at least
      lastUpstreamElement.clearConstraints();

      // Insert disco otherwise
      this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
      this.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, this.enrouteSegment);
    }
  }

  private isProcedureBeingFlownInSegment(ident: string, segment: FlightPlanSegment): boolean {
    return (
      segment.allLegs.filter(
        (el, idx) => idx >= this.activeLegIndex && el.isDiscontinuity === false && el.annotation === ident,
      ).length > 0
    );
  }

  private findLastDepartureLeg(): [FlightPlanSegment, number, number] {
    for (let segment = this.previousSegment(this.enrouteSegment); segment; segment = this.previousSegment(segment)) {
      const lastLegIndex = segment.lastLegIndex;
      if (lastLegIndex < 0) {
        continue;
      }

      const totalIndex = this.indexForSegmentPosition(segment, lastLegIndex);

      return [segment, lastLegIndex, totalIndex];
    }

    return [undefined, -1, -1];
  }

  private findFirstArrivalLeg(): [FlightPlanSegment, number, number] {
    for (let segment = this.nextSegment(this.enrouteSegment); segment; segment = this.nextSegment(segment)) {
      if (segment.legCount < 0) {
        continue;
      }

      const firstLegIndex = segment.allLegs[0].isDiscontinuity === true ? 1 : 0;
      const totalIndex = this.indexForSegmentPosition(segment, firstLegIndex);

      return [segment, firstLegIndex, totalIndex];
    }

    return [undefined, -1, -1];
  }

  private adjustIFLegs() {
    const elements = this.allLegs;

    for (let i = 0; i < elements.length; i++) {
      const prevElement = elements[i - 1];
      const element = elements[i];

      // IF -> XX if no discontinuity before, and element present
      if (i !== 0 && element && element.isDiscontinuity === false && element.type === LegType.IF) {
        if (
          (prevElement && prevElement.isDiscontinuity === true) ||
          (prevElement.isDiscontinuity === false && prevElement.isXI())
        ) {
          continue;
        }

        // TODO sync
        if (element.definition.type === LegType.IF && element.ident !== 'T-P') {
          element.type = LegType.TF;
        } else {
          element.type = element.definition.type;
        }
      }

      // XX -> IF if no element, or discontinuity before, or 0th leg
      if (element && element.isDiscontinuity === false && element.type !== LegType.IF) {
        // T-P legs need to always be CF so they can create a direct-to-fix transition outbound of them
        const isLegTurningPoint = BitFlags.isAny(element.flags, FlightPlanLegFlags.DirectToTurningPoint);

        // TODO sync
        if (!isLegTurningPoint && (!prevElement || (prevElement && prevElement.isDiscontinuity === true) || i === 0)) {
          element.type = LegType.IF;
        }
      }
    }
  }

  private ensureNoDuplicateDiscontinuities() {
    let numConsecutiveDiscos = 1;

    for (let i = 0; i < this.orderedSegments.length; i++) {
      const segment = this.orderedSegments[i];
      const toDelete = [];

      for (let j = 0; j < segment.allLegs.length; j++) {
        const element = segment.allLegs[j];
        if (element.isDiscontinuity) {
          // DISCO
          numConsecutiveDiscos++;
        } else {
          // LEG
          if (numConsecutiveDiscos > 1) {
            toDelete.push({ start: j - numConsecutiveDiscos + 1, length: numConsecutiveDiscos - 1 });
          }

          numConsecutiveDiscos = 0;
        }
      }

      if (numConsecutiveDiscos > 1) {
        toDelete.push({ start: segment.allLegs.length - numConsecutiveDiscos + 1, length: numConsecutiveDiscos - 1 });
        numConsecutiveDiscos = 1;
      }

      for (let i = toDelete.length - 1; i >= 0; i--) {
        const { start, length } = toDelete[i];
        segment.allLegs.splice(start, length);
      }
    }
  }

  /**
   * Ensures that TF legs only follow XF or hold legs.
   * Anything else breaks the geometry
   */
  private adjustTFLegs() {
    for (let i = 1; i < this.legCount; i++) {
      const leg = this.maybeElementAt(i);
      const prevLeg = this.maybeElementAt(i - 1);

      if (!leg || leg.isDiscontinuity === true || !prevLeg || prevLeg.isDiscontinuity === true) {
        continue;
      }

      if (leg.type === LegType.TF && !(prevLeg.isXF() || prevLeg.isHX())) {
        leg.type = LegType.DF;
      }
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
      while (
        segment.legCount > 0 &&
        segment.allLegs[segment.legCount - 1].isDiscontinuity === true &&
        numIterations++ < 10
      ) {
        segment.allLegs.pop();
      }

      break;
    }
  }

  private selectActiveLeg() {
    // If we're on an arrival segment and select a different arrival, the active leg should be the first leg of the arrival
    if (this.activeLegIndex === -1) {
      return;
    }

    const [_, __, indexInPlan] = this.findFirstArrivalLeg();
    if (indexInPlan === -1) {
      return;
    }

    if (this.activeLegIndex > indexInPlan) {
      console.log('[FMS/FPM] Active leg index is after the first arrival leg, resetting');
      this.setActiveLegIndex(indexInPlan);
    }
  }

  private async rebuildArrivalAndApproachSegments() {
    // We call the segment functions here, otherwise we infinitely enqueue restrings and rebuilds since calling
    // the methods on BaseFlightPlan flush the op queue

    if (this.approach) {
      await this.approachSegment.setProcedure(this.approach.databaseId);
    }

    if (this.approachVia) {
      await this.approachViaSegment.setProcedure(this.approachVia.databaseId);
    }

    if (this.arrival) {
      await this.arrivalSegment.setProcedure(this.arrival.databaseId);
    }

    if (this.arrivalEnrouteTransition) {
      await this.arrivalEnrouteTransitionSegment.setProcedure(this.arrivalEnrouteTransition.databaseId);
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
    if (start >= end) {
      return;
    }

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

      destinationAirport: this.destinationSegment?.destinationAirport?.ident ?? '',

      originAirport: this.originSegment?.originAirport?.ident ?? '',
      originRunway: this.originRunway?.ident ?? '',
      destinationRunway: this.destinationRunway?.ident ?? '',

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

      const climbConstraint =
        leg.constraintType === WaypointConstraintType.CLB
          ? ConstraintUtils.maximumAltitude(leg.altitudeConstraint)
          : Infinity;
      if (climbConstraint < lowestClimbConstraint) {
        lowestClimbConstraint = climbConstraint;
      }
    }

    return lowestClimbConstraint;
  }

  deduplicateDownstreamAt(atIndex: number, keepUpstreamVsDownstream: boolean = false) {
    const leg = this.legElementAt(atIndex);
    if (!leg.isXF() && !leg.isFX() && !leg.isHX()) {
      throw new Error('[FMS/FPM] Can only deduplicate XF, FX or HX legs');
    }

    const duplicate = this.findDuplicate(leg.terminationWaypoint(), atIndex);
    if (!duplicate) {
      return;
    }

    const [_, __, planIndex] = duplicate;
    this.removeRange(
      keepUpstreamVsDownstream ? atIndex + 1 : atIndex,
      keepUpstreamVsDownstream ? planIndex + 1 : planIndex,
    );
    this.incrementVersion();
  }
}

export interface SerializedFlightPlan {
  activeLegIndex: number;

  fixInfo: readonly FixInfoEntry[];

  performanceData?: SerializedFlightPlanPerformanceData;

  originAirport: string;
  originRunway: string;
  destinationAirport: string;
  destinationRunway: string;

  segments: {
    originSegment: SerializedFlightPlanSegment;
    departureRunwayTransitionSegment: SerializedFlightPlanSegment;
    departureSegment: SerializedFlightPlanSegment;
    departureEnrouteTransitionSegment: SerializedFlightPlanSegment;
    enrouteSegment: SerializedFlightPlanSegment;
    arrivalEnrouteTransitionSegment: SerializedFlightPlanSegment;
    arrivalSegment: SerializedFlightPlanSegment;
    arrivalRunwayTransitionSegment: SerializedFlightPlanSegment;
    approachViaSegment: SerializedFlightPlanSegment;
    approachSegment: SerializedFlightPlanSegment;
    destinationSegment: SerializedFlightPlanSegment;
    missedApproachSegment: SerializedFlightPlanSegment;
  };

  alternateFlightPlan?: SerializedFlightPlan;
}
