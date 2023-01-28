// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airway, AirwayDirection, Waypoint } from 'msfs-navdata';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { EnrouteSegment } from '@fmgc/flightplanning/new/segments/EnrouteSegment';

export interface PendingAirwayEntry {
    fromIndex?: number,
    airway?: Airway,
    to?: Waypoint,
    isDct?: true,
    isAutoConnected?: true,
}

export class PendingAirways {
    elements: PendingAirwayEntry[] = [];

    legs: FlightPlanLeg[] = [];

    revisedWaypoint: Waypoint;

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

    thenAirway(airway: Airway) {
        if (airway.direction === AirwayDirection.Backward) {
            airway.fixes.reverse();
        }

        const taiLElement = this.tailElement;

        let startWaypointIndex: number;
        done: if (!taiLElement || taiLElement.to) {
            // No airways have been entered. We consider the revised waypoint to be the start of the new entry.
            // OR
            // An airway is entered and has a TO.

            const startIdent = taiLElement ? taiLElement.to.ident : this.revisedWaypoint.ident;
            const startIcaoCode = taiLElement ? taiLElement.to.icaoCode : this.revisedWaypoint.icaoCode;
            for (let i = 0; i < airway.fixes.length; i++) {
                const fix = airway.fixes[i];

                if (startIdent === fix.ident && startIcaoCode === fix.icaoCode) {
                    startWaypointIndex = i;
                    break done;
                }
            }

            return false;
        } else {
            // We do not have an end waypoint defined as part of the previous entry. We find an automatic or geographic intersection.

            for (let i = 0; i < taiLElement.airway.fixes.length; i++) {
                const fix = taiLElement.airway.fixes[i];

                const matchInCurrentIndex = airway.fixes.findIndex((it) => it.ident === fix.ident && it.icaoCode === fix.icaoCode);
                const matchInCurrent = airway.fixes[matchInCurrentIndex];

                if (matchInCurrent && matchInCurrentIndex < airway.fixes.length) {
                    taiLElement.to = matchInCurrent;
                    taiLElement.isAutoConnected = true;

                    const reversed = i + 1 < taiLElement.fromIndex;
                    const fixesArray = reversed ? taiLElement.airway.fixes.slice().reverse() : taiLElement.airway.fixes;

                    let start;
                    let end;
                    if (reversed) {
                        start = fixesArray.length - taiLElement.fromIndex;
                        end = fixesArray.length - i;
                    } else {
                        start = taiLElement.fromIndex + 1;
                        end = i + 1;
                    }

                    const splitLegs = fixesArray.slice(start, end);
                    const mappedSplitLegs = splitLegs.map((it) => FlightPlanLeg.fromEnrouteFix(this.flightPlan.enrouteSegment, it, taiLElement.airway.ident));

                    this.legs.push(...mappedSplitLegs);

                    startWaypointIndex = matchInCurrentIndex;
                    break done;
                }
            }

            // No automatic intersection is found, let's try to find a geographic one

            // TODO

            console.error(`No automatic airway intersection found between last airway id=${taiLElement.airway.databaseId} and airway id=${airway.databaseId} - geographic intersections not yet implemented`);
            return false;
        }

        // Insert the entry
        this.elements.push({
            fromIndex: startWaypointIndex,
            airway,
        });

        this.flightPlan.incrementVersion();
        return true;
    }

    thenTo(waypoint: Waypoint) {
        const taiLElement = this.tailElement;

        if (taiLElement.to) {
            // The tail element is already complete, so we do a DCT entry

            this.elements.push({ to: waypoint, isDct: true });

            const mappedLeg = FlightPlanLeg.fromEnrouteFix(this.flightPlan.enrouteSegment, waypoint);

            this.legs.push(mappedLeg);

            return true;
        }

        const tailAirway = taiLElement.airway;

        let endWaypointIndex;
        for (let i = 0; i < tailAirway.fixes.length; i++) {
            const fix = tailAirway.fixes[i];

            if (waypoint.ident === fix.ident && waypoint.icaoCode === fix.icaoCode) {
                endWaypointIndex = i;
                break;
            }
        }

        if (endWaypointIndex === undefined) {
            return false;
        }

        const reversed = endWaypointIndex + 1 < taiLElement.fromIndex;
        const fixesArray = reversed ? taiLElement.airway.fixes.slice().reverse() : taiLElement.airway.fixes;

        let start;
        let end;
        if (reversed) {
            start = fixesArray.length - taiLElement.fromIndex;
            end = fixesArray.length - endWaypointIndex;
        } else {
            start = taiLElement.fromIndex + 1;
            end = endWaypointIndex + 1;
        }

        const splitLegs = fixesArray.slice(start, end);
        const mappedSplitLegs = splitLegs.map((it) => FlightPlanLeg.fromEnrouteFix(this.flightPlan.enrouteSegment, it, taiLElement.airway.ident));

        this.legs.push(...mappedSplitLegs);

        taiLElement.to = waypoint;

        this.flightPlan.incrementVersion();

        return true;
    }

    finalize() {
        this.flightPlan.redistributeLegsAt(this.revisedLegIndex);

        const [segment, indexInSegment] = this.flightPlan.segmentPositionForIndex(this.revisedLegIndex);

        if (!(segment instanceof EnrouteSegment)) {
            throw new Error('Finalizing pending airways into a segment that isn\'t enroute is not yet supported');
        }

        this.flightPlan.enrouteSegment.allLegs.splice(indexInSegment + 1, 0, ...this.legs);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
        this.flightPlan.flushOperationQueue();
    }
}
