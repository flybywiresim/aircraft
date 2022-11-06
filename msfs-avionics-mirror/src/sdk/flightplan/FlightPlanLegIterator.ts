import { FlightPlan } from './FlightPlan';
import { FlightPlanSegment, LegDefinition } from './FlightPlanning';

/**
 * A cursor for storing data while iterating
 * over the current flight plan.
 */
export interface IteratorCursor {
  /** The current plan segment. */
  segment: FlightPlanSegment;

  /** The current leg index within the segment. */
  legIndex: number;

  /** The current leg definition. */
  legDefinition: LegDefinition;

  /** The current iterator index. */
  index: number;
}

/**
 * A Utility Class that supports iterating through a flight plan either forward or reverse.
 */
export class FlightPlanLegIterator {

  private readonly cursor = {
    segment: undefined as FlightPlanSegment | undefined,
    legIndex: -1,
    legDefinition: undefined as LegDefinition | undefined,
    index: 0
  };

  private cursorIsBusy = false;

  /**
   * Method that checks whether the FlightPlanLegIterator is busy.
   * @returns Whether the cursor is busy.
   */
  public isBusy(): boolean {
    return this.cursorIsBusy;
  }

  /**
   * Iterates through the active flight plan in reverse order.
   * @param lateralPlan The lateral flight plan to iterate through.
   * @param each The function to call for each flight plan leg.
   * @throws an Error if the cursor is busy.
   */
  public iterateReverse(lateralPlan: FlightPlan, each: (data: IteratorCursor) => void): void {
    if (this.cursorIsBusy) {
      throw new Error('FlightPlanLegIterator - iterateReverse: The iterator cursor is busy');
    }

    this.cursorIsBusy = true;

    let segmentIndex = lateralPlan.segmentCount - 1;
    let index = 0;

    try {
      while (segmentIndex >= 0) {
        const segment = lateralPlan.getSegment(segmentIndex);
        let legIndex = segment.legs.length - 1;

        while (legIndex >= 0) {
          this.cursor.legDefinition = segment.legs[legIndex];
          this.cursor.legIndex = legIndex;
          this.cursor.segment = segment;
          this.cursor.index = index;

          each(this.cursor as IteratorCursor);
          legIndex--;
          index++;
        }
        segmentIndex--;
      }
    } catch (error) {
      console.error(`FlightPlanLegIterator - iterateReverse: error in while loop: ${error}`);
      if (error instanceof Error) {
        console.error(error.stack);
      }
    }

    this.cursorIsBusy = false;
  }

  /**
   * Iterates through the active flight plan in forward order.
   * @param lateralPlan The lateral flight plan to iterate through.
   * @param each The function to call for each flight plan leg.
   * @throws an Error if the cursor is busy.
   */
  public iterateForward(lateralPlan: FlightPlan, each: (data: IteratorCursor) => void): void {
    if (this.cursorIsBusy) {
      throw new Error('FlightPlanLegIterator - iterateForward: The iterator cursor is busy');
    }

    this.cursorIsBusy = true;

    let segmentIndex = 0;
    let index = 0;

    try {
      while (segmentIndex < lateralPlan.segmentCount) {
        const segment = lateralPlan.getSegment(segmentIndex);
        let legIndex = 0;

        while (legIndex < segment.legs.length) {
          this.cursor.legDefinition = segment.legs[legIndex];
          this.cursor.legIndex = legIndex;
          this.cursor.segment = segment;
          this.cursor.index = index;

          each(this.cursor as IteratorCursor);
          legIndex++;
          index++;
        }
        segmentIndex++;
      }
    } catch (error) {
      console.error(`FlightPlanLegIterator - iterateForward: error in while loop: ${error}`);
      if (error instanceof Error) {
        console.error(error.stack);
      }
    }

    this.cursorIsBusy = false;
  }
}
