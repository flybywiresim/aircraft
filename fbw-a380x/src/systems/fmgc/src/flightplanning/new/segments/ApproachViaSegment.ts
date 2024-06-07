// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ProcedureTransition } from 'msfs-navdata';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';

export class ApproachViaSegment extends FlightPlanSegment {
    class = SegmentClass.Arrival

    allLegs: FlightPlanElement[] = []

    private approachVia: ProcedureTransition | undefined = undefined

    get approachViaProcedure() {
        return this.approachVia;
    }

    async setApproachVia(transitionIdent: string | undefined): Promise<void> {
        if (transitionIdent === undefined) {
            this.approachVia = undefined;
            this.allLegs.length = 0;
            return;
        }

        const { approach } = this.flightPlan;

        if (!approach) {
            throw new Error('[FMS/FPM] Cannot set approach via without approach');
        }

        const approachVias = approach.transitions;

        const matchingApproachVia = approachVias.find((transition) => transition.ident === transitionIdent);

        if (!matchingApproachVia) {
            throw new Error(`[FMS/FPM] Can't find arrival approach via '${transitionIdent}' for ${approach.ident}`);
        }

        this.approachVia = matchingApproachVia;
        this.allLegs.length = 0;

        const mappedApproachViaLegs = matchingApproachVia.legs.map((leg) => FlightPlanLeg.fromProcedureLeg(this, leg, matchingApproachVia.ident));
        this.allLegs.push(...mappedApproachViaLegs);
        this.strung = false;

        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    }

    clone(forPlan: BaseFlightPlan): ApproachViaSegment {
        const newSegment = new ApproachViaSegment(forPlan);

        newSegment.allLegs = [...this.allLegs];
        newSegment.approachVia = this.approachVia;

        return newSegment;
    }
}
