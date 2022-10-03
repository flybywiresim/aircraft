import { FlightPlan } from '../../../flightplan';
import { SubEvent } from '../../../sub/SubEvent';
import { Subject } from '../../../sub/Subject';

/**
 * A map data module that handles the display of flight plan data.
 */
export class MapFlightPlanModule {

  private readonly plans: PlanSubjects[] = [];

  /**
   * Gets the flight plan subjects for a specified flight plan.
   * @param index The index of the flight plan.
   * @returns The subject for the specified plan index.
   */
  public getPlanSubjects(index: number): PlanSubjects {
    let planSubject = this.plans[index];
    if (planSubject === undefined) {
      planSubject = new PlanSubjects();
      this.plans[index] = planSubject;
    }

    return planSubject;
  }
}

/**
 * A collection of subjects for consuming flight plan data in the flight plan module.
 */
export class PlanSubjects {
  /** The current flight plan to display, if any. */
  public flightPlan = Subject.create<FlightPlan | undefined>(undefined);

  /** An event that fires when the plan is changed. */
  public planChanged = new SubEvent<any, void>();

  /** An event that fired when the flight path of the plan is recalculated. */
  public planCalculated = new SubEvent<any, void>();

  /** The active leg index currently being navigated to. */
  public activeLeg = Subject.create(0);
}