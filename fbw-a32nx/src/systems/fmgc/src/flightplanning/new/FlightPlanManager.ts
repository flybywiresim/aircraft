// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';
import { EventBus, Publisher } from 'msfssdk';
import { FlightPlanSyncEvents } from '@fmgc/flightplanning/new/sync/FlightPlanSyncEvents';

export enum FlightPlanIndex {
    Active,
    Temporary,
    Uplink,
    FirstSecondary,
}

export class FlightPlanManager {
    private plans: FlightPlan[] = []

    private ignoreSync = false;

    constructor(
        private readonly bus: EventBus,
        private readonly syncClientID: number,
    ) {
        const subs = bus.getSubscriber<FlightPlanSyncEvents>();

        subs.on('flightPlanManager.create').handle((event) => {
            if (!this.ignoreSync) {
                console.log(`[FpmSync] Create(${event.planIndex})`);
                this.create(event.planIndex, false);
            }
        });

        subs.on('flightPlanManager.delete').handle((event) => {
            if (!this.ignoreSync) {
                console.log(`[FpmSync] Delete(${event.planIndex})`);
                this.delete(event.planIndex, false);
            }
        });

        subs.on('flightPlanManager.deleteAll').handle(() => {
            if (!this.ignoreSync) {
                console.log('[FpmSync] DeleteAll');
                this.deleteAll(false);
            }
        });

        subs.on('flightPlanManager.copy').handle((event) => {
            if (!this.ignoreSync) {
                console.log(`[FpmSync] Copy(${event.planIndex}, ${event.targetPlanIndex})`);
                this.copy(event.planIndex, event.targetPlanIndex, false);
            }
        });

        subs.on('flightPlanManager.swap').handle((event) => {
            if (!this.ignoreSync) {
                console.log(`[FpmSync] Swap(${event.planIndex}, ${event.targetPlanIndex})`);
                this.swap(event.planIndex, event.targetPlanIndex, false);
            }
        });

        this.syncPub = this.bus.getPublisher<FlightPlanSyncEvents>();
    }

    private readonly syncPub: Publisher<FlightPlanSyncEvents>;

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

    create(index: number, notify = true) {
        this.assertFlightPlanDoesntExist(index);

        this.plans[index] = FlightPlan.empty(index, this.bus);

        if (notify) {
            this.sendEvent('flightPlanManager.create', { planIndex: index });
        }
    }

    delete(index: number, notify = true) {
        this.assertFlightPlanExists(index);

        this.plans[index] = undefined;

        if (notify) {
            this.sendEvent('flightPlanManager.delete', { planIndex: index });
        }
    }

    deleteAll(notify = true) {
        this.plans.length = 0;
        this.plans.push(FlightPlan.empty(FlightPlanIndex.Active, this.bus));

        if (notify) {
            this.sendEvent('flightPlanManager.deleteAll', undefined);
        }
    }

    copy(from: number, to: number, notify = true) {
        this.assertFlightPlanExists(from);

        const newPlan = this.get(from).clone(to);

        this.set(to, newPlan);
        this.get(to).incrementVersion();

        if (notify) {
            this.sendEvent('flightPlanManager.copy', { planIndex: from, targetPlanIndex: to });
        }
    }

    swap(a: number, b: number, notify = true) {
        this.assertFlightPlanExists(a);
        this.assertFlightPlanExists(b);

        const planA = this.get(a);
        const planB = this.get(b);

        this.delete(a, false);
        this.delete(b, false);

        this.set(a, planB);
        this.set(b, planA);

        if (notify) {
            this.sendEvent('flightPlanManager.swap', { planIndex: a, targetPlanIndex: b });
        }
    }

    private sendEvent<K extends keyof FlightPlanSyncEvents>(topic: K, data: FlightPlanSyncEvents[K]): void {
        this.ignoreSync = true;
        this.syncPub.pub(topic, data, true);
        this.ignoreSync = false;
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
