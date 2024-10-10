// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airway, AirwayDirection, Fix } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { EnrouteSegment } from '@fmgc/flightplanning/segments/EnrouteSegment';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';

export interface PendingAirwayEntry {
  fromIndex?: number;
  airway?: Airway;
  to?: Fix;
  isDct?: true;
  isAutoConnected?: true;
}

export class PendingAirways {
  elements: PendingAirwayEntry[] = [];

  legs: FlightPlanLeg[] = [];

  revisedWaypoint: Fix;

  constructor(
    private readonly flightPlan: BaseFlightPlan,
    private readonly revisedLegIndex: number,
    private readonly revisedLeg: FlightPlanLeg,
  ) {
    if (!revisedLeg.isXF() && !revisedLeg.isHX()) {
      throw new Error('Cannot create a pending airways entry from a non XF or HX leg');
    }

    this.revisedWaypoint = revisedLeg.terminationWaypoint();
  }

  private get tailElement(): PendingAirwayEntry | undefined {
    if (this.elements.length === 0) {
      return undefined;
    }

    return this.elements[this.elements.length - 1];
  }

  private findFixIndexAlongAirway(airway: Airway, fix: Fix) {
    return airway.fixes.findIndex((it) => it.ident === fix.ident && it.icaoCode === fix.icaoCode);
  }

  public async fixAlongTailAirway(ident: string) {
    const fixAlongAirway = this.tailElement.airway.fixes.find((fix) => fix.ident === ident);

    if (fixAlongAirway) {
      return fixAlongAirway;
    }
    throw new FmsError(FmsErrorType.NotInDatabase);
  }

  private findAutomaticAirwayIntersectionIndex(one: Airway, two: Airway): [number, number] {
    for (let i = 0; i < one.fixes.length; i++) {
      const fix = one.fixes[i];

      const matchIndex = this.findFixIndexAlongAirway(two, fix);
      if (matchIndex !== -1) {
        return [i, matchIndex];
      }
    }

    return [-1, -1];
  }

  private sliceAirway(airway: Airway, from: number, to: number) {
    const reversed = from > to;
    const fixesArray = reversed ? airway.fixes.slice().reverse() : airway.fixes;

    let start: number;
    let end: number;
    if (reversed) {
      start = fixesArray.length - from;
      end = fixesArray.length - to;
    } else {
      start = from + 1;
      end = to + 1;
    }

    return fixesArray.slice(start, end);
  }

  thenAirway(airway: Airway) {
    if (airway.direction === AirwayDirection.Backward) {
      airway.fixes.reverse();
    }

    const tailElement = this.tailElement;

    let startWaypointIndex: number;
    if (!tailElement || tailElement.to) {
      // No airways have been entered. We consider the revised waypoint to be the start of the new entry.
      // OR
      // An airway is entered and has a TO.
      startWaypointIndex = this.findFixIndexAlongAirway(airway, tailElement ? tailElement.to : this.revisedWaypoint);
      if (startWaypointIndex === -1) {
        return false;
      }
    } else {
      // We do not have an end waypoint defined as part of the previous entry. We find an automatic or geographic intersection.
      const [indexAlongTailElement, indexAlongEnteredAirway] = this.findAutomaticAirwayIntersectionIndex(
        tailElement.airway,
        airway,
      );

      const fixAlongEnteredAirway = airway.fixes[indexAlongEnteredAirway];
      if (!fixAlongEnteredAirway) {
        // No automatic intersection is found, let's try to find a geographic one
        // TODO
        console.error(
          `No automatic airway intersection found between last airway id=${tailElement.airway.databaseId} and
                    airway id=${airway.databaseId} - geographic intersections not yet implemented`,
        );
        return false;
      }

      tailElement.to = fixAlongEnteredAirway;
      tailElement.isAutoConnected = true;

      const splitLegs = this.sliceAirway(tailElement.airway, tailElement.fromIndex, indexAlongTailElement);
      const mappedSplitLegs = splitLegs.map((it) =>
        FlightPlanLeg.fromEnrouteFix(this.flightPlan.enrouteSegment, it, tailElement.airway.ident),
      );

      this.legs.push(...mappedSplitLegs);

      startWaypointIndex = indexAlongEnteredAirway;
    }

    // Insert the entry
    this.elements.push({
      fromIndex: startWaypointIndex,
      airway,
    });

    this.flightPlan.incrementVersion();
    return true;
  }

  thenTo(waypoint: Fix) {
    const tailElement = this.tailElement;

    if (tailElement.to) {
      // The tail element is already complete, so we do a DCT entry

      this.elements.push({ to: waypoint, isDct: true });

      const mappedLeg = FlightPlanLeg.fromEnrouteFix(this.flightPlan.enrouteSegment, waypoint);

      this.legs.push(mappedLeg);

      return true;
    }

    const tailAirway = tailElement.airway;

    const endWaypointIndex = this.findFixIndexAlongAirway(tailAirway, waypoint);
    if (endWaypointIndex === -1) {
      return false;
    }

    const splitLegs = this.sliceAirway(tailAirway, tailElement.fromIndex, endWaypointIndex);
    const mappedSplitLegs = splitLegs.map((it) =>
      FlightPlanLeg.fromEnrouteFix(this.flightPlan.enrouteSegment, it, tailElement.airway.ident),
    );

    this.legs.push(...mappedSplitLegs);

    tailElement.to = waypoint;

    this.flightPlan.incrementVersion();

    return true;
  }

  finalize() {
    this.flightPlan.redistributeLegsAt(this.revisedLegIndex);

    const [segment, indexInSegment] = this.flightPlan.segmentPositionForIndex(this.revisedLegIndex);

    if (!(segment instanceof EnrouteSegment)) {
      throw new Error("Finalizing pending airways into a segment that isn't enroute is not yet supported");
    }

    this.flightPlan.enrouteSegment.allLegs.splice(indexInSegment + 1, 0, ...this.legs);
    this.flightPlan.incrementVersion();
    this.flightPlan.deduplicateDownstreamAt(this.revisedLegIndex + this.legs.length);
    this.flightPlan.syncSegmentLegsChange(this.flightPlan.enrouteSegment);
    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    this.flightPlan.flushOperationQueue();
  }
}
