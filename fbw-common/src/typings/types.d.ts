import type {
    FlightPlanManager as FlightPlanManager_,
    ManagedFlightPlan as ManagedFlightPlan_,
    getFlightPhaseManager as getFlightPhaseManager_,
    EfisSymbols as EfisSymbols_,
} from "../../../fbw-a32nx/src/systems/fmgc/src";
import { a320EfisRangeSettings as a320EfisRangeSettings_ } from "../systems/instruments/src/NavigationDisplay"

declare global {
    type NauticalMiles = number;
    type Heading = number;
    type Track = number;
    type Latitude = number;
    type Longitude = number;
    type Feet = number;
    type FlightLevel = number;
    type Knots = number;
    type FeetPerMinute = number;
    type Metres = number;
    type MetresPerSecond = number;
    type Mach = number;
    type Degrees = number;
    type DegreesMagnetic = number;
    type DegreesTrue = number;
    type Seconds = number;
    type Minutes = number;
    type Percent = number;
    type Radians = number;
    type RotationsPerMinute = number;
    type Angl16 = number;
    type RadiansPerSecond = number;
    type PercentOver100 = number;
    type Gallons = number;
    type Kilograms = number;
    type Pounds = number;
    type Celsius = number;
    type InchesOfMercury = number;
    type Millibar = number;
    type PressurePerSquareInch = number;

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
