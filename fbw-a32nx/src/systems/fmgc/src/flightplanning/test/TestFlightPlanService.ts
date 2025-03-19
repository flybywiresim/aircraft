import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPlanService } from '../FlightPlanService';
import { A320FlightPlanPerformanceData } from '../plans/performance/FlightPlanPerformanceData';

const eventBus = new EventBus();

export const testFlightPlanService = new FlightPlanService(eventBus, new A320FlightPlanPerformanceData());
