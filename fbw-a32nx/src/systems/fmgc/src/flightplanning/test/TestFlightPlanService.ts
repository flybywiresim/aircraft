import { FlightPlanService } from '../FlightPlanService';
import { A320FlightPlanPerformanceData } from '../plans/performance/FlightPlanPerformanceData';
import { testEventBus } from '@fmgc/flightplanning/test/TestEventBus';

export const testFlightPlanService = new FlightPlanService(testEventBus, new A320FlightPlanPerformanceData());
