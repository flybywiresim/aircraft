// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { EventBus, Publisher, Subscription } from '@microsoft/msfs-sdk';
import {
  FlightPlanEvents,
  FlightPlanSyncResponsePacket,
  PerformanceDataFlightPlanSyncEvents,
} from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { SerializedFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { CopyOptions } from '@fmgc/flightplanning/plans/CloningOptions';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

export enum FlightPlanIndex {
  Active,
  Temporary,
  Uplink,
  FirstSecondary,
}

export class FlightPlanManager<P extends FlightPlanPerformanceData> {
  private plans: FlightPlan<P>[] = [];

  private ignoreSync = false;

  private subs: Subscription[] = [];

  public destroy() {
    this.subs.forEach((sub) => sub.destroy());
  }

  constructor(
    private readonly bus: EventBus,
    private readonly performanceDataInit: P,
    private readonly syncClientID: number,
    private readonly master: boolean,
  ) {
    const sub = bus.getSubscriber<FlightPlanEvents>();

    this.subs.push(
      sub.on('flightPlanManager.syncRequest').handle(() => {
        // TODO clarify, I guess only one instance should reply to this
        if (!this.ignoreSync && this.master) {
          console.log('[FpmSync] SyncRequest()');

          const plansRecord: Record<number, SerializedFlightPlan> = {};

          for (const plan of this.plans) {
            if (plan) {
              plansRecord[plan.index] = plan.serialize();
            }
          }

          const response: FlightPlanSyncResponsePacket = { plans: plansRecord };

          this.sendEvent('flightPlanManager.syncResponse', response);
        }
      }),
    );

    this.subs.push(
      sub.on('flightPlanManager.syncResponse').handle((event) => {
        if (!this.ignoreSync) {
          console.log('[FpmSync] SyncResponse()');

          for (const [index, serialisedPlan] of Object.entries(event.plans)) {
            const intIndex = parseInt(index);

            const newPlan = FlightPlan.fromSerializedFlightPlan(
              intIndex,
              serialisedPlan,
              this.bus,
              this.performanceDataInit.clone(),
            );

            this.set(intIndex, newPlan);
          }
        }
      }),
    );

    this.subs.push(
      sub.on('flightPlanManager.create').handle((event) => {
        if (!this.ignoreSync) {
          console.log(`[FpmSync] Create(${event.planIndex})`);
          this.create(event.planIndex, false);
        }
      }),
    );

    this.subs.push(
      sub.on('flightPlanManager.delete').handle((event) => {
        if (!this.ignoreSync) {
          console.log(`[FpmSync] Delete(${event.planIndex})`);
          this.delete(event.planIndex, false);
        }
      }),
    );

    this.subs.push(
      sub.on('flightPlanManager.deleteAll').handle(() => {
        if (!this.ignoreSync) {
          console.log('[FpmSync] DeleteAll');
          this.deleteAll(false);
        }
      }),
    );

    this.subs.push(
      sub.on('flightPlanManager.copy').handle((event) => {
        if (!this.ignoreSync) {
          console.log(`[FpmSync] Copy(${event.planIndex}, ${event.targetPlanIndex})`);
          this.copy(event.planIndex, event.targetPlanIndex, event.options, false);
        }
      }),
    );

    this.subs.push(
      sub.on('flightPlanManager.swap').handle((event) => {
        if (!this.ignoreSync) {
          console.log(`[FpmSync] Swap(${event.planIndex}, ${event.targetPlanIndex})`);
          this.swap(event.planIndex, event.targetPlanIndex, false);
        }
      }),
    );

    if (!this.master) {
      setTimeout(() => this.sendEvent('flightPlanManager.syncRequest', undefined), 5_000);
    }

    this.syncPub = this.bus.getPublisher<FlightPlanEvents>();
    this.perfSyncPub = this.bus.getPublisher<PerformanceDataFlightPlanSyncEvents<P>>();
  }

  private readonly syncPub: Publisher<FlightPlanEvents>;

  private readonly perfSyncPub: Publisher<PerformanceDataFlightPlanSyncEvents<P>>;

  has(index: number) {
    return this.plans[index] !== undefined;
  }

  get(index: number) {
    this.assertFlightPlanExists(index);

    return this.plans[index];
  }

  private set(index: number, flightPlan: FlightPlan<P>) {
    this.plans[index] = flightPlan;
  }

  create(index: number, notify = true) {
    this.assertFlightPlanDoesntExist(index);

    this.plans[index] = FlightPlan.empty(index, this.bus, this.performanceDataInit.clone());

    if (notify) {
      this.sendEvent('flightPlanManager.create', { planIndex: index });
    }
  }

  delete(index: number, notify = true) {
    this.assertFlightPlanExists(index);

    this.plans[index].destroy();
    this.plans[index] = undefined;

    if (notify) {
      this.sendEvent('flightPlanManager.delete', { planIndex: index });
    }
  }

  deleteAll(notify = true) {
    for (const plan of this.plans) {
      plan?.destroy();
    }

    this.plans.length = 0;

    if (notify) {
      this.sendEvent('flightPlanManager.deleteAll', undefined);
    }
  }

  copy(from: number, to: number, options = CopyOptions.Default, notify = true) {
    this.assertFlightPlanExists(from);

    const newPlan = this.get(from).clone(to, options);

    if (this.has(to)) {
      const old = this.get(to);
      old.destroy();
    }
    this.set(to, newPlan);
    this.get(to).incrementVersion();

    if (notify) {
      this.sendEvent('flightPlanManager.copy', { planIndex: from, targetPlanIndex: to, options });
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

  private sendEvent<k extends keyof FlightPlanEvents>(topic: k, data: FlightPlanEvents[k]): void {
    this.ignoreSync = true;
    this.syncPub.pub(topic, data, true, false);
    this.ignoreSync = false;
  }

  private sendPerfEvent<k extends keyof PerformanceDataFlightPlanSyncEvents<P>>(
    topic: k,
    data: PerformanceDataFlightPlanSyncEvents<P>[k],
  ): void {
    this.ignoreSync = true;
    this.perfSyncPub.pub(topic, data, true, false);
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
