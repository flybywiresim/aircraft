import { FlightPlanService as Service, NavigationDatabaseService as NavigationDatabaseService_ } from "../src/fmgc/src";
import { NavigationDatabase as Database, NavigationDatabaseBackend as DatabaseBackend } from '../src/fmgc/src/NavigationDatabase'
import { FlightPlanIndex as Index } from '../src/fmgc/src';
import { FlightPhaseManager as FlightPhaseManager_ } from "../src/fmgc/src";
import { WaypointFactory as WaypointFactory_ } from "../src/fmgc/src";
import { WaypointEntryUtils as WaypointEntryUtils_ } from "../src/fmgc/src";
import { SimBriefUplinkAdapter as SimBriefUplinkAdapter_ } from "../src/fmgc/src";

declare global {
    type NauticalMiles = number;
    type Heading = number;
    type Track = number;
    type Latitude = number;
    type Longitude = number;
    type Feet = number;
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
        const FlightPlanService: typeof Service

        const NavigationDatabase: typeof Database

        const NavigationDatabaseBackend: typeof DatabaseBackend

        const NavigationDatabaseService: typeof NavigationDatabaseService_

        const FlightPlanIndex: typeof Index

        const FlightPhaseManager: typeof FlightPhaseManager_

        const WaypointFactory: typeof WaypointFactory_

        const WaypointEntryUtils: typeof WaypointEntryUtils_

        const SimBriefUplinkAdapter: typeof SimBriefUplinkAdapter_

        function getFlightPhaseManager(): FlightPhaseManager_
    }

}

export {};