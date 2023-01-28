// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Approach, Runway, WaypointDescriptor } from 'msfs-navdata';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export class ApproachSegment extends FlightPlanSegment {
    class = SegmentClass.Arrival

    allLegs: FlightPlanElement[] = []

    private approach: Approach | undefined

    get approachProcedure() {
        return this.approach;
    }

    async setApproachProcedure(procedureIdent: string | undefined) {
        const oldApproachName = this.flightPlan.approach?.ident;

        const db = NavigationDatabaseService.activeDatabase.backendDatabase;

        if (procedureIdent === undefined) {
            this.flightPlan.approachViaSegment.setApproachVia(undefined);
            this.approach = undefined;
            this.allLegs = this.createLegSet([]);

            this.flightPlan.syncSegmentLegsChange(this);
            this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);

            return;
        }

        const { destinationAirport } = this.flightPlan.destinationSegment;

        if (!destinationAirport) {
            throw new Error('[FMS/FPM] Cannot set approach without destination airport');
        }

        const approaches = await db.getApproaches(destinationAirport.ident);

        const matchingProcedure = approaches.find((approach) => approach.ident === procedureIdent);

        if (!matchingProcedure) {
            throw new Error(`[FMS/FPM] Can't find approach procedure '${procedureIdent}' for ${destinationAirport.ident}`);
        }

        this.approach = matchingProcedure;
        this.allLegs = this.createLegSet(matchingProcedure.legs.map((leg) => FlightPlanLeg.fromProcedureLeg(this, leg, matchingProcedure.ident)));
        this.strung = false;

        // Set plan destination runway
        const procedureRunwayIdent = matchingProcedure.runwayIdent;

        if (procedureRunwayIdent) {
            // TODO temporary workaround for bug in msfs backend
            await this.flightPlan.destinationSegment.setDestinationRunway(procedureRunwayIdent.startsWith('R') ? procedureRunwayIdent : `RW${procedureRunwayIdent}`, true);
        }

        const mappedMissedApproachLegs = matchingProcedure.missedLegs.map((leg) => FlightPlanLeg.fromProcedureLeg(this.flightPlan.missedApproachSegment, leg, matchingProcedure.ident));
        this.flightPlan.missedApproachSegment.setMissedApproachLegs(mappedMissedApproachLegs);

        // Clear flight plan approach via if the new approach is different
        if (oldApproachName !== matchingProcedure.ident) {
            await this.flightPlan.approachViaSegment.setApproachVia(undefined);
        }

        this.flightPlan.availableApproachVias = matchingProcedure.transitions;

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    }

    createLegSet(approachLegs: FlightPlanElement[]): FlightPlanElement[] {
        const legs = [];

        const airport = this.flightPlan.destinationAirport;
        const runway = this.flightPlan.destinationRunway;

        if (approachLegs.length === 0 && this.flightPlan.destinationAirport && this.flightPlan.destinationSegment.destinationRunway) {
            const cf = FlightPlanLeg.destinationExtendedCenterline(
                this,
                airport,
                runway,
            );

            legs.push(cf);
            legs.push(FlightPlanLeg.fromAirportAndRunway(this, '', airport, runway));
        } else {
            const lastLeg = approachLegs[approachLegs.length - 1];

            if (lastLeg && lastLeg.isDiscontinuity === false && lastLeg.waypointDescriptor === WaypointDescriptor.Runway) {
                legs.push(...approachLegs.slice(0, approachLegs.length - 1));

                const runway = this.findRunwayFromRunwayLeg(lastLeg);

                if (lastLeg?.isDiscontinuity === false && lastLeg.waypointDescriptor === WaypointDescriptor.Runway) {
                    const mappedLeg = FlightPlanLeg.fromAirportAndRunway(this, this.approachProcedure?.ident ?? '', airport, runway);

                    if (approachLegs.length > 1) {
                        mappedLeg.type = lastLeg.type;
                        Object.assign(mappedLeg.definition, lastLeg.definition);
                    }

                    legs.push(mappedLeg);
                }
            } else {
                legs.push(...approachLegs);
            }
        }

        return legs;
    }

    private findRunwayFromRunwayLeg(leg: FlightPlanLeg): Runway | undefined {
        return this.flightPlan.availableDestinationRunways.find((it) => it.ident === leg.ident);
    }

    private findRunwayFromApproachIdent(ident: string, runwaySet: Runway[]): Runway | undefined {
        const runwaySpecificApproachPrefixes = /[ILDRV]/;

        const ident0 = ident.substring(0, 1);
        const ident1 = ident.substring(1, 2);
        if (ident0.match(runwaySpecificApproachPrefixes) && ident1.match(/\d/)) {
            const rwyNumber = ident.substring(1, 3);

            return runwaySet.find((it) => it.ident === `RW${rwyNumber}`);
        }

        return undefined;
    }

    clone(forPlan: BaseFlightPlan): ApproachSegment {
        const newSegment = new ApproachSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.approach = this.approach;

        return newSegment;
    }
}
