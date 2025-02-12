import { EventBus, Subject, Subscribable, Subscription } from '@microsoft/msfs-sdk';
import { FlightPlanEvents } from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class ObservableFlightPlanManager {
  private readonly subscriptions: Subscription[] = [];

  private readonly flightPlanEventsSubscriber = this.bus.getSubscriber<FlightPlanEvents>();

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanInterface: FlightPlanInterface,
  ) {
    this.initialize();
  }

  private initialize(): void {
    this._temporaryPlanExists.set(this.flightPlanInterface.hasTemporary);

    this.subscriptions.push(
      this.flightPlanEventsSubscriber.on('flightPlanManager.create').handle((event) => {
        if (event.planIndex === FlightPlanIndex.Temporary) {
          this._temporaryPlanExists.set(true);
        }
      }),
    );
  }

  private readonly _temporaryPlanExists = Subject.create(false);
  public readonly temporaryPlanExists: Subscribable<boolean> = this._temporaryPlanExists;
}
