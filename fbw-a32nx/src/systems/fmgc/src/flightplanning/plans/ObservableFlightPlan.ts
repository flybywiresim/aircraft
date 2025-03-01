import { EventBus, Subject, Subscribable, Subscription } from '@microsoft/msfs-sdk';

import { BaseFlightPlan } from './BaseFlightPlan';
import { FlightPlanInterface } from '../FlightPlanInterface';
import { FixInfoData } from './FixInfo';
import { FlightPlan } from './FlightPlan';
import { FlightPlanEvents } from '@fmgc/flightplanning/sync/FlightPlanEvents';

/**
 * A flight plan wrapper which exposes subcribable elements and properties.
 *
 * **Note:** Add flight plan elements here as you need them reactively in MFD/ND UI.
 */
export class ObservableFlightPlan implements Subscription {
  private readonly subscriptions: Subscription[] = [];

  private readonly flightPlanEventsSubscriber = this.bus.getSubscriber<FlightPlanEvents>();

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanInterface: FlightPlanInterface,
    private readonly index: number,
  ) {
    const plan = flightPlanInterface.get(index);

    this.initializeFromPlan(plan);
  }

  public isAlive = true;

  public isPaused = false;

  public readonly canInitialNotify = true;

  public pause(): this {
    this.isPaused = true;

    for (const sub of this.subscriptions) {
      sub.pause();
    }

    return this;
  }

  public resume(initialNotify?: boolean): this {
    this.isPaused = false;

    for (const sub of this.subscriptions) {
      sub.resume(initialNotify);
    }

    return this;
  }

  public destroy(): void {
    this.isAlive = false;

    for (const subscription of this.subscriptions) {
      subscription.destroy();
    }
  }

  private initializeFromPlan(plan: BaseFlightPlan): void {
    if (plan instanceof FlightPlan) {
      for (let i = 1; i < plan.fixInfos.length; i++) {
        const fix = plan.fixInfos[i] ?? null;

        this._fixInfos[i].set(fix);
      }
    }

    this.subscriptions.push(
      this.flightPlanEventsSubscriber.on('flightPlan.setFixInfoEntry').handle((event) => {
        if (event.planIndex !== plan.index) {
          return;
        }

        const subject = this._fixInfos[event.index];

        subject.set(event.fixInfo ?? null);
      }),
    );
  }

  private readonly _fixInfos: Record<1 | 2 | 3 | 4, Subject<FixInfoData | null>> = {
    1: this.createFixInfoSubject(),
    2: this.createFixInfoSubject(),
    3: this.createFixInfoSubject(),
    4: this.createFixInfoSubject(),
  } as const;
  public readonly fixInfos: Record<1 | 2 | 3 | 4, Subscribable<FixInfoData | null>> = this._fixInfos;

  private createFixInfoSubject(): Subject<FixInfoData | null> {
    const equalityFunc = (a: FixInfoData | null, b: FixInfoData | null): boolean => {
      if ((a === null) !== (b === null)) {
        return false;
      } else if (a === null && b === null) {
        return true;
      }

      if (a.fix.databaseId !== b.fix.databaseId) {
        return false;
      }

      if (a.radials?.length !== b.radials?.length) {
        return false;
      }

      for (let i = 0; i < (a.radials?.length ?? 0); i++) {
        const aRadial = a?.radials[i];
        const bRadial = b?.radials[i];

        if (aRadial?.magneticBearing !== bRadial?.magneticBearing) {
          return false;
        }
      }

      if (a.radii?.length !== b.radii?.length) {
        return false;
      }

      for (let i = 0; i < (a.radii?.length ?? 0); i++) {
        const aRadius = a?.radii[i];
        const bRadius = b?.radii[i];

        if (aRadius?.radius !== bRadius?.radius) {
          return false;
        }
      }

      return true;
    };

    return Subject.create<FixInfoData | null>(null, equalityFunc);
  }
}
