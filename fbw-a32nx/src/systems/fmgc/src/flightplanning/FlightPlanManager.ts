// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { EventBus, Publisher, SubEvent, Subject, Subscription } from '@microsoft/msfs-sdk';
import {
  FlightPlanBatchChangeEvent,
  FlightPlanEditSyncEvent,
  FlightPlanEvents,
  FlightPlanSyncResponsePacket,
  PerformanceDataFlightPlanSyncEvents,
  SyncFlightPlanEvents,
} from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { FlightPlanContext, SerializedFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { CopyOptions } from '@fmgc/flightplanning/plans/CloningOptions';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanUtils } from './FlightPlanUtils';
import { FlightPlanBatch, FlightPlanBatchUtils } from '@fmgc/flightplanning/plans/FlightPlanBatch';

export enum FlightPlanIndex {
  Active,
  Temporary,
  Uplink,
  FirstSecondary,
}

export class FlightPlanManager<P extends FlightPlanPerformanceData> {
  private plans: FlightPlan<P>[] = [];

  private subs: Subscription[] = [];

  private _initialized = Subject.create(false);

  /**
   * Public version of {@link _initialized}
   */
  public initialized = new SubEvent();

  private ignoreSync = false;

  private processingSyncEvents = false;

  private readonly syncEventQueue: [
    keyof SyncFlightPlanEvents,
    FlightPlanEditSyncEvent | FlightPlanBatchChangeEvent,
  ][] = [];

  public destroy() {
    this.subs.forEach((sub) => sub.destroy());
  }

  constructor(
    private readonly context: FlightPlanContext,
    private readonly bus: EventBus,
    private readonly performanceDataInit: P,
    private readonly syncClientID: number,
    private readonly master: boolean,
  ) {
    const sub = bus.getSubscriber<FlightPlanEvents>();

    // FIXME once we properly use flight plan sync across different FMC/FMS instances, remove this condition.
    // At the moment, it prohibits non-master instances to react to sync messages to improve performance.
    if (this.master) {
      this.subs.push(
        sub.on('flightPlanManager.syncRequest').handle(() => {
          // TODO clarify, I guess only one instance should reply to this
          if (!this.ignoreSync && this.master) {
            const plansRecord: Record<number, SerializedFlightPlan> = {};

            for (const plan of this.plans) {
              if (plan) {
                plansRecord[plan.index] = plan.serialize();
              }
            }

            const response: FlightPlanSyncResponsePacket = { syncClientID: this.syncClientID, plans: plansRecord };

            this.sendEvent('flightPlanManager.syncResponse', response);
          }
        }),
      );

      // TODO handle this in the event queue
      this.subs.push(
        sub.on('flightPlanManager.syncResponse').handle(async (event) => {
          if (!this.ignoreSync && this.syncClientID === event.syncClientID) {
            for (const [index, serialisedPlan] of Object.entries(event.plans)) {
              const intIndex = parseInt(index);

              const newPlan = await FlightPlan.fromSerializedFlightPlan(
                this.context,
                intIndex,
                serialisedPlan,
                this.bus,
                this.performanceDataInit.clone(),
              );

              this.set(intIndex, newPlan);
            }

            this._initialized.set(true);
          }
        }),
      );

      this.subs.push(
        sub.on('flightPlanManager.create').handle((event) => {
          if (!this.ignoreSync && this.syncClientID === event.syncClientID) {
            this.create(event.planIndex, false);
          }
        }),
      );

      this.subs.push(
        sub.on('flightPlanManager.delete').handle((event) => {
          if (!this.ignoreSync && this.syncClientID === event.syncClientID) {
            this.delete(event.planIndex, false);
          }
        }),
      );

      this.subs.push(
        sub.on('flightPlanManager.deleteAll').handle(() => {
          if (!this.ignoreSync) {
            this.deleteAll(false);
          }
        }),
      );

      this.subs.push(
        sub.on('flightPlanManager.copy').handle((event) => {
          if (!this.ignoreSync && this.syncClientID !== event.syncClientID) {
            this.copy(event.planIndex, event.targetPlanIndex, event.options, false);
          }
        }),
      );

      this.subs.push(
        sub.on('flightPlanManager.swap').handle((event) => {
          if (!this.ignoreSync && this.syncClientID !== event.syncClientID) {
            this.swap(event.planIndex, event.targetPlanIndex, false);
          }
        }),
      );

      this.subs.push(
        this.bus.onAll((key, event: FlightPlanEditSyncEvent | FlightPlanBatchChangeEvent) => {
          if (!this.ignoreSync && key.startsWith('SYNC_flightPlan') && typeof event === 'object') {
            this.syncEventQueue.push([key as keyof SyncFlightPlanEvents, event]);

            if (!this.processingSyncEvents) {
              this.processSyncEventQueue();
            }
          }
        }),
      );

      this.subs.push(this._initialized.sub(() => this.initialized.notify(undefined, undefined)));
    }

    if (!this.master) {
      setTimeout(() => this.sendEvent('flightPlanManager.syncRequest', undefined), 5_000);
    } else {
      this._initialized.set(true);
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

    this.plans[index] = FlightPlan.empty(this.context, index, this.bus, this.performanceDataInit.clone());

    if (notify) {
      this.sendEvent('flightPlanManager.create', { syncClientID: this.syncClientID, planIndex: index });
    }
  }

  delete(index: number, notify = true) {
    this.assertFlightPlanExists(index);

    this.plans[index].destroy();
    this.plans[index] = undefined;

    if (notify) {
      this.sendEvent('flightPlanManager.delete', { syncClientID: this.syncClientID, planIndex: index });
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

  reset(notify = true) {
    const activePlan = this.has(FlightPlanIndex.Active) ? this.get(FlightPlanIndex.Active) : undefined;
    const activeToLeg = activePlan?.activeLeg;

    for (const plan of this.plans) {
      if (!plan) {
        continue;
      }

      // We only want to delete secondary plans if their active leg matches the active plan's active leg.
      const shouldDeletePlan =
        plan.index < FlightPlanIndex.FirstSecondary ||
        activePlan === undefined ||
        (activeToLeg === undefined && plan.activeLeg === undefined) ||
        (activeToLeg !== undefined &&
          plan.activeLeg !== undefined &&
          FlightPlanUtils.areFlightPlanElementsSame(activeToLeg, plan.activeLeg) &&
          activePlan.activeLegIndex === plan.activeLegIndex);

      if (shouldDeletePlan) {
        this.delete(plan.index, notify);
      }
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
      this.sendEvent('flightPlanManager.copy', {
        syncClientID: this.syncClientID,
        planIndex: from,
        targetPlanIndex: to,
        options,
      });
    }
  }

  swap(a: number, b: number, notify = true) {
    this.assertFlightPlanExists(a);
    this.assertFlightPlanExists(b);

    // Clone the plans, so we can give them a new index
    const planA = this.get(a).clone(b);
    const planB = this.get(b).clone(a);

    this.delete(a, false);
    this.delete(b, false);

    this.set(a, planB);
    this.set(b, planA);

    if (notify) {
      this.sendEvent('flightPlanManager.swap', { syncClientID: this.syncClientID, planIndex: a, targetPlanIndex: b });
    }
  }

  public async openBatch(name: string): Promise<FlightPlanBatch> {
    const newBatch = FlightPlanBatchUtils.createBatch(name);

    this.context.batchStack.push(newBatch);
    this.sendEvent('flightPlanService.batchChange', {
      syncClientID: this.syncClientID,
      batchStack: this.context.batchStack,
      type: 'open',
      batch: newBatch,
    });

    return newBatch;
  }

  public async closeBatch(uuid: string): Promise<FlightPlanBatch> {
    if (this.context.batchStack.length === 0) {
      throw new Error('[BaseFlightPlan](closeBatch) No batches to close');
    }

    const innermostBatch = this.context.batchStack[this.context.batchStack.length - 1];

    if (innermostBatch.id !== uuid) {
      const targetBatch = this.context.batchStack.find((it) => it.id === uuid);

      if (targetBatch) {
        throw new Error(
          `[FlightPlanService](closeBatch) Only the innermost batch can be closed, which is: (id=${innermostBatch.id.substring(0, 8)}..., name="${innermostBatch.name}").
Tried to close (id=${targetBatch.id.substring(0, 8)}..., name="${targetBatch.name}").
Make sure any calls to an RPC client are \`await\`ed`,
        );
      } else {
        throw new Error(
          `[FlightPlanService](closeBatch) Only the innermost batch can be closed, which is: (id=${innermostBatch.id.substring(0, 8)}..., name="${innermostBatch.name}"). A batch with id '${uuid.substring(0, 8)}...' was not found.`,
        );
      }
    }

    this.context.batchStack.pop();
    this.sendEvent('flightPlanService.batchChange', {
      syncClientID: this.syncClientID,
      batchStack: this.context.batchStack,
      type: 'close',
      batch: innermostBatch,
    });

    return innermostBatch;
  }

  private sendEvent<k extends keyof FlightPlanEvents>(topic: k, data: FlightPlanEvents[k]): void {
    this.ignoreSync = true;
    this.syncPub.pub(topic, data, true, false);
    this.bus
      .getPublisher<SyncFlightPlanEvents>()
      .pub(`SYNC_${topic}`, data as SyncFlightPlanEvents[`SYNC_${typeof topic}`], true, false);
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

  private async processSyncEventQueue(): Promise<void> {
    this.processingSyncEvents = true;

    // Process all events in the queue
    while (this.syncEventQueue.length !== 0) {
      const [event, data] = this.syncEventQueue.shift();

      // Dispatch the sync event to a specific plan, if necessary
      if (event.startsWith('SYNC_flightPlan.') && 'planIndex' in data) {
        if (this.has(data.planIndex)) {
          const plan = data.forAlternate ? this.get(data.planIndex).alternateFlightPlan : this.get(data.planIndex);

          await plan.processSyncEvent(event as keyof SyncFlightPlanEvents & `SYNC_flightPlan.${string}`, data);
        }
      }

      const flightPlanEventsPub = this.bus.getPublisher<FlightPlanEvents>();

      if (data.syncClientID !== this.syncClientID) {
        // Send the event on the event bus locally, so things can react to it
        flightPlanEventsPub.pub(
          event.replace('SYNC_', '') as keyof FlightPlanEvents,
          {
            ...data,
            syncClientID: this.syncClientID,
          },
          false,
          false,
        );
      }
    }

    this.processingSyncEvents = false;
  }
}
