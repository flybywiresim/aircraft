import { UUID } from '@microsoft/msfs-sdk';

export interface FlightPlanBatch {
  /** The ID of the batch */
  id: string;

  /** The name of the batch */
  name: string;
}

/**
 * Utilities for working with flight plan batches
 */
export class FlightPlanBatchUtils {
  /**
   * Creates a flight plan batch with a given name
   * @param name the name
   * @returns a batch object
   */
  public static createBatch(name: string): FlightPlanBatch {
    return {
      id: UUID.GenerateUuid(),
      name,
    };
  }
}
