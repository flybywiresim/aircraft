import type {
    GuidanceController as GuidanceController_,
    FlightPlanService as FlightPlanService_,
    getFlightPhaseManager as getFlightPhaseManager_,
    EfisSymbols as EfisSymbols_,
} from "../../../fbw-a32nx/src/systems/fmgc/src";
import { a320EfisRangeSettings as a320EfisRangeSettings_ } from "../systems/instruments/src/NavigationDisplay"

declare global {
    /**
     * Legacy A32NX FMGC object typings
     */
    namespace Fmgc {
        const GuidanceController: typeof GuidanceController_

        const FlightPlanService: typeof FlightPlanService_

        const EfisSymbols: typeof EfisSymbols_

        const getFlightPhaseManager: typeof getFlightPhaseManager_

        const FlightPhaseManager: ReturnType<typeof getFlightPhaseManager_>

        const a320EfisRangeSettings: typeof a320EfisRangeSettings_
    }
}

export {};
