import { EventBus, Subject, Subscribable, Subscription } from '@microsoft/msfs-sdk';
import { FlightPlanEvents } from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlan } from './plans/FlightPlan';
import { FlightPlanPerformanceData } from './plans/performance/FlightPlanPerformanceData';

export class ObservableFlightPlanManager implements Subscription {
  private readonly subscriptions: Subscription[] = [];

  private readonly flightPlanEventsSubscriber = this.bus.getSubscriber<FlightPlanEvents>();

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanInterface: FlightPlanInterface,
  ) {
    this.initialize();
  }

  public isAlive = true;

  public isPaused = false;

  public readonly canInitialNotify = true;

  private initialize(): void {
    this._temporaryPlanExists.set(this.flightPlanInterface.hasTemporary);

    this.subscriptions.push(
      this.flightPlanEventsSubscriber.on('flightPlanManager.create').handle((event) => {
        if (event.planIndex === FlightPlanIndex.Active) {
          this._activePlan.set(
            this.flightPlanInterface.hasActive ? this.flightPlanInterface.get(FlightPlanIndex.Active) : null,
          );
        } else if (event.planIndex === FlightPlanIndex.Temporary) {
          this._temporaryPlanExists.set(true);
        }
      }),
      this.flightPlanEventsSubscriber.on('flightPlanManager.copy').handle((event) => {
        if (event.targetPlanIndex === FlightPlanIndex.Active) {
          this._activePlan.set(
            this.flightPlanInterface.hasActive ? this.flightPlanInterface.get(FlightPlanIndex.Active) : null,
          );
        } else if (event.targetPlanIndex === FlightPlanIndex.Temporary) {
          this._temporaryPlanExists.set(true);
        }
      }),
      this.flightPlanEventsSubscriber.on('flightPlanManager.swap').handle((event) => {
        if (event.targetPlanIndex === FlightPlanIndex.Active) {
          this._activePlan.set(
            this.flightPlanInterface.hasActive ? this.flightPlanInterface.get(FlightPlanIndex.Active) : null,
          );
        }
      }),
      this.flightPlanEventsSubscriber.on('flightPlanManager.delete').handle((event) => {
        if (event.planIndex === FlightPlanIndex.Active) {
          this._activePlan.set(
            this.flightPlanInterface.hasActive ? this.flightPlanInterface.get(FlightPlanIndex.Active) : null,
          );
        } else if (event.planIndex === FlightPlanIndex.Temporary) {
          this._temporaryPlanExists.set(false);
        }
      }),
      this.flightPlanEventsSubscriber.on('flightPlanManager.deleteAll').handle(() => {
        this._activePlan.set(
          this.flightPlanInterface.hasActive ? this.flightPlanInterface.get(FlightPlanIndex.Active) : null,
        );
        this._temporaryPlanExists.set(false);
      }),
    );
  }

  private readonly _activePlan = Subject.create<FlightPlan<FlightPlanPerformanceData> | null>(null);
  /**
   * A reference to the active flight plan if it exists, or null if it does not. This can be used to be notified of when
   * subscriptions to e.g performance data have to be re-connected to a *new* active flight plan because the old ones
   * have been destroyed.
   */
  public readonly activePlan: Subscribable<FlightPlan<FlightPlanPerformanceData> | null> = this._activePlan;

  private readonly _temporaryPlanExists = Subject.create(false);
  public readonly temporaryPlanExists: Subscribable<boolean> = this._temporaryPlanExists;

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

  destroy(): void {
    this.isAlive = false;

    for (const sub of this.subscriptions) {
      sub.destroy();
    }
  }
}
