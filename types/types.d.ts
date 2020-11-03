/// <reference path="./asobo-vcockpits-instruments-a320-neo/html_ui/Pages/VCockpit/Instruments/Airliners/A320_Neo/EICAS/ECAM/A320_Neo_ECAMGauge.d.ts" />

export type NauticalMiles = number;
export type Heading = number;
export type Latitude = number;
export type Longitude = number;
export type Feet = number;
export type Knots = number;
export type FeetPerMinute = number;
export type Mach = number;
export type Degrees = number;
export type Seconds = number;
export type Percent = number;
export type Radians = number;
export type RotationsPerMinute = number;
export type Angl16 = number;
export type RadiansPerSecond = number;
export type PercentOver100 = number;
export type Gallons = number;
export type Kilograms = number;
export type Celcius = number;
export type InchesOfMercury = number;
export type Millibar = number;
export type PressurePerSquareInch = number;

declare global {
    interface Document {
        // TODO: Scour files for customElements.define to set all these types.
        createElement(tagName: "a320-neo-ecam-gauge"): A320_Neo_ECAM_Common.Gauge;
    }
}

export {};
