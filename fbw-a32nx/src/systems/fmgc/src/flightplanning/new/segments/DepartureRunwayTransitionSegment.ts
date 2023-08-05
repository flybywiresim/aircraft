// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { ProcedureTransition } from 'msfs-navdata';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { ProcedureSegment } from '@fmgc/flightplanning/new/segments/ProcedureSegment';

export class DepartureRunwayTransitionSegment extends ProcedureSegment<ProcedureTransition> {
    class = SegmentClass.Departure

    allLegs: FlightPlanElement[] = []

    get procedure(): ProcedureTransition | undefined {
        return this.departureRunwayTransition;
    }

    private departureRunwayTransition: ProcedureTransition | undefined = undefined

    async setProcedure(ident: string | undefined, skipUpdateLegs?: boolean): Promise<void> {
        const existingDeparture = this.flightPlan.originDeparture;

        if (existingDeparture) {
            const matchingTransition = ident !== undefined ? existingDeparture.runwayTransitions.find((it) => it.ident === ident) : undefined;

            this.departureRunwayTransition = matchingTransition;
        } else {
            this.departureRunwayTransition = undefined;
        }

        if (!skipUpdateLegs) {
            const legs = this.departureRunwayTransition?.legs.map((it) => FlightPlanLeg.fromProcedureLeg(this, it, existingDeparture?.ident ?? '')) ?? [];

            this.allLegs.length = 0;
            this.allLegs.push(...legs);
            this.strung = false;

            await this.flightPlan.originSegment.refreshOriginLegs();

            this.flightPlan.syncSegmentLegsChange(this);
            this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
        }
    }

    clone(forPlan: BaseFlightPlan): DepartureRunwayTransitionSegment {
        const newSegment = new DepartureRunwayTransitionSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.departureRunwayTransition = this.departureRunwayTransition;

        return newSegment;
    }
}
