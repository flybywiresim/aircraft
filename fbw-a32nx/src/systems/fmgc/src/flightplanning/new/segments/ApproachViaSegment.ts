// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { LegType, ProcedureTransition } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { ProcedureSegment } from '@fmgc/flightplanning/new/segments/ProcedureSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { RestringOptions } from '../plans/RestringOptions';

export class ApproachViaSegment extends ProcedureSegment<ProcedureTransition> {
    class = SegmentClass.Arrival

    allLegs: FlightPlanElement[] = []

    get procedure(): ProcedureTransition | undefined {
        return this.approachVia;
    }

    private approachVia: ProcedureTransition | undefined = undefined

    setProcedure(databaseId: string | undefined, skipUpdateLegs?: boolean): Promise<void> {
        if (databaseId === undefined) {
            this.approachVia = undefined;

            if (!skipUpdateLegs) {
                this.allLegs.length = 0;

                this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
                this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringArrival);
                this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, this);
            }

            return;
        }

        const { approach } = this.flightPlan;

        if (!approach) {
            throw new Error('[FMS/FPM] Cannot set approach via without approach');
        }

        const approachVias = approach.transitions;

        const matchingApproachVia = approachVias.find((transition) => transition.databaseId === databaseId);

        if (!matchingApproachVia) {
            throw new Error(`[FMS/FPM] Can't find arrival approach via '${databaseId}' for ${approach.ident}`);
        }

        this.approachVia = matchingApproachVia;

        if (skipUpdateLegs) {
            return;
        }

        this.allLegs.length = 0;

        const mappedApproachViaLegs = matchingApproachVia.legs.map((leg) => FlightPlanLeg.fromProcedureLeg(this, leg, matchingApproachVia.ident, WaypointConstraintType.DES));

        const firstApproachViaLeg = mappedApproachViaLegs[0];

        // Add an IF at the start if first leg of the VIA is a PI or FX
        if (firstApproachViaLeg.type === LegType.PI || firstApproachViaLeg.isFX()) {
            const newLeg = FlightPlanLeg.fromEnrouteFix(this, firstApproachViaLeg.definition.waypoint, undefined, LegType.IF);

            this.allLegs.push(newLeg);
        }

        this.allLegs.push(...mappedApproachViaLegs);
        this.strung = false;

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringArrival);
    }

    clone(forPlan: BaseFlightPlan): ApproachViaSegment {
        const newSegment = new ApproachViaSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.approachVia = this.approachVia;

        return newSegment;
    }
}
