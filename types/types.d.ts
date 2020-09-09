declare global {

    type NumberSimVarUnit = ("number" | "Number") | ("SINT32") | ("bool" | "Bool" | "Boolean" | "boolean") | "Enum" | "lbs" | "kg" | ("Degrees" | "degree")
        | "radians" | ("Percent" | "percent") | ("Feet" | "feet" | "feets") | "Volts" | "Amperes" | "Hertz" | "PSI" | "celsius" | "degree latitude"
        | "degree longitude" | "Meters per second" | "Position" | ("Knots" | "knots") | "Seconds"

    type TextSimVarUnit = "Text" | "string"

    const SimVar: {
        GetSimVarValue(name: string, type: NumberSimVarUnit): number
        GetSimVarValue(name: string, type: TextSimVarUnit): string

        SetSimVarValue(name: string, type: NumberSimVarUnit, value: number): void
        SetSimVarValue(name: string, type: TextSimVarUnit, value: string): void
    }

    const Simplane: {
        getVerticalSpeed(): number
        getAltitude(): number
        getHeadingMagnetic(): number

        getIsGrounded(): boolean

        getTotalAirTemperature(): number
        getAmbientTemperature(): number

        getAutoPilotAirspeedManaged(): boolean
        getAutoPilotHeadingManaged(): boolean

        getAutoPilotMachModeActive(): number
        getEngineActive(_engineIndex: number): number
    };

    enum FlightPhase {
        FLIGHT_PHASE_TAKEOFF,
        FLIGHT_PHASE_CLIMB,
        FLIGHT_PHASE_CRUISE,
        FLIGHT_PHASE_APPROACH,
        FLIGHT_PHASE_GOAROUND
    }

    enum ThrottleMode {
        CLIMB,
        FLEX_MCT,
        TOGA,
        AUTO
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
        set active(_isActive: boolean): void;
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
