export enum EngineOutTargetPage {
  FlightPlan,
  Perf,
}

export interface EngineOutEvents {
  /** Whether an engine-out condition has been detected. */
  fms_engine_out_active: boolean;

  /** A request from the engine out monitor to change the active MCDU pages. */
  fms_engine_out_page_request: EngineOutTargetPage;
}

export interface EngineOutControlEvents {
  /** Terminates the engine out condition and returns to normal performance predictions and speeds. */
  fms_engine_out_clear: void;
}
