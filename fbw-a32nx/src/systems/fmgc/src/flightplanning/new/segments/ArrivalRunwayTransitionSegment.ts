// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ProcedureTransition } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { ProcedureSegment } from '@fmgc/flightplanning/new/segments/ProcedureSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { RestringOptions } from '../plans/RestringOptions';

export class ArrivalRunwayTransitionSegment extends ProcedureSegment<ProcedureTransition> {
    class = SegmentClass.Arrival

    allLegs: FlightPlanElement[] = []

    public get procedure(): ProcedureTransition | undefined {
        return this.arrivalRunwayTransition;
    }

    private arrivalRunwayTransition: ProcedureTransition | undefined = undefined

    async setProcedure(ident: string | undefined, skipUpdateLegs?: boolean): Promise<void> {
        const existingArrival = this.flightPlan.arrival;

        if (existingArrival) {
            const matchingTransition = ident !== undefined ? existingArrival.runwayTransitions.find((it) => it.ident === ident) : undefined;

            this.arrivalRunwayTransition = matchingTransition;
        } else {
            this.arrivalRunwayTransition = undefined;
        }

        if (!skipUpdateLegs) {
            const legs = this.arrivalRunwayTransition?.legs.map(
                (it) => FlightPlanLeg.fromProcedureLeg(this, it, existingArrival?.ident ?? '', WaypointConstraintType.DES),
            ) ?? [];

            this.allLegs.length = 0;
            this.allLegs.push(...legs);
            this.strung = false;

            this.flightPlan.syncSegmentLegsChange(this);

            this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
            this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringArrival);
        }
    }

    clone(forPlan: BaseFlightPlan): ArrivalRunwayTransitionSegment {
        const newSegment = new ArrivalRunwayTransitionSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.arrivalRunwayTransition = this.arrivalRunwayTransition;

        return newSegment;
    }
}
