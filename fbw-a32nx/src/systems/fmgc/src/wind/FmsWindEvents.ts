export interface FmsWindEvents {
  /** Sent to the fms to delete the approach wind. Plan index as value */
  delete_approach_wind: number;

  /** Sent to the fms to set the approach wind. */
  set_approach_wind: { direction: number | null; speed: number | null; plan: number };
}
