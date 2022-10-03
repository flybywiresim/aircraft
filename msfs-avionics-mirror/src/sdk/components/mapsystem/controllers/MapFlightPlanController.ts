import {
  FlightPlanActiveLegEvent, FlightPlanCalculatedEvent, FlightPlanCopiedEvent, FlightPlanIndicationEvent, FlightPlanner, FlightPlannerEvents
} from '../../../flightplan/FlightPlanner';
import { Subscription } from '../../../sub';
import { MapSystemController } from '../MapSystemController';
import { MapSystemKeys } from '../MapSystemKeys';
import { MapFlightPlanModule } from '../modules/MapFlightPlanModule';

/**
 * Modules required for MapFlightPlanController.
 */
export interface MapFlightPlanControllerModules {
  /** Flight plan module. */
  [MapSystemKeys.FlightPlan]: MapFlightPlanModule;
}

/**
 * Context values required for MapFlightPlanController.
 */
export interface MapFlightPlanControllerContext {
  /** The flight planner. */
  [MapSystemKeys.FlightPlanner]: FlightPlanner;
}

/** An event created when a flight plan changes. */
type PlanChangeEvent = {
  /** The index of the plan that changed. */
  planIndex: number;
}

/**
 * Controls the map system's flight plan module.
 */
export class MapFlightPlanController extends MapSystemController<MapFlightPlanControllerModules, any, any, MapFlightPlanControllerContext> {
  private readonly flightPlanModule = this.context.model.getModule(MapSystemKeys.FlightPlan);

  private planCopiedHandler = (evt: FlightPlanCopiedEvent): void => {
    this.flightPlanModule.getPlanSubjects(evt.targetPlanIndex).flightPlan.set(this.context[MapSystemKeys.FlightPlanner].getFlightPlan(evt.targetPlanIndex));
    this.flightPlanModule.getPlanSubjects(evt.targetPlanIndex).planChanged.notify(this);
  };

  private planCreatedHandler = (evt: FlightPlanIndicationEvent): void => {
    this.flightPlanModule.getPlanSubjects(evt.planIndex).flightPlan.set(this.context[MapSystemKeys.FlightPlanner].getFlightPlan(evt.planIndex));
  };

  private planDeletedHandler = (evt: FlightPlanIndicationEvent): void => {
    this.flightPlanModule.getPlanSubjects(evt.planIndex).flightPlan.set(undefined);
  };

  private planChangeHandler = (evt: PlanChangeEvent): void => {
    this.flightPlanModule.getPlanSubjects(evt.planIndex).planChanged.notify(this);
  };

  private planCalculatedHandler = (evt: FlightPlanCalculatedEvent): void => {
    this.flightPlanModule.getPlanSubjects(evt.planIndex).planCalculated.notify(this);
  };

  private activeLegChangedHandler = (evt: FlightPlanActiveLegEvent): void => {
    this.flightPlanModule.getPlanSubjects(evt.planIndex).activeLeg.set(evt.legIndex);
  };

  private fplCopiedSub?: Subscription;
  private fplCreatedSub?: Subscription;
  private fplDeletedSub?: Subscription;
  private fplDirectToDataChangedSub?: Subscription;
  private fplLoadedSub?: Subscription;
  private fplOriginDestChangedSub?: Subscription;
  private fplProcDetailsChangedSub?: Subscription;
  private fplSegmentChangeSub?: Subscription;
  private fplUserDataDeleteSub?: Subscription;
  private fplUserDataSetSub?: Subscription;
  private fplActiveLegChangeSub?: Subscription;
  private fplCalculatedSub?: Subscription;

  /** @inheritdoc */
  public onAfterMapRender(): void {
    const sub = this.context.bus.getSubscriber<FlightPlannerEvents>();

    this.fplCopiedSub = sub.on('fplCopied').handle(this.planCopiedHandler);
    this.fplCreatedSub = sub.on('fplCreated').handle(this.planCreatedHandler);
    this.fplDeletedSub = sub.on('fplDeleted').handle(this.planDeletedHandler);
    this.fplDirectToDataChangedSub = sub.on('fplDirectToDataChanged').handle(this.planChangeHandler);
    this.fplLoadedSub = sub.on('fplLoaded').handle(this.planCreatedHandler);
    this.fplOriginDestChangedSub = sub.on('fplOriginDestChanged').handle(this.planChangeHandler);
    this.fplProcDetailsChangedSub = sub.on('fplProcDetailsChanged').handle(this.planChangeHandler);
    this.fplSegmentChangeSub = sub.on('fplSegmentChange').handle(this.planChangeHandler);
    this.fplUserDataDeleteSub = sub.on('fplUserDataDelete').handle(this.planChangeHandler);
    this.fplUserDataSetSub = sub.on('fplUserDataSet').handle(this.planChangeHandler);
    this.fplActiveLegChangeSub = sub.on('fplActiveLegChange').handle(this.activeLegChangedHandler);
    this.fplCalculatedSub = sub.on('fplCalculated').handle(this.planCalculatedHandler);
  }

  /** @inheritdoc */
  public onMapDestroyed(): void {
    this.destroy();
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.fplCopiedSub?.destroy();
    this.fplCreatedSub?.destroy();
    this.fplDeletedSub?.destroy();
    this.fplDirectToDataChangedSub?.destroy();
    this.fplLoadedSub?.destroy();
    this.fplOriginDestChangedSub?.destroy();
    this.fplProcDetailsChangedSub?.destroy();
    this.fplSegmentChangeSub?.destroy();
    this.fplUserDataDeleteSub?.destroy();
    this.fplUserDataSetSub?.destroy();
    this.fplActiveLegChangeSub?.destroy();
    this.fplCalculatedSub?.destroy();
  }
}