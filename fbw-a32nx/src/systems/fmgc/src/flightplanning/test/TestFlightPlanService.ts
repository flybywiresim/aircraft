import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPlanService } from '../FlightPlanService';
import { A320FlightPlanPerformanceData } from '../plans/performance/FlightPlanPerformanceData';

export const testEventBus = new EventBus();

export const testFlightPlanService = new FlightPlanService(testEventBus, new A320FlightPlanPerformanceData());
