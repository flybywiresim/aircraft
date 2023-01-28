// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { FlightPlanElement } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { ProcedureTransition } from 'msfs-navdata';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';

export class DepartureRunwayTransitionSegment extends FlightPlanSegment {
    class = SegmentClass.Departure

    allLegs: FlightPlanElement[] = []

    private departureRunwayTransition: ProcedureTransition | undefined = undefined

    get departureRunwayTransitionProcedure() {
        return this.departureRunwayTransition;
    }

    async setOriginRunwayTransitionSegment(transition: ProcedureTransition | undefined, legs: FlightPlanElement[]) {
        this.allLegs.length = 0;
        this.allLegs.push(...legs);
        this.strung = false;

        this.departureRunwayTransition = transition;

        await this.flightPlan.originSegment.refreshOriginLegs();

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    }

    clone(forPlan: BaseFlightPlan): DepartureRunwayTransitionSegment {
        const newSegment = new DepartureRunwayTransitionSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.departureRunwayTransition = this.departureRunwayTransition;

        return newSegment;
    }
}
