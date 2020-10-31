type NumberVarUnit = ("number" | "Number") | "position 32k" | ("SINT32") | ("bool" | "Bool" | "Boolean" | "boolean") | "Enum" | "lbs" | "kg" | ("Degrees" | "degree")
    | "radians" | ("Percent" | "percent") | ("Feet" | "feet" | "feets" | "Feets") | "Volts" | "Amperes" | "Hertz" | "PSI" | "celsius" | "degree latitude"
    | "degree longitude" | "Meters per second" | "Position" | ("Knots" | "knots") | "Seconds" | "seconds" | "kilograms per second" | "nautical miles" | "degrees"

type TextVarUnit = "Text" | "string"

type LatLongAltVarUnit = "latlonalt";
type LatLongAltPBHVarUnit = "latlonaltpbh";
type PitchBankHeadingVarUnit = "pbh";
type PID_STRUCTVarUnit = "pid_struct";
type XYZVarUnit = "xyz"
type POIListVarUnit = "poilist";
type FuelLevelsVarUnit = "FuelLevels";
type GlassCockpitSettingsVarUnit = "GlassCockpitSettings";

type NauticalMiles = number;
type Heading = number;
type Latitude = number;
type Longitude = number;
type Altitude = number;

type VarUnit = NumberVarUnit | TextVarUnit | LatLongAltVarUnit | LatLongAltPBHVarUnit
    | PitchBankHeadingVarUnit | PID_STRUCTVarUnit | XYZVarUnit;

type SimVarBatchType = "string" | "number";

// asobo-vcockpits-instruments-a320-neo/html_ui/Pages/VCockpit/Instruments/Airliners/A320_Neo/EICAS/ECAM/A320_Neo_ECAMGauge.js
declare global {
    namespace A320_Neo_ECAM_Common {
        class GaugeDefinition {
            startAngle: number;
            arcSize: number;
            minValue: number;
            maxValue: number;
            minRedValue: number;
            maxRedValue: number;
            warningRange: [number, number];
            dangerRange: [number, number];
            cursorLength: number;
            currentValuePos: Vec2;
            currentValueFunction: (() => void) | null;
            currentValuePrecision: number;
            currentValueBorderWidth: number;
            outerIndicatorFunction: (() => void) | null;
            outerDynamicArcFunction: (() => void) | null;
            extraMessageFunction: (() => void) | null;
        }

        class Gauge extends HTMLElement {
            viewBoxSize: Vec2;
            startAngle: number;
            warningRange: [number, number];
            dangerRange: [number, number];
            outerDynamicArcCurrentValues: [number, number];
            outerDynamicArcTargetValues: [number, number];
            extraMessageString: string;
            isActive: boolean;
            get mainArcRadius(): number;
            get graduationInnerLineEndOffset(): number;
            get graduationOuterLineEndOffset(): number;
            get graduationTextOffset(): number;
            get redArcInnerRadius(): number;
            get outerIndicatorOffset(): number;
            get outerIndicatorRadius(): number;
            get outerDynamicArcRadius(): number;
            get currentValueBorderHeight(): number;
            get extraMessagePosX(): number;
            get extraMessagePosY(): number;
            get extraMessageBorderPosX(): number;
            get extraMessageBorderPosY(): number;
            get extraMessageBorderWidth(): number;
            get extraMessageBorderHeight(): number;
            set active(isActive: boolean);
            get active(): boolean;
            polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number): Vec2;
            valueToAngle(value: number, radians: number): number;
            valueToDir(value: number): Vec2;
            init(gaugeDefinition: GaugeDefinition): void;
            addGraduation(value: number, showInnerMarker: boolean, text?: string, showOuterMarker?: boolean): void;
            refreshActiveState(): void;
            update(deltaTime: number): void;
            refreshMainValue(value: number, force?: boolean): void
            refreshOuterIndicator(value: number, force?: boolean): void
            refreshOuterDynamicArc(start: number, end: number, force?: boolean): void
        }
    }
}

// asobo-vcockpits-instruments-airliners/html_ui/Pages/VCockpit/Instruments/Airliners/Shared/BaseAirliners.js
declare global {
    namespace Airliners {
        class BaseEICAS {
        }

        class EICASTemplateElement extends TemplateElement {
            init(): void
        }
    }
}

// fs-base-ui/html_ui/JS/Avionics.js
declare global {
    namespace Avionics {
        class Utils {
            static make_bcd16(arg: number): number;

            static make_adf_bcd32(arg: number): number;

            static make_xpndr_bcd16(arg: number): number;

            /**
             * Sets the element's innerHTML to newValue when different.
             */
            static diffAndSet(element: InnerHTML, newValue: string): void;

            /**
             * Sets the element's attribute with the given qualifiedName to newValue when different.
             */
            static diffAndSetAttribute(element: Element, qualifiedName: string, newValue: string): void;

            /**
             * Computes the coordinates at the given distance and bearing away from a latitude and longitude point.
             */
            static bearingDistanceToCoordinates(bearing: Heading, distance: NauticalMiles, referentialLat: Latitude,
                                                referentialLong: Longitude): LatLongAlt;

            /**
             * Computes the distance in nautical miles between two locations.
             */
            static computeDistance(x: LatLong | LatLongAlt, y: LatLong | LatLongAlt): NauticalMiles;

            /**
             * Computes the great circle heading between two locations.
             */
            static computeGreatCircleHeading(from: LatLong | LatLongAlt, to: LatLong | LatLongAlt): Heading;

            /**
             * Computes the great circle distance in nautical miles between two locations.
             */
            static computeGreatCircleDistance(x: LatLong | LatLongAlt, y: LatLong | LatLongAlt): NauticalMiles;

            static lerpAngle(from: number, to: number, d: number): number;

            static meanAngle(a: number, b: number): number;

            static angleDiff(a: number, b: number): number;

            static fmod(a: number, b: number): number;

            /**
             * Adds a "0" prefix to runway designators which have only one number.
             */
            static formatRunway(designation: string): string;

            static DEG2RAD: number;

            static RAD2DEG: number;

            static runwayRegex: RegExp;
        }

        class SVG {
            static NS: string;
        }
    }
}

// fs-base-ui/html_ui/JS/common.js
declare global {
    namespace Utils {
        /**
         * Returns a number limited to the given range.
         * @param value The preferred value.
         * @param min The lower boundary.
         * @param max The upper boundary.
         * @returns min <= returnValue <= max.
         */
        function Clamp(value: number, min: number, max: number): number;
        function RemoveAllChildren(elem): void
        function leadingZeros(_value, _nbDigits, _pointFixed?: number): string
    }

    class UIElement extends HTMLElement {
        connectedCallback(): void;
    }

    class TemplateElement extends UIElement {
    }

    class Vec2 {
        constructor(x: number, y: number);
        x: number;
        y: number;
    }
}

// fs-base-ui/html_ui/JS/SimPlane.js
declare global {
    namespace Simplane {
        function getDesignSpeeds(): DesignSpeeds;
        function getCurrentFlightPhase(): FlightPhase

        function getVerticalSpeed(): number
        function getAltitude(): number
        function getAltitudeAboveGround(): number
        function getHeadingMagnetic(): number

        function getIsGrounded(): boolean

        function getTotalAirTemperature(): number
        function getAmbientTemperature(): number

        function getPressureSelectedMode(_aircraft: Aircraft): string
        function getPressureSelectedUnits(): string
        function getPressureValue(_units?: string): number

        function getAutoPilotDisplayedAltitudeLockValue(_units?: string): number
        function getAutoPilotAirspeedManaged(): boolean
        function getAutoPilotHeadingManaged(): boolean
        function getAutoPilotAltitudeManaged(): boolean

        function getAutoPilotMachModeActive(): number
        function getEngineActive(_engineIndex: number): number
        function getEngineThrottle(_engineIndex: number): number
        function getEngineThrottleMaxThrust(_engineIndex: number): number
        function getEngineThrottleMode(_engineIndex: number): number
        function getEngineCommandedN1(_engineIndex: number): number
        function getFlexTemperature(): number

        //Seems to implement caching behaviour, can be overridden with forceSimVarCall
        function getFlapsHandleIndex(forceSimVarCall?: boolean): number
    }

    class GlassCockpitSettings {
        FuelFlow:                ColorRangeDisplay;
        FuelQuantity:            ColorRangeDisplay2;
        FuelTemperature:         ColorRangeDisplay3;
        FuelPressure:            ColorRangeDisplay3;
        OilPressure:             ColorRangeDisplay3;
        OilTemperature:          ColorRangeDisplay3;
        EGTTemperature:          RangeDisplay;
        Vacuum:                  ColorRangeDisplay;
        ManifoldPressure:        ColorRangeDisplay;
        AirSpeed:                ColorRangeDisplay4;
        Torque:                  ColorRangeDisplay2;
        RPM:                     ColorRangeDisplay2;
        TurbineNg:               ColorRangeDisplay2;
        ITTEngineOff:            ColorRangeDisplay3;
        ITTEngineOn:             ColorRangeDisplay3;
        MainBusVoltage:          ColorRangeDisplay3;
        HotBatteryBusVoltage:    ColorRangeDisplay3;
        BatteryBusAmps:          ColorRangeDisplay2;
        GenAltBusAmps:           ColorRangeDisplay2;
        CoolantLevel:            RangeDisplay;
        CoolantTemperature:      ColorRangeDisplay3;
        GearOilTemperature:      ColorRangeDisplay2;
        CabinAltitude:           ColorRangeDisplay;
        CabinAltitudeChangeRate: RangeDisplay;
        CabinPressureDiff:       ColorRangeDisplay;
        ThrottleLevels:          ThrottleLevelsInfo;
        FlapsLevels:             FlapsLevelsInfo;
    }

    class RangeDisplay {
        __Type: "RangeDisplay" | "ColorRangeDisplay" | "ColorRangeDisplay2" | "ColorRangeDisplay3"
            | "ColorRangeDisplay4" | "FlapsRangeDisplay";
        min:       number;
        max:       number;
        lowLimit:  number;
        highLimit: number;
    }

    class ColorRangeDisplay extends RangeDisplay {
        greenStart: number;
        greenEnd:   number;
    }

    class ColorRangeDisplay2 extends ColorRangeDisplay {
        yellowStart: number;
        yellowEnd:   number;
        redStart:    number;
        redEnd:      number;
    }

    class ColorRangeDisplay3 extends ColorRangeDisplay2 {
        lowRedStart:    number;
        lowRedEnd:      number;
        lowYellowStart: number;
        lowYellowEnd:   number;
    }

    class ColorRangeDisplay4 extends ColorRangeDisplay2 {
        whiteStart: number;
        whiteEnd:   number;
    }

    class FlapsLevelsInfo {
        __Type: "FlapsLevelsInfo";
        slatsAngle: [number, number, number, number];
        flapsAngle: [number, number, number, number];
    }

    class FlapsRangeDisplay extends RangeDisplay {
        takeOffValue: number;
    }

    class ThrottleLevelsInfo {
        __Type: "ThrottleLevelsInfo";
        minValues: [number, number, number, number, number];
        names:     [string, string, string, string, string];
    }

    class FuelLevels {
        fuel_tank_selector: any[];
    }

    class DesignSpeeds {
        VS0: number;
        VS1: number;
        VFe: number;
        VNe: number;
        VNo: number;
        VMin: number;
        VMax: number;
        Vr: number;
        Vx: number;
        Vy: number;
        Vapp: number;
        BestGlide: number;
    }

    enum FlightPhase {
        FLIGHT_PHASE_PREFLIGHT,
        FLIGHT_PHASE_TAXI,
        FLIGHT_PHASE_TAKEOFF,
        FLIGHT_PHASE_CLIMB,
        FLIGHT_PHASE_CRUISE,
        FLIGHT_PHASE_DESCENT,
        FLIGHT_PHASE_APPROACH,
        FLIGHT_PHASE_GOAROUND
    }

    enum AutopilotMode {
        MANAGED,
        SELECTED,
        HOLD
    }

    enum ThrottleMode {
        UNKNOWN,
        REVERSE,
        IDLE,
        AUTO,
        CLIMB,
        FLEX_MCT,
        TOGA,
        HOLD
    }

    enum Aircraft {
        CJ4,
        A320_NEO,
        B747_8,
        AS01B,
        AS02A
    }

    enum NAV_AID_STATE {
        OFF,
        ADF,
        VOR
    }

    enum NAV_AID_MODE {
        NONE,
        MANUAL,
        REMOTE
    }
}

// fs-base-ui/html_ui/JS/simvar.js.
declare global {
    namespace SimVar {
        class SimVarValue {
            constructor(name?: string, unit?: VarUnit, type?: string);
            name?: string;
            unit?: string;
            type?: string;
        }

        class SimVarBatch {
            constructor(simVarCount: string, simVarIndex: string);
            add(name: string, unit: NumberVarUnit | TextVarUnit, type?: SimVarBatchType): void;
            getCount(): string;
            getIndex(): string;
            getNames(): string[];
            getUnits(): (NumberVarUnit | TextVarUnit)[];
            getTypes(): SimVarBatchType[];
        }

        /**
         * Determines if SimVar is ready.
         * @returns Something when ready, null when not ready.
         */
        function IsReady(): any | null;

        /**
         * When the SimVarValueHistory is stored (disabled by default and currently not exposed),
         * logs per SimVar (slowest per number of invocations first):
         * - The amount of invocations.
         * - The average invocation time in milliseconds.
         * - The total invocation time in milliseconds.
         * - The slowest invocation time in milliseconds.
         * - The average invocation time per frame in milliseconds.
         * - The average amount of invocations per frame.
         *
         *  Also logs the total invokes per frame and total time in milliseconds taken per frame.
         */
        function LogSimVarValueHistory(): void;

        /**
         * When the SimVarValueHistory is stored (disabled by default and currently not exposed),
         * logs per SimVar (slowest per frame first):
         * - The amount of invocations.
         * - The average invocation time in milliseconds.
         * - The total invocation time in milliseconds.
         * - The slowest invocation time in milliseconds.
         * - The average invocation time per frame in milliseconds.
         * - The average amount of invocations per frame.
         *
         *  Also logs the total invokes per frame and total time in milliseconds taken per frame.
         */
        function LogSimVarValueHistoryByTimePerFrame(): void;

        function GetSimVarArrayValues(batch: SimVarBatch, callback: (results: any[][]) => void, dataSource?: string): void;

        function GetSimVarValue(name: string, unit: NumberVarUnit, dataSource?: string): number | null;
        function GetSimVarValue(name: string, unit: TextVarUnit, dataSource?: string): string | null;
        function GetSimVarValue(name: string, unit: LatLongAltVarUnit, dataSource?: string): LatLongAlt | null;
        function GetSimVarValue(name: string, unit: LatLongAltPBHVarUnit, dataSource?: string): LatLongAltPBH | null;
        function GetSimVarValue(name: string, unit: PitchBankHeadingVarUnit, dataSource?: string): PitchBankHeading | null;
        function GetSimVarValue(name: string, unit: PID_STRUCTVarUnit, dataSource?: string): PID_STRUCT | null;
        function GetSimVarValue(name: string, unit: XYZVarUnit, dataSource?: string): XYZ | null;

        function SetSimVarValue(name: string, unit: NumberVarUnit, value: number, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: TextVarUnit, value: string, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: LatLongAltVarUnit, value: LatLongAlt, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: LatLongAltPBHVarUnit, value: LatLongAltPBH, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: PitchBankHeadingVarUnit, value: PitchBankHeading, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: PID_STRUCTVarUnit, value: PID_STRUCT, dataSource?: string): Promise<void>;
        function SetSimVarValue(name: string, unit: XYZVarUnit, value: XYZ, dataSource?: string): Promise<void>;

        function GetGlobalVarValue(name: string, unit: any): any | null;

        function GetGameVarValue(name: string, unit: NumberVarUnit, param1?: number, param2?: number): number | null;
        function GetGameVarValue(name: string, unit: TextVarUnit): string | null;
        function GetGameVarValue(name: string, unit: XYZVarUnit): XYZ | null;
        function GetGameVarValue(name: string, unit: POIListVarUnit): any | null;
        function GetGameVarValue(name: string, unit: FuelLevelsVarUnit): FuelLevels | null;
        function GetGameVarValue(name: string, unit: GlassCockpitSettingsVarUnit): GlassCockpitSettings | null;
        function GetGameVarValue(name: string, unit: string): any | null;

        function SetGameVarValue(name: string, unit: NumberVarUnit, value: number): Promise<void>;
        /**
         * Doesn't do anything.
         */
        function SetGameVarValue(name: string, unit: "string" | XYZVarUnit | POIListVarUnit | FuelLevelsVarUnit | GlassCockpitSettingsVarUnit, value: any): Promise<void>;
    }
}

// fs-base-ui/html_ui/JS/Types.js.
declare global {
    class LatLong {
        constructor(latitude: Latitude, longitude: Longitude);
        constructor(data: { lat: Latitude, long: Longitude });

        __Type: "LatLong";
        lat: Latitude;
        long: Longitude;

        /**
         * @returns A string formatted as "40.471000, 73.580000".
         */
        toStringFloat(): string;

        /**
         * @returns A string formatted as "lat 40.47, long 73.58".
         */
        toString(): string;

        /**
         * @returns A string formatted as "4047.1N".
         */
        latToDegreeString(): string;

        /**
         * @returns A string formatted as "07358.0W".
         */
        longToDegreeString(): string;

        /**
         * @returns A string formatted as "N40°47.1 W073°58.0".
         */
        toDegreeString(): string;

        /**
         * @returns A string formatted as "4047.1N07358.0W".
         */
        toShortDegreeString(): string;

        /**
         * Parses a string into a LatLong or LatLongAlt
         * @param str A string formatted as either "0.0,0.0" or "0.0,0.0,0.0".
         * When the string contains spaces around the numbers, those are ignored.
         * @returns An instance of LatLong or LatLongAlt, depending on the number of values in the string. Null when
         * the string doesn't contain a comma.
         */
        static fromStringFloat(str: string): LatLong | LatLongAlt | null;
    }

    class LatLongAlt {
        constructor(latitude: Latitude, longitude: Longitude, alt: Altitude);
        constructor(data: { lat: Latitude, long: Longitude, alt: Altitude });

        __Type: "LatLongAlt";
        lat: Latitude;
        long: Longitude;
        alt: Altitude;

        /**
         * @returns A LatLong instance containing the latitude and longitude of this instance.
         */
        toLatLong(): LatLong;

        /**
         * @returns A string formatted as "52.370216, 4.895168, 1500.0".
         */
        toStringFloat(): string;

        /**
         * @returns A string formatted as "lat 52.37, long 4.90, alt 1500.00".
         */
        toString(): string;

        /**
         * @returns A string formatted as "5222.2N".
         */
        latToDegreeString(): string;

        /**
         * @returns A string formatted as "00453.7E".
         */
        longToDegreeString(): string;

        /**
         * @returns A string formatted as "N52°22.2 E004°53.7".
         */
        toDegreeString(): string;
    }

    class PitchBankHeading {
        constructor(data: { pitchDegree: number, bankDegree: number, headingDegree: number });

        __Type: "PitchBankHeading";
        pitchDegree: number;
        bankDegree: number;
        headingDegree: number;

        /**
         * @returns A string formatted as "p 2.40, b 10.60, h 240.20".
         */
        toString(): string;
    }

    class LatLongAltPBH {
        constructor(data: { lla: LatLongAlt, pbh: PitchBankHeading });

        __Type: "LatLongAltPBH";
        lla: LatLongAlt;
        pbh: PitchBankHeading;

        /**
         * @returns A string formatted as "lla lat 52.37, long 4.90, alt 1500.00, pbh p 2.40, b 10.60, h 240.20".
         */
        toString(): string;
    }

    class PID_STRUCT {
        constructor(data: { pid_p: number; pid_i: number; pid_i2: number; pid_d: number;
            i_boundary: number; i2_boundary: number; d_boundary: number; });

        // __Type is missing on this type.

        pid_p: number;
        pid_i: number;
        pid_i2: number;
        pid_d: number;
        i_boundary: number;
        i2_boundary: number;
        d_boundary: number;

        /**
         * @returns A string formatted as "pid_p 123.46, pid_i 123.46, pid_i2 123.46, pid_d 123.46, i_boundary 123.46, i2_boundary 123.46, d_boundary 123.46".
         */
        toString(): string;
    }

    class XYZ {
        constructor(data: { x: number; y: number; z: number; });

        x: number;
        y: number;
        z: number;

        /**
         * @returns A string formatted as "x 123.00, y 456.00, z 789.13".
         */
        toString(): string;
    }

    class DataDictionaryEntry {
        constructor(data: { key: any, data: any });

        __Type: "DataDictionaryEntry";

        /**
         * @returns A string formatted as "key: " + key + ", data: " + data
         */
        toString(): string;
    }

    class POIInfo {
        constructor(data: { distance: any, angle: any, isSelected: any });

        __Type: "POIInfo";

        /**
         * @returns A string formatted as "Distance: " + distance + ", angle: " + angle + ", selected: " + isSelected
         */
        toString(): string;
    }

    class KeyActionParams {
        /**
         * Parses the JSON string and sets the properties on the newly created instance.
         */
        constructor(json: string | null);

        bReversed: boolean;
        static sKeyDelimiter: string;
    }

    /**
     * The Simvar class is not to be confused with the SimVar namespace.
     */
    class Simvar {
        __Type: "Simvar";
    }

    class Attribute {
        __Type: "Attribute";
    }
}

declare global {
    interface Document {
        createElement(tagName: "a320-neo-ecam-gauge"): A320_Neo_ECAM_Common.Gauge;
    }
}

export {};
