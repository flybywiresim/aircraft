// Copyright (c) 2026 FlyByWire Simulations
import { FlightPlanIndex } from '../flightplanning/FlightPlanManager';
export interface FlightPlanOperationEvents {
  /** Event triggered when immediate exit is selected on the MCDU/MFD */
  fms_set_hold_immediate_exit: { index: FlightPlanIndex; exit: boolean };

  /** Event triggered when the draft wind entries are automatically deleted from the flightplan. */
  fms_draft_winds_inserted: null;
}
