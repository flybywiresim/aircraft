// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';
import { FlightPlanDefinition } from '@fmgc/flightplanning/new/FlightPlanDefinition';

export enum FlightPlanIndex {
    Active,
    Temporary,
    FirstSecondary,
}

export class FlightPlanManager {
    private plans: FlightPlan[] = []

    has(index: number) {
        return this.plans[index] !== undefined;
    }

    get(index: number) {
        this.assertFlightPlanExists(index);

        return this.plans[index];
    }

    private set(index: number, flightPlan: FlightPlan) {
        this.plans[index] = flightPlan;
    }

    create(index: number, definition?: FlightPlanDefinition) {
        this.assertFlightPlanDoesntExist(index);

        const flightPlan = definition ? FlightPlan.fromDefinition(definition) : FlightPlan.empty();

        this.plans[index] = flightPlan;
    }

    delete(index: number) {
        this.assertFlightPlanExists(index);

        this.plans[index] = undefined;
    }

    deleteAll() {
        this.plans.length = 0;
        this.plans.push(FlightPlan.empty());
    }

    copy(from: number, to: number) {
        this.assertFlightPlanExists(from);

        const newPlan = this.get(from).clone();

        this.set(to, newPlan);
    }

    swap(a: number, b: number) {
        this.assertFlightPlanExists(a);
        this.assertFlightPlanExists(b);

        const planA = this.get(a);
        const planB = this.get(b);

        this.delete(a);
        this.delete(b);

        this.set(a, planB);
        this.set(b, planA);
    }

    private assertFlightPlanExists(index: number) {
        if (!this.plans[index]) {
            throw new Error(`[FMS/FlightPlanManager] Tried to access non-existent flight plan at index #${index}`);
        }
    }

    private assertFlightPlanDoesntExist(index: number) {
        if (this.plans[index]) {
            throw new Error(`[FMS/FlightPlanManager] Tried to create existent flight plan at index #${index}`);
        }
    }
}
