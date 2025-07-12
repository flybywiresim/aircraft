import {
    FlightPlanService as FlightPlanService_,
    NavigationDatabaseService as NavigationDatabaseService_,
    SelectedNavaidType as SelectedNavaidType_,
    SelectedNavaidMode as SelectedNavaidMode_,
    A320FlightPlanPerformanceData as A320FlightPlanPerformanceData_,
    FlightPlanUtils as FlightPlanUtils_,
} from "../../../fbw-a32nx/src/systems/fmgc/src";
import { NavigationDatabase as Database, NavigationDatabaseBackend as DatabaseBackend } from '../../../fbw-a32nx/src/systems/fmgc/src/NavigationDatabase'
import { FlightPlanIndex as Index } from '../../../fbw-a32nx/src/systems/fmgc/src';
import { FlightPhaseManager as FlightPhaseManager_ } from "../../../fbw-a32nx/src/systems/fmgc/src";
import { WaypointFactory as WaypointFactory_ } from "../../../fbw-a32nx/src/systems/fmgc/src";
import { WaypointEntryUtils as WaypointEntryUtils_ } from "../../../fbw-a32nx/src/systems/fmgc/src";
import { CoRouteUplinkAdapter as CoRouteUplinkAdapter_ } from "../../../fbw-a32nx/src/systems/fmgc/src";
import { SimBriefUplinkAdapter as SimBriefUplinkAdapter_ } from "../../../fbw-a32nx/src/systems/fmgc/src";

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
    };

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

    namespace Fmgc {
        const SelectedNavaidType: typeof SelectedNavaidType_
        const SelectedNavaidMode: typeof SelectedNavaidMode_

        const FlightPlanService: typeof FlightPlanService_

        const A320FlightPlanPerformanceData: typeof A320FlightPlanPerformanceData_

        const NavigationDatabase: typeof Database

        const NavigationDatabaseBackend: typeof DatabaseBackend

        const NavigationDatabaseService: typeof NavigationDatabaseService_

        const FlightPlanIndex: typeof Index

        const FlightPhaseManager: typeof FlightPhaseManager_

        const FlightPlanUtils: typeof FlightPlanUtils_

        const WaypointFactory: typeof WaypointFactory_

        const WaypointEntryUtils: typeof WaypointEntryUtils_

        const CoRouteUplinkAdapter: typeof CoRouteUplinkAdapter_

        const SimBriefUplinkAdapter: typeof SimBriefUplinkAdapter_
    }
}
