import type {
    FlightPlanManager as FlightPlanManager_,
    ManagedFlightPlan as ManagedFlightPlan_,
    getFlightPhaseManager as getFlightPhaseManager_,
    EfisSymbols as EfisSymbols_,
} from "../../../fbw-a32nx/src/systems/fmgc/src";
import { a320EfisRangeSettings as a320EfisRangeSettings_ } from "../systems/instruments/src/NavigationDisplay"

declare global {
    namespace Facilities {
        function getMagVar(lat: Degrees, long: Degrees): Degrees;
    }

    const process: {
        env: Record<string, string | undefined>
    }

    interface Window {
        /**
         * Present if the instrument is running in [ACE](https://github.com/flybywiresim/ace)
         */
        ACE_ENGINE_HANDLE: object | undefined

        /**
         * `true` if `window.ACE_ENGINE_HANDLE` is present and the instrument is using (but is not necessarily connected to) a remote bridge
         */
        ACE_IS_REMOTE: boolean | undefined

        /**
         * `true` if `window.ACE_ENGINE_HANDLE` is present and `window.ACE_IS_REMOTE` is `true` and the instrument is connected to the sim through a remote bridge
         */
        ACE_REMOTE_IS_CONNECTED: boolean | undefined
    }

    /**
     * Legacy A32NX FMGC object typings
     */
    namespace Fmgc {
        const FlightPlanManager: typeof FlightPlanManager_

        const ManagedFlightPlan: typeof ManagedFlightPlan_

        const EfisSymbols: typeof EfisSymbols_

        const getFlightPhaseManager: typeof getFlightPhaseManager_

        const FlightPhaseManager: ReturnType<getFlightPhaseManager_>

        const a320EfisRangeSettings: typeof a320EfisRangeSettings_
    }
}

export {};
