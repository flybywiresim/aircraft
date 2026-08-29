// Copyright (c) 2026 FlyByWire Simulations
import { FlightPlanIndex } from '../flightplanning/FlightPlanManager';
export interface FlightPlanOperationEvents {
  /** Event triggered when immediate exit is selected on the MCDU/MFD */
  fms_set_hold_immediate_exit: { index: FlightPlanIndex; exit: boolean };
}
