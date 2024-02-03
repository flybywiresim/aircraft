import type {
    FlightPlanManager as FlightPlanManager_,
    ManagedFlightPlan as ManagedFlightPlan_,
    getFlightPhaseManager as getFlightPhaseManager_,
    EfisSymbols as EfisSymbols_,
} from "../../../fbw-a32nx/src/systems/fmgc/src";
import { a320EfisRangeSettings as a320EfisRangeSettings_ } from "../systems/instruments/src/NavigationDisplay"

declare global {
    /**
     * Legacy A32NX FMGC object typings
     */
    namespace Fmgc {
        const FlightPlanManager: typeof FlightPlanManager_

        const ManagedFlightPlan: typeof ManagedFlightPlan_

        const EfisSymbols: typeof EfisSymbols_

        const getFlightPhaseManager: typeof getFlightPhaseManager_

        const FlightPhaseManager: ReturnType<typeof getFlightPhaseManager_>

        const a320EfisRangeSettings: typeof a320EfisRangeSettings_
    }
}

export {};
