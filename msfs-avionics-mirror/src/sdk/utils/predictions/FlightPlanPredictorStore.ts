import { LNavDataSimVarEvents } from '../../autopilot/data';
import { ConsumerSubject, EventBus } from '../../data';
import { FlightPlanner, FlightPlannerEvents, LegDefinition } from '../../flightplan';
import { ClockEvents, EngineEvents, GNSSEvents } from '../../instruments';
import { Subject, Subscribable } from '../../sub';

/**
 * Contains data necessary for predicting flight plan legs
 */
export class FlightPlanPredictorStore {
  private readonly activeLegSubject = Subject.create<LegDefinition | null>(null);

  public readonly ppos = ConsumerSubject.create(null, new LatLongAlt());

  public readonly groundSpeed = ConsumerSubject.create(null, 150);

  /**
   * Total fuel quantity in gallons
   */
  public readonly fuelTotalQuantity = ConsumerSubject.create(null, 0);

  /**
   * Total fuel quantity in gallons per hour
   */
  public readonly fuelFlow = ConsumerSubject.create(null, 0);

  /**
   * Fuel weight in pounds per gallons
   */
  public readonly fuelWeight = ConsumerSubject.create(null, 0);

  public readonly lnavDtg = ConsumerSubject.create(null, 0);

  public readonly unixSimTime = ConsumerSubject.create(null, 0);

  /**
   * Ctor
   *
   * @param bus           the event bus
   * @param flightPlanner a flight planner
   * @param planIndexSub  a subscribable regarding the index of the flight plan we want to predict for
   */
  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanner: FlightPlanner,
    private readonly planIndexSub: Subscribable<number>,
  ) {
    const sub = this.bus.getSubscriber<GNSSEvents & EngineEvents & LNavDataSimVarEvents & FlightPlannerEvents & ClockEvents>();

    this.ppos.setConsumer(sub.on('gps-position').atFrequency(1));
    this.groundSpeed.setConsumer(sub.on('ground_speed'));
    this.fuelFlow.setConsumer(sub.on('fuel_flow_total'));
    this.fuelTotalQuantity.setConsumer(sub.on('fuel_total'));
    this.fuelWeight.setConsumer(sub.on('fuel_weight_per_gallon'));
    this.lnavDtg.setConsumer(sub.on('lnavdata_waypoint_distance'));
    this.unixSimTime.setConsumer(sub.on('simTime'));

    sub.on('fplActiveLegChange').handle((data) => {
      if (data.planIndex === this.planIndexSub.get()) {
        this.handleNewActiveLeg();
      }
    });

    sub.on('fplCopied').handle((data) => {
      if (data.planIndex === this.planIndexSub.get()) {
        this.handleNewActiveLeg();
      }
    });
  }

  /**
   * Handles the active leg changing
   */
  private handleNewActiveLeg(): void {
    const plan = this.flightPlanner.getFlightPlan(this.planIndexSub.get());

    const activeLegIndex = plan.activeLateralLeg;
    const activeLeg = plan.tryGetLeg(activeLegIndex);

    this.activeLegSubject.set(activeLeg);
  }

}