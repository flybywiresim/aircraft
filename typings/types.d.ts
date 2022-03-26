import { FlightPhaseManager as FlightPhaseManager_ } from "../src/fmgc/src";

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
    type Celcius = number;
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
        const FlightPhaseManager: typeof FlightPhaseManager_
    }
}

export {};
