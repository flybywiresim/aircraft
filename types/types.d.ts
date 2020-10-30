type NumberSimVarUnit = ("number" | "Number") | "position 32k" | ("SINT32") | ("bool" | "Bool" | "Boolean" | "boolean") | "Enum" | "lbs" | "kg" | ("Degrees" | "degree")
    | "radians" | ("Percent" | "percent") | ("Feet" | "feet" | "feets") | "Volts" | "Amperes" | "Hertz" | "PSI" | "celsius" | "degree latitude"
    | "degree longitude" | "Meters per second" | "Position" | ("Knots" | "knots") | "Seconds" | "kilograms per second" | "nautical miles" | "degrees"

type TextSimVarUnit = "Text" | "string"

type LatLongAltSimVarUnit = "latlonalt";
type LatLongAltPBHSimVarUnit = "latlonaltpbh";
type PitchBankHeadingSimVarUnit = "pbh";
type PID_STRUCTSimVarUnit = "pid_struct";
type XYZSimVarUnit = "xyz"

type SimVarBatchType = "string" | "number";

interface SimVarStatic {
    SimVarBatch: SimVarBatchConstructor;
    GetSimVarArrayValues(batch: SimVarBatch, callback: (results: any[][]) => void, dataSource?: string): void;

    GetSimVarValue(name: string, unit: NumberSimVarUnit, dataSource?: string): number | null;
    GetSimVarValue(name: string, unit: TextSimVarUnit, dataSource?: string): string | null;
    GetSimVarValue(name: string, unit: LatLongAltSimVarUnit, dataSource?: string): LatLongAlt | null;
    GetSimVarValue(name: string, unit: LatLongAltPBHSimVarUnit, dataSource?: string): LatLongAltPBH | null;
    GetSimVarValue(name: string, unit: PitchBankHeadingSimVarUnit, dataSource?: string): PitchBankHeading | null;
    GetSimVarValue(name: string, unit: PID_STRUCTSimVarUnit, dataSource?: string): PID_STRUCT | null;
    GetSimVarValue(name: string, unit: XYZSimVarUnit, dataSource?: string): XYZ | null;

    SetSimVarValue(name: string, unit: NumberSimVarUnit, value: number, dataSource?: string): Promise<void>;
    SetSimVarValue(name: string, unit: TextSimVarUnit, value: string, dataSource?: string): Promise<void>;
}

interface SimVarBatch {
    add(name: string, unit: NumberSimVarUnit | TextSimVarUnit, type?: SimVarBatchType): void;
    getCount(): string;
    getIndex(): string;
    getNames(): string[];
    getUnits(): (NumberSimVarUnit | TextSimVarUnit)[];
    getTypes(): SimVarBatchType[];
}

interface SimVarBatchConstructor {
    new(simVarCount: string, simVarIndex: string): SimVarBatch;
}

declare global {
    const SimVar: SimVarStatic;

    class LatLongAlt {
        constructor(latitude: number, longitude: number, alt: number);
        constructor(data: { lat: number, long: number, alt: number });

        lat: number;
        long: number;
        alt: number;

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

    class LatLong {
        constructor(latitude: number, longitude: number);
        constructor(data: { lat: number, long: number });

        lat: number;
        long: number;

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

    class PitchBankHeading {
        constructor(data: { pitchDegree: number, bankDegree: number, headingDegree: number });

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

        /**
         * @returns A string formatted as "key: " + key + ", data: " + data
         */
        toString(): string;
    }

    class POIInfo {
        constructor(data: { distance: any, angle: any, isSelected: any });

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

    const Simplane: {
        getCurrentFlightPhase(): FlightPhase

        getVerticalSpeed(): number
        getAltitude(): number
        getAltitudeAboveGround(): number
        getHeadingMagnetic(): number

        getIsGrounded(): boolean

        getTotalAirTemperature(): number
        getAmbientTemperature(): number

        getPressureSelectedMode(_aircraft: Aircraft): string
        getPressureSelectedUnits(): string
        getPressureValue(_units?: string): number

        getAutoPilotDisplayedAltitudeLockValue(_units?: string): number
        getAutoPilotAirspeedManaged(): boolean
        getAutoPilotHeadingManaged(): boolean
        getAutoPilotAltitudeManaged(): boolean

        getAutoPilotMachModeActive(): number
        getEngineActive(_engineIndex: number): number
        getEngineThrottle(_engineIndex: number): number
        getEngineThrottleMaxThrust(_engineIndex: number): number
        getEngineThrottleMode(_engineIndex: number): number
        getEngineCommandedN1(_engineIndex: number): number
        getFlexTemperature(): number

        //Seems to implement caching behaviour, can be overridden with forceSimVarCall
        getFlapsHandleIndex(forceSimVarCall?: boolean): number
    };

    const Utils: {
        /**
         * Returns a number limited to the given range.
         * @param value The preferred value.
         * @param min The lower boundary.
         * @param max The upper boundary.
         * @returns min <= returnValue <= max.
         */
        Clamp(value: number, min: number, max: number): number;
        RemoveAllChildren(elem): void
        leadingZeros(_value, _nbDigits, _pointFixed?: number): string
    }

    const Avionics: {
        SVG: SVG
    }

    class SVG {
        NS: string;
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

    type A320_Neo_LowerECAM_APU = {
        Definitions?: any;
        Page?: any;
        APUInfo?: APUInfo;
    };

    class APUInfo {

    }

    class UIElement extends HTMLElement {
        connectedCallback(): void;
    }

    class TemplateElement extends UIElement {
        connectedCallback(): void;
    }

    class EICASTemplateElement extends TemplateElement {
        init(): void
    }

    class BaseEICAS {

    }

    const Airliners: {
        BaseEICAS: new () => BaseEICAS,
        EICASTemplateElement: new () => EICASTemplateElement,
    };

    interface Element {
        textContent: string | number;
    }
    class Vec2 {
        constructor(x: number, y: number);
        x: number;
        y: number;
    }

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
        currentValueFunction: () => void;
        currentValuePrecision: number;
        currentValueBorderWidth: number;
        outerIndicatorFunction: () => void;
        outerDynamicArcFunction: () => void;
        extraMessageFunction: () => void;
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
        set active(_isActive: boolean);
        get active(): boolean;
        polarToCartesian(_centerX: number, _centerY: number, _radius: number, _angleInDegrees: number): Vec2;
        valueToAngle(_value: number, _radians: number): number;
        valueToDir(_value: number): Vec2;
        init(_gaugeDefinition: GaugeDefinition): void;
        addGraduation(_value: number, _showInnerMarker: boolean, _text?: string, _showOuterMarker?: boolean): void;
        refreshActiveState(): void;
        update(_deltaTime: number): void;
        refreshMainValue(_value: number, _force?: boolean): void
        refreshOuterIndicator(_value: number, _force?: boolean): void
        refreshOuterDynamicArc(_start: number, _end: number, _force?: boolean): void
    }

    const A320_Neo_ECAM_Common: {
        GaugeDefinition: new () => GaugeDefinition;
        Gauge: new () => Gauge;
    }

    interface Document {
        createElement(tagName: "a320-neo-ecam-gauge"): Gauge;
    }
}

export {};
