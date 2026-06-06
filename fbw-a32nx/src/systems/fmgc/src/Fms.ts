import { FlightPlanInterface } from './flightplanning/FlightPlanInterface';
import { FlightPlanPerformanceData } from './flightplanning/plans/performance/FlightPlanPerformanceData';

export interface Fms<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> {
  /** Monotonic time since the start of the sim session in ms. */
  readonly simDuration: number;

  readonly flightPlanService: FlightPlanInterface<P>;
}
