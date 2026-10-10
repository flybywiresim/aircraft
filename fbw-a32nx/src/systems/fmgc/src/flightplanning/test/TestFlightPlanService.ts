import { A320AircraftConfig } from '../A320AircraftConfig';
import { FlightPlanService } from '../FlightPlanService';
import { A320FlightPlanPerformanceData } from '../plans/performance/A320FlightPlanPerformanceData';
import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';

export const testFlightPlanService = new FlightPlanService(
  testEventBus,
  new A320FlightPlanPerformanceData(),
  A320AircraftConfig,
);
