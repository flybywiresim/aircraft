import { FlightPathCalculatorOptions } from './FlightPathCalculator';

/**
 * Control Events for the Flight Path Calculator.
 */
export interface FlightPathCalculatorControlEvents {
  /** Event to set some or all FlightPathCalculatorOptions. */
  flightpath_set_options: Partial<FlightPathCalculatorOptions>;
}