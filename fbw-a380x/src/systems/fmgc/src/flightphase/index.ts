import { FlightPhaseManager } from './FlightPhaseManager';

const flightPhaseManager = new FlightPhaseManager();

export { FlightPhaseManager };

export function getFlightPhaseManager(): FlightPhaseManager {
    return flightPhaseManager;
}
