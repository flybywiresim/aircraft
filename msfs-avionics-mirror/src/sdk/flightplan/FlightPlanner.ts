import { SubEvent } from '..';
import { EventBus, Publisher } from '../data';
import { FlightPathCalculator } from './FlightPathCalculator';
import { ActiveLegType, DirectToData, FlightPlan, OriginDestChangeType, PlanChangeType, PlanEvents } from './FlightPlan';
import { FlightPlanSegment, LegDefinition, ProcedureDetails } from './FlightPlanning';

/**
 * Events published by the FlightPlanner class.
 */
export interface FlightPlannerEvents {
  /** A flight plan has been modified from a secondary source */
  fplLegChange: FlightPlanLegEvent;

  /** A flight plan has been modified from a secondary source */
  fplSegmentChange: FlightPlanSegmentEvent;

  /** A flight plan has changed an active leg. */
  fplActiveLegChange: FlightPlanActiveLegEvent;

  /** A flight plan has calculated flight path vectors. */
  fplCalculated: FlightPlanCalculatedEvent;

  /** A flight plan has update origin/dest information. */
  fplOriginDestChanged: FlightPlanOriginDestEvent;

  /** A flight plan has updated procedure details. */
  fplProcDetailsChanged: FlightPlanProcedureDetailsEvent;

  /** A full flight plan has been loaded. */
  fplLoaded: FlightPlanIndicationEvent;

  /** A new flight plan has been created. */
  fplCreated: FlightPlanIndicationEvent;

  /** A flight plan has been deleted. */
  fplDeleted: FlightPlanIndicationEvent;

  /** The active flight plan index has changed in the Flight Planner. */
  fplIndexChanged: FlightPlanIndicationEvent;

  /** The flight plan has been copied. */
  fplCopied: FlightPlanCopiedEvent;

  /** User data has been set in the flight plan. */
  fplUserDataSet: FlightPlanUserDataEvent;

  /** User data has been deleted in the flight plan. */
  fplUserDataDelete: FlightPlanUserDataEvent;

  /** Direct to data has been changed in the flight plan. */
  fplDirectToDataChanged: FlightPlanDirectToDataEvent;
}

/**
 * An event fired when the flight plan is recalculated.
 */
export interface FlightPlanCalculatedEvent {
  /** The index of the flight plan. */
  readonly planIndex: number;

  /** The index from which the calculations were generated. */
  readonly index?: number;
}

/**
 * An event fired when there are leg related changes.
 */
export interface FlightPlanLegEvent {
  /** The type of the leg change. */
  readonly type: PlanChangeType;

  /** The index of the flight plan. */
  readonly planIndex: number;

  /** The index of the */
  readonly segmentIndex: number;

  /** The index of the changed leg in the segment. */
  readonly legIndex: number;

  /** The leg that was added or removed. */
  readonly leg?: LegDefinition;
}

/**
 * An event fired when an active leg changes.
 */
export interface FlightPlanActiveLegEvent {
  /** The index of the flight plan. */
  readonly planIndex: number;

  /** The index of the changed leg in the segment. */
  readonly index: number;

  /** The index of the segment in which the active leg is. */
  readonly segmentIndex: number;

  /** The index of the leg within the segment. */
  readonly legIndex: number;

  /** The index of the segment in which the previously active leg is. */
  readonly previousSegmentIndex: number;

  /** The index of the previously active leg within the previously active segment. */
  readonly previousLegIndex: number;

  /** The type of active leg that changed. */
  readonly type: ActiveLegType;
}

/**
 * An event fired when there are segment related changes.
 */
export interface FlightPlanSegmentEvent {
  /** The type of the leg change. */
  readonly type: PlanChangeType;

  /** The index of the flight plan. */
  readonly planIndex: number;

  /** The current leg selected. */
  readonly segmentIndex: number;

  /** The leg that was added or removed. */
  readonly segment?: FlightPlanSegment;
}

/**
 * An event generated when the origin and/or destination information
 * is updated.
 */
export interface FlightPlanOriginDestEvent {
  /** The type of change. */
  readonly type: OriginDestChangeType;

  /** The index of the flight plan. */
  readonly planIndex: number;

  /** The airport that was changed. */
  readonly airport?: string;
}

/**
 * An event generated when the flight plan procedure details changs.
 */
export interface FlightPlanProcedureDetailsEvent {
  /** THe index of the flight plan. */
  readonly planIndex: number;

  /** The procedure details that changed. */
  readonly details: ProcedureDetails;
}

/**
 * An event generated when an instrument requests a full set
 * of plans from the bus.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FlightPlanRequestEvent {
}

/**
 * An event generated when an instrument responds to a full
 * flight plan set request.
 */
export interface FlightPlanResponseEvent {
  /** The plans contained by the flight planner. */
  readonly flightPlans: FlightPlan[];

  /** The index of the active plan. */
  readonly planIndex: number;
}

/**
 * An event generated when a full plan has been loaded, created, or became active.
 */
export interface FlightPlanIndicationEvent {
  /** The index of the flight plan. */
  readonly planIndex: number;
}

/**
 * An event generated when the flight plan procedure details changs.
 */
export interface FlightPlanCopiedEvent {
  /** The index of the flight plan. */
  readonly planIndex: number;

  /** The index that the flight plan was copied to. */
  readonly targetPlanIndex: number;
}

/**
 * An event generated when user data is set in the flight plan.
 */
export interface FlightPlanUserDataEvent {
  /** The index of the flight plan. */
  readonly planIndex: number;

  /** The key of the user data. */
  readonly key: string;

  /** The user data. */
  readonly data: any;
}

/**
 * An event generated when direct to data is changed in the flight plan.
 */
export interface FlightPlanDirectToDataEvent {
  /** The index of the flight plan. */
  readonly planIndex: number;

  /** The direct to data. */
  readonly directToData: DirectToData;
}

/**
 * Flight planner cross-instrument sync events.
 */
type FlightPlannerSyncEvents = {
  [P in keyof FlightPlannerEvents as `fplsync_${P}`]: FlightPlannerEvents[P]
} & {
  /** A full set of flight plans has been requested. */
  fplsync_fplRequest: FlightPlanRequestEvent;

  /** A full set of flight plans has been responded to. */
  fplsync_fplResponse: FlightPlanResponseEvent;
}

/**
 * Manages the active flightplans of the navigational systems.
 */
export class FlightPlanner {

  private static INSTANCE?: FlightPlanner;

  /** The flight plans managed by this flight planner. */
  private readonly flightPlans: (FlightPlan | undefined)[] = [];

  /** A publisher for publishing flight planner update events. */
  private readonly publisher: Publisher<FlightPlannerEvents & FlightPlannerSyncEvents>;

  private ignoreSync = false;

  /** The active flight plan index. */
  private _activePlanIndex = 0;

  public flightPlanSynced = new SubEvent<boolean>();

  /**
   * Set a new active plan index.
   * @param planIndex The new active plan index.
   */
  public set activePlanIndex(planIndex: number) {
    this._activePlanIndex = planIndex;
  }

  /**
   * Get the active plan index.
   * @returns The active plan index number.
   */
  public get activePlanIndex(): number {
    return this._activePlanIndex;
  }

  /**
   * Creates an instance of the FlightPlanner.
   * @param bus The event bus instance to notify changes on.
   * @param calculator The flight path calculator to use with this planner.
   */
  private constructor(private readonly bus: EventBus, private readonly calculator: FlightPathCalculator) {
    this.publisher = bus.getPublisher<FlightPlannerEvents>();
    const subscriber = bus.getSubscriber<FlightPlannerSyncEvents>();

    subscriber.on('fplsync_fplRequest').handle(() => !this.ignoreSync && this.onFlightPlanRequest());
    subscriber.on('fplsync_fplResponse').handle(data => !this.ignoreSync && this.onFlightPlanResponse(data));
    subscriber.on('fplsync_fplCreated').handle(data => !this.ignoreSync && this.onPlanCreated(data));
    subscriber.on('fplsync_fplDeleted').handle(data => !this.ignoreSync && this.onPlanDeleted(data));
    subscriber.on('fplsync_fplActiveLegChange').handle(data => !this.ignoreSync && this.onActiveLegChanged(data));
    subscriber.on('fplsync_fplLegChange').handle(data => !this.ignoreSync && this.onLegChanged(data));
    subscriber.on('fplsync_fplSegmentChange').handle(data => !this.ignoreSync && this.onSegmentChanged(data));
    subscriber.on('fplsync_fplCalculated').handle(data => !this.ignoreSync && this.onCalculated(data));
    subscriber.on('fplsync_fplOriginDestChanged').handle(data => !this.ignoreSync && this.onOriginDestChanged(data));
    subscriber.on('fplsync_fplProcDetailsChanged').handle(data => !this.ignoreSync && this.onProcedureDetailsChanged(data));
    subscriber.on('fplsync_fplIndexChanged').handle(data => !this.ignoreSync && this.onPlanIndexChanged(data));
    subscriber.on('fplsync_fplCopied').handle(data => !this.ignoreSync && this.onPlanCopied(data));
    subscriber.on('fplsync_fplUserDataSet').handle(data => !this.ignoreSync && this.onUserDataSet(data));
    subscriber.on('fplsync_fplUserDataDelete').handle(data => !this.ignoreSync && this.onUserDataDelete(data));
    subscriber.on('fplsync_fplDirectToDataChanged').handle(data => !this.ignoreSync && this.onDirectToDataChanged(data));
  }

  /**
   * Requests synchronization from other FlightPlanner instances.
   */
  public requestSync(): void {
    this.sendFlightPlanRequest();
  }

  /**
   * An event generated when a set of flight plans is requested.
   */
  private onFlightPlanRequest(): void {
    this.ignoreSync = true;
    this.publisher.pub('fplsync_fplResponse', {
      flightPlans: this.flightPlans.map(plan => {
        const newPlan = Object.assign({}, plan) as any;
        newPlan.calculator = undefined;

        return newPlan;
      }), planIndex: this.activePlanIndex
    }, true, false);
    this.ignoreSync = false;
  }

  /**
   * Sends a flight plan request event.
   */
  private sendFlightPlanRequest(): void {
    this.ignoreSync = true;
    this.publisher.pub('fplsync_fplRequest', {}, true, false);
    this.ignoreSync = false;
  }

  /**
   * A callback which is called in response to flight plan request response sync events.
   * @param data The event data.
   */
  private onFlightPlanResponse(data: FlightPlanResponseEvent): void {
    for (let i = 0; i < data.flightPlans.length; i++) {
      const newPlan = Object.assign(new FlightPlan(i, this.calculator), data.flightPlans[i]);
      newPlan.events = this.buildPlanEventHandlers(i);

      this.flightPlans[i] = newPlan;
      this.sendEvent('fplLoaded', { planIndex: i }, false);

      // Make sure the newly loaded plans are calculated at least once from the beginning
      newPlan.calculate(0);
    }
    this.setActivePlanIndex(data.planIndex);
    this.flightPlanSynced.notify(this, true);
  }

  /**
   * Checks whether a flight plan exists at a specified index.
   * @param planIndex The index to check.
   * @returns Whether a a flight plan exists at `planIndex`.
   */
  public hasFlightPlan(planIndex: number): boolean {
    return !!this.flightPlans[planIndex];
  }

  /**
   * Gets a flight plan from the flight planner.
   * @param planIndex The index of the flight plan.
   * @returns The requested flight plan.
   * @throws Error if a flight plan does not exist at `planIndex`.
   */
  public getFlightPlan(planIndex: number): FlightPlan {
    const plan = this.flightPlans[planIndex];
    if (!plan) {
      throw new Error(`FlightPlanner: Flight plan does not exist at index ${planIndex}`);
    }

    return plan;
  }

  /**
   * Creates a new flight plan at a specified index if one does not already exist.
   * @param planIndex The index at which to create the new flight plan.
   * @param notify Whether to send an event notification. True by default.
   * @returns The new flight plan, or the existing flight plan at `planIndex`.
   */
  public createFlightPlan(planIndex: number, notify = true): FlightPlan {
    if (this.flightPlans[planIndex]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.flightPlans[planIndex]!;
    }

    const flightPlan = new FlightPlan(planIndex, this.calculator);
    flightPlan.events = this.buildPlanEventHandlers(planIndex);

    this.flightPlans[planIndex] = flightPlan;

    notify && this.sendPlanCreated(planIndex);

    return flightPlan;
  }

  /**
   * A callback which is called in response to flight plan request response sync events.
   * @param data The event data.
   */
  private onPlanCreated(data: FlightPlanIndicationEvent): void {
    this.createFlightPlan(data.planIndex, false);
    this.sendEvent('fplCreated', data, false);
  }

  /**
   * Sends a flight plan created event.
   * @param planIndex The index of the flight plan that was created.
   */
  private sendPlanCreated(planIndex: number): void {
    const data = { planIndex };
    this.sendEvent('fplCreated', data, true);
  }

  /**
   * Deletes a flight plan from the flight planner.
   * @param planIndex The index of the flight plan to delete.
   * @param notify Whether to send an event notification. True by default.
   */
  public deleteFlightPlan(planIndex: number, notify = true): void {
    const flightPlan = this.flightPlans[planIndex];
    if (flightPlan) {
      flightPlan.events = {};
      this.flightPlans[planIndex] = undefined;

      notify && this.sendPlanDeleted(planIndex);
    }

    if (planIndex === this.flightPlans.length - 1) {
      this.flightPlans.length--;
    }
  }

  /**
   * A callback which is called in response to flight plan deleted sync events.
   * @param data The event data.
   */
  private onPlanDeleted(data: FlightPlanIndicationEvent): void {
    this.deleteFlightPlan(data.planIndex, false);
    this.sendEvent('fplDeleted', data, false);
  }

  /**
   * Sends a flight plan deleted event.
   * @param planIndex The index of the flight plan that was created.
   */
  private sendPlanDeleted(planIndex: number): void {
    const data = { planIndex };
    this.sendEvent('fplDeleted', data, true);
  }

  /**
   * Builds the plan event handlers for the flight plan.
   * @param planIndex The index of the flight plan.
   * @returns The plan event handlers.
   */
  private buildPlanEventHandlers(planIndex: number): PlanEvents {
    return {
      onLegChanged: (segmentIndex, index, type, leg): void => this.sendLegChanged(planIndex, segmentIndex, index, type, leg),
      onSegmentChanged: (segmentIndex, type, segment): void => this.sendSegmentChanged(planIndex, segmentIndex, type, segment),
      onActiveLegChanged: (index, segmentIndex, legIndex, previousSegmentIndex, previousLegIndex, type): void =>
        this.sendActiveLegChange(planIndex, index, segmentIndex, legIndex, previousSegmentIndex, previousLegIndex, type),
      onCalculated: (index): void => this.sendCalculated(planIndex, index),
      onOriginDestChanged: (type, airport): void => this.sendOriginDestChanged(planIndex, type, airport),
      onProcedureDetailsChanged: (details): void => this.sendProcedureDetailsChanged(planIndex, details),
      onUserDataSet: (key, data): void => this.sendUserDataSet(planIndex, key, data),
      onUserDataDelete: (key): void => this.sendUserDataDelete(planIndex, key),
      onDirectDataChanged: (directToData): void => this.sendDirectToData(planIndex, directToData)
    };
  }

  /**
   * Checks whether an active flight plan exists.
   * @returns Whether an active flight plan exists.
   */
  public hasActiveFlightPlan(): boolean {
    return this.hasFlightPlan(this.activePlanIndex);
  }

  /**
   * Gets the currently active flight plan from the flight planner.
   * @returns The currently active flight plan.
   * @throws Error if no active flight plan exists.
   */
  public getActiveFlightPlan(): FlightPlan {
    return this.getFlightPlan(this.activePlanIndex);
  }

  /**
   * Copies a flight plan to another flight plan slot.
   * @param sourcePlanIndex The source flight plan index.
   * @param targetPlanIndex The target flight plan index.
   * @param notify Whether or not to notify subscribers that the plan has been copied.
   */
  public copyFlightPlan(sourcePlanIndex: number, targetPlanIndex: number, notify = true): void {
    const sourcePlan = this.flightPlans[sourcePlanIndex];
    if (!sourcePlan) {
      return;
    }

    const newPlan = sourcePlan.copy(targetPlanIndex);
    newPlan.events = this.buildPlanEventHandlers(targetPlanIndex);
    this.flightPlans[targetPlanIndex] = newPlan;

    if (notify) {
      this.sendPlanCopied(sourcePlanIndex, targetPlanIndex);
    }
  }

  /**
   * A callback which is called in response to flight plan copied sync events.
   * @param data The event data.
   */
  private onPlanCopied(data: FlightPlanCopiedEvent): void {
    this.copyFlightPlan(data.planIndex, data.targetPlanIndex, false);

    this.sendEvent('fplCopied', data, false);
  }

  /**
   * Sends a leg change event.
   * @param planIndex The index of the flight plan that was the source of the copy.
   * @param targetPlanIndex The index of the copy.
   */
  private sendPlanCopied(planIndex: number, targetPlanIndex: number): void {
    const data = { planIndex, targetPlanIndex };
    this.sendEvent('fplCopied', data, true);
  }

  /**
   * A callback which is called in response to leg changed sync events.
   * @param data The event data.
   */
  private onLegChanged(data: FlightPlanLegEvent): void {
    const plan = this.getFlightPlan(data.planIndex);
    switch (data.type) {
      case PlanChangeType.Added:
        data.leg && plan.addLeg(data.segmentIndex, data.leg.leg, data.legIndex, data.leg.flags, false);
        break;
      case PlanChangeType.Removed:
        plan.removeLeg(data.segmentIndex, data.legIndex, false);
        break;
      case PlanChangeType.Changed:
        data.leg && data.leg.verticalData && plan.setLegVerticalData(data.segmentIndex, data.legIndex, data.leg.verticalData, false);
        break;
    }

    this.sendEvent('fplLegChange', data, false);
  }

  /**
   * Sends a leg change event.
   * @param planIndex The index of the flight plan.
   * @param segmentIndex The index of the segment.
   * @param index The index of the leg.
   * @param type The type of change.
   * @param leg The leg that was changed.
   */
  private sendLegChanged(planIndex: number, segmentIndex: number, index: number, type: PlanChangeType, leg?: LegDefinition): void {
    const data = {
      planIndex, segmentIndex, legIndex: index, type, leg
    };
    this.sendEvent('fplLegChange', data, true);
  }

  /**
   * A callback which is called in response to segment changed sync events.
   * @param data The event data.
   */
  private onSegmentChanged(data: FlightPlanSegmentEvent): void {
    const plan = this.flightPlans[data.planIndex];
    if (!plan) {
      return;
    }

    switch (data.type) {
      case PlanChangeType.Added:
        data.segment && plan.addSegment(data.segmentIndex, data.segment.segmentType, data.segment.airway, false);
        break;
      case PlanChangeType.Inserted:
        data.segment && plan.insertSegment(data.segmentIndex, data.segment.segmentType, data.segment.airway, false);
        break;
      case PlanChangeType.Removed:
        plan.removeSegment(data.segmentIndex, false);
        break;
      case PlanChangeType.Changed:
        data.segment && plan.setAirway(data.segmentIndex, data.segment.airway, false);
        break;
    }

    this.sendEvent('fplSegmentChange', data, false);
  }

  /**
   * Sends a segment change event.
   * @param planIndex The index of the flight plan.
   * @param index The index of the segment.
   * @param type The type of change.
   * @param segment The segment that was changed.
   */
  private sendSegmentChanged(planIndex: number, index: number, type: PlanChangeType, segment?: FlightPlanSegment): void {
    const data = {
      planIndex, segmentIndex: index, type, segment
    };
    this.sendEvent('fplSegmentChange', data, true);
  }

  /**
   * A callback which is called in response to active leg changed sync events.
   * @param data The event data.
   */
  private onActiveLegChanged(data: FlightPlanActiveLegEvent): void {
    const plan = this.flightPlans[data.planIndex];
    if (!plan) {
      return;
    }

    switch (data.type) {
      case ActiveLegType.Lateral:
        plan.setLateralLeg(data.index, false);
        break;
      case ActiveLegType.Vertical:
        plan.setVerticalLeg(data.index, false);
        break;
      case ActiveLegType.Calculating:
        plan.setCalculatingLeg(data.index, false);
        break;
    }

    this.sendEvent('fplActiveLegChange', data, false);
  }

  /**
   * Sends an active leg change event.
   * @param planIndex The index of the flight plan.
   * @param index The index of the leg.
   * @param segmentIndex The index of the plan segment.
   * @param legIndex The index of the leg within the segment.
   * @param previousSegmentIndex The index of the segment in which the previously active leg is.
   * @param previousLegIndex The index of the previously active leg within the previously active segment.
   * @param type The type of leg that was changed.
   */
  private sendActiveLegChange(
    planIndex: number, index: number, segmentIndex: number, legIndex: number,
    previousSegmentIndex: number, previousLegIndex: number, type: ActiveLegType
  ): void {
    const data = {
      segmentIndex, legIndex, planIndex,
      index, previousSegmentIndex, previousLegIndex, type
    };
    this.sendEvent('fplActiveLegChange', data, true);
  }

  /**
   * A callback which is called in response to calculation sync events.
   * @param data The event data.
   */
  private async onCalculated(data: FlightPlanCalculatedEvent): Promise<void> {
    const plan = this.flightPlans[data.planIndex];
    if (!plan) {
      return;
    }

    await plan.calculate(data.index, false);

    this.sendEvent('fplCalculated', data, false);
  }

  /**
   * Sends a calculated event.
   * @param planIndex The index of the flight plan.
   * @param index The index that the path was generated from.
   */
  private sendCalculated(planIndex: number, index?: number): void {
    const data = { planIndex, index };
    this.sendEvent('fplCalculated', data, true);
  }

  /**
   * A callback which is called in response to origin/destination changed sync events.
   * @param data The event data.
   */
  private onOriginDestChanged(data: FlightPlanOriginDestEvent): void {
    const plan = this.flightPlans[data.planIndex];
    if (!plan) {
      return;
    }

    switch (data.type) {
      case OriginDestChangeType.OriginAdded:
        data.airport && plan.setOriginAirport(data.airport, false);
        break;
      case OriginDestChangeType.OriginRemoved:
        plan.removeOriginAirport(false);
        break;
      case OriginDestChangeType.DestinationAdded:
        data.airport && plan.setDestinationAirport(data.airport, false);
        break;
      case OriginDestChangeType.DestinationRemoved:
        plan.removeDestinationAirport(false);
        break;
    }

    this.sendEvent('fplOriginDestChanged', data, false);
  }

  /**
   * Sends a origin/dest change event.
   * @param planIndex The index of the flight plan.
   * @param type The origin/destination change type.
   * @param airport The airport that was changed.
   */
  private sendOriginDestChanged(planIndex: number, type: OriginDestChangeType, airport?: string): void {
    const data = { planIndex, type, airport };
    this.sendEvent('fplOriginDestChanged', data, true);
  }

  /**
   * A callback which is called in response to procedure changed sync events.
   * @param data The event data.
   */
  private onProcedureDetailsChanged(data: FlightPlanProcedureDetailsEvent): void {
    const plan = this.flightPlans[data.planIndex];
    if (!plan) {
      return;
    }

    plan.setProcedureDetails(data.details, false);

    this.sendEvent('fplProcDetailsChanged', data, false);
  }

  /**
   * Sends a procedure details change event.
   * @param planIndex The index of the flight plan.
   * @param details The details that were changed.
   */
  private sendProcedureDetailsChanged(planIndex: number, details: ProcedureDetails): void {
    const data = { planIndex, details };
    this.sendEvent('fplProcDetailsChanged', data, true);
  }

  /**
   * A callback which is called in response to flight plan index changed sync events.
   * @param data The event data.
   */
  private onPlanIndexChanged(data: FlightPlanIndicationEvent): void {
    this.activePlanIndex = data.planIndex;

    this.sendEvent('fplIndexChanged', data, false);
  }

  /**
   * Sends an active plan index change event.
   * @param planIndex The index of the flight plan.
   */
  private sendPlanIndexChanged(planIndex: number): void {
    const data = { planIndex };
    this.sendEvent('fplIndexChanged', data, true);
  }

  /**
   * A callback which is called in response to user data set sync events.
   * @param data The event data.
   */
  private onUserDataSet(data: FlightPlanUserDataEvent): void {
    const plan = this.flightPlans[data.planIndex];
    if (!plan) {
      return;
    }

    plan.setUserData(data.key, data.data, false);

    this.sendEvent('fplUserDataSet', data, false);
  }

  /**
   * A callback which is called in response to user data delete sync events.
   * @param data The event data.
   */
  private onUserDataDelete(data: FlightPlanUserDataEvent): void {
    const plan = this.flightPlans[data.planIndex];
    if (!plan) {
      return;
    }

    plan.deleteUserData(data.key, false);

    this.sendEvent('fplUserDataDelete', data, false);
  }

  /**
   * Sends a user data set event.
   * @param planIndex The index of the flight plan.
   * @param key The key of the user data.
   * @param userData The data that was set.
   */
  private sendUserDataSet(planIndex: number, key: string, userData: any): void {
    const data = { planIndex, key, data: userData };
    this.sendEvent('fplUserDataSet', data, true);
  }

  /**
   * Sends a user data delete event.
   * @param planIndex The index of the flight plan.
   * @param key The key of the user data.
   */
  private sendUserDataDelete(planIndex: number, key: string): void {
    const data = { planIndex, key, data: undefined };
    this.sendEvent('fplUserDataDelete', data, true);
  }

  /**
   * A callback which is called in response to direct to data changed sync events.
   * @param data The event data.
   */
  private onDirectToDataChanged(data: FlightPlanDirectToDataEvent): void {
    const plan = this.flightPlans[data.planIndex];
    if (!plan) {
      return;
    }

    plan.setDirectToData(data.directToData.segmentIndex, data.directToData.segmentLegIndex, false);

    this.sendEvent('fplDirectToDataChanged', data, false);
  }

  /**
   * Sends a direct to data changed event.
   * @param planIndex The index of the flight plan.
   * @param directToData The direct to data.
   */
  private sendDirectToData(planIndex: number, directToData: DirectToData): void {
    const data = { planIndex, directToData: directToData };
    this.sendEvent('fplDirectToDataChanged', data, true);
  }

  /**
   * Method to set an active flight plan index.
   * @param planIndex The index of the flight plan to make active.
   */
  public setActivePlanIndex(planIndex: number): void {
    if (this.hasFlightPlan(planIndex)) {
      this.activePlanIndex = planIndex;
      this.sendPlanIndexChanged(planIndex);
    }
  }

  /**
   * Sends a local event and its sync counterpart.
   * @param topic The topic of the local event.
   * @param data The event data.
   * @param sync Whether to send the sync event.
   */
  private sendEvent<T extends keyof FlightPlannerEvents>(topic: T, data: (FlightPlannerEvents & FlightPlannerSyncEvents)[T], sync: boolean): void {
    if (sync) {
      this.ignoreSync = true;
      this.publisher.pub(`fplsync_${topic}`, data as any, true, false);
      this.ignoreSync = false;
    }

    this.publisher.pub(topic, data, false, false);
  }

  /**
   * Gets an instance of FlightPlanner.
   * @param bus The event bus.
   * @param calculator A flight path calculator.
   * @returns An instance of FlightPlanner.
   */
  public static getPlanner(bus: EventBus, calculator: FlightPathCalculator): FlightPlanner {
    return FlightPlanner.INSTANCE ??= new FlightPlanner(bus, calculator);
  }
}
