/// <reference path="./Types.d.ts" />

declare global {
    class GlassCockpitSettings {
        FuelFlow: ColorRangeDisplay;

        FuelQuantity: ColorRangeDisplay2;

        FuelTemperature: ColorRangeDisplay3;

        FuelPressure: ColorRangeDisplay3;

        OilPressure: ColorRangeDisplay3;

        OilTemperature: ColorRangeDisplay3;

        EGTTemperature: RangeDisplay;

        Vacuum: ColorRangeDisplay;

        ManifoldPressure: ColorRangeDisplay;

        AirSpeed: ColorRangeDisplay4;

        Torque: ColorRangeDisplay2;

        RPM: ColorRangeDisplay2;

        TurbineNg: ColorRangeDisplay2;

        ITTEngineOff: ColorRangeDisplay3;

        ITTEngineOn: ColorRangeDisplay3;

        MainBusVoltage: ColorRangeDisplay3;

        HotBatteryBusVoltage: ColorRangeDisplay3;

        BatteryBusAmps: ColorRangeDisplay2;

        GenAltBusAmps: ColorRangeDisplay2;

        CoolantLevel: RangeDisplay;

        CoolantTemperature: ColorRangeDisplay3;

        GearOilTemperature: ColorRangeDisplay2;

        CabinAltitude: ColorRangeDisplay;

        CabinAltitudeChangeRate: RangeDisplay;

        CabinPressureDiff: ColorRangeDisplay;

        ThrottleLevels: ThrottleLevelsInfo;

        FlapsLevels: FlapsLevelsInfo;
    }

    class RangeDisplay {
        constructor(type?: string);

        min: number;

        max: number;

        lowLimit: number;

        highLimit: number;
    }

    class ColorRangeDisplay extends RangeDisplay {
        constructor(type?: string);

        greenStart: number;

        greenEnd: number;
    }

    class ColorRangeDisplay2 extends ColorRangeDisplay {
        constructor(type?: string);

        yellowStart: number;

        yellowEnd: number;

        redStart: number;

        redEnd: number;
    }

    class ColorRangeDisplay3 extends ColorRangeDisplay2 {
        constructor(type?: string);

        lowRedStart: number;

        lowRedEnd: number;

        lowYellowStart: number;

        lowYellowEnd: number;
    }

    class ColorRangeDisplay4 extends ColorRangeDisplay2 {
        constructor(type?: string);

        whiteStart: number;

        whiteEnd: number;
    }

    class FlapsLevelsInfo {
        slatsAngle: [number, number, number, number];

        flapsAngle: [number, number, number, number];
    }

    class FlapsRangeDisplay extends RangeDisplay {
        constructor(type?: string);

        takeOffValue: number;
    }

    class ThrottleLevelsInfo {
        minValues: [number, number, number, number, number];

        names: [string, string, string, string, string];
    }

    class FuelLevels {
        fuel_tank_selector: any[];
    }

    class DesignSpeeds {
        VS0: Knots | null;

        VS1: Knots | null;

        VFe: Knots | null;

        VNe: Knots | null;

        VNo: Knots | null;

        VMin: Knots | null;

        VMax: Knots | null;

        Vr: Knots | null;

        Vx: Knots | null;

        Vy: Knots | null;

        Vapp: Knots | null;

        BestGlide: Knots | null;
    }

    enum EngineType {
        ENGINE_TYPE_PISTON,
        ENGINE_TYPE_JET,
        ENGINE_TYPE_NONE,
        ENGINE_TYPE_HELO_TURBINE,
        ENGINE_TYPE_ROCKET,
        ENGINE_TYPE_TURBOPROP
    }

    enum PropellerType {
        PROPELLER_TYPE_CONSTANT_SPEED,
        PROPELLER_TYPE_FIXED_PITCH
    }

    enum Aircraft {
        CJ4,
        A320_NEO,
        B747_8,
        AS01B,
        AS02A
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

    enum AutopilotMode {
        MANAGED,
        SELECTED,
        HOLD
    }

    enum FlightState {
        FLIGHT_STATE_BRIEFING,
        FLIGHT_STATE_INTRO_PLANE,
        FLIGHT_STATE_INTRO,
        FLIGHT_STATE_PREFLIGHT_GATE,
        FLIGHT_STATE_PREFLIGHT_PUSHBACK,
        FLIGHT_STATE_PREFLIGHT_TAXI,
        FLIGHT_STATE_PREFLIGHT_HOLDSHORT,
        FLIGHT_STATE_FLIGHT_RUNWAY,
        FLIGHT_STATE_FLIGHT_INITIAL_CLIMB,
        FLIGHT_STATE_FLIGHT_CLIMB,
        FLIGHT_STATE_FLIGHT_CRUISE,
        FLIGHT_STATE_FLIGHT_DESCENT,
        FLIGHT_STATE_JOINPLANE,
        FLIGHT_STATE_LANDING_APPROACH,
        FLIGHT_STATE_LANDING_FINAL,
        FLIGHT_STATE_LANDING_TOUCHDOWN,
        FLIGHT_STATE_LANDING_GROUNDROLL,
        FLIGHT_STATE_LANDING_TAXI,
        FLIGHT_STATE_LANDING_GATE,
        FLIGHT_STATE_LANDING_REST,
        FLIGHT_STATE_OUTRO,
        FLIGHT_STATE_WAITING,
        FLIGHT_STATE_TELEPORTTOSTATE,
        FLIGHT_STATE_FREEFLIGHT,
        FLIGHT_STATE_LANDINGCHALLENGE,
        FLIGHT_STATE_BUSHTRIP,
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

    enum ApproachType {
        APPROACH_TYPE_UNKNOWN = 0,
        APPROACH_TYPE_GPS,
        APPROACH_TYPE_VOR,
        APPROACH_TYPE_NDB,
        APPROACH_TYPE_ILS,
        APPROACH_TYPE_LOCALIZER,
        APPROACH_TYPE_SDF,
        APPROACH_TYPE_LDA,
        APPROACH_TYPE_VORDME,
        APPROACH_TYPE_NDBDME,
        APPROACH_TYPE_RNAV,
        APPROACH_TYPE_LOCALIZER_BACK_COURSE,
    }

    enum WorldRegion {
        NORTH_AMERICA,
        AUSTRALIA,
        OTHER
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

    namespace Simplane {
        function getDesignSpeeds(): DesignSpeeds;
        function getTrueSpeed(): Knots;
        function getIndicatedSpeed(): Knots;
        function getVerticalSpeed(): number;
        function getGroundSpeed(): Knots | null;
        function getMachSpeed(): number;

        /**
         * Gets the V1 speed up during and before takeoff, -1 after.
         */
        function getV1Airspeed(): Knots | -1 | null;

        /**
         * Gets the VR speed up during and before takeoff, -1 after.
         */
        function getVRAirspeed(): Knots | -1 | null;

        /**
         * Gets the VR speed up during and before takeoff, -1 after.
         */
        function getV2Airspeed(): Knots | -1 | null;
        function getREFAirspeed(): Knots | null;
        function getVXAirspeed(): Knots | null;
        function getFMCGreenDotSpeed(): number | null;
        function getFMCApprGreenDotSpeed(): number | null;
        function getGreenDotSpeed(): Knots | null;
        function getCrossoverSpeedFactor(cas: Knots, mach: Mach): number | null;
        function getFlapsLimitSpeed(aircraft: Aircraft, flapIndex: number): Knots | null;
        /**
         * @summary
         * Seems to implement caching behaviour, can be overridden with forceSimVarCall.
         */
        function getFlapsHandleIndex(forceSimVarCall?: boolean): number | null;
        /**
         * @summary
         * Seems to implement caching behaviour, can be overridden with forceSimVarCall.
         */
        function getFlapsExtendSpeed(aircraft: Aircraft, forceSimVarCall?: boolean): Knots | null;
        /**
         * @summary
         * Seems to implement caching behaviour, can be overridden with forceSimVarCall.
         */
        function getNextFlapsExtendSpeed(aircraft: Aircraft, forceSimVarCall?: boolean): Knots | null;
        function getMaxSpeed(aircraft: Aircraft): Knots;
        function getLowestSelectableSpeed(): Knots | null;
        function getStallProtectionMinSpeed(): Knots | null;
        function getStallProtectionMaxSpeed(): Knots | null;
        function getStallSpeed(): Knots | null;
        function getStallSpeedPredicted(flapIndex: number): Knots | null;
        function getWindDirection(): Degrees | null;
        function getWindStrength(): Knots | null;
        /**
         * Checks autopilot master status.
         * @param apIndex Defaults to 0 if undefined.
         */
        function getAutoPilotActive(apIndex?: number): boolean;
        function getAutoPilotAirspeedManaged(): boolean;
        function getAutoPilotAirspeedSelected(): boolean;
        function getAutoPilotAirspeedHoldActive(isManaged?: boolean): boolean | null;
        function getAutoPilotAirspeedHoldValue(): Knots | null;
        function getAutoPilotSelectedAirspeedHoldValue(): Knots | null;
        function getAutoPilotManagedAirspeedHoldValue(): Knots | null;
        function getAutoPilotMachModeActive(): boolean | null;
        function getAutoPilotMachHoldValue(): number | null;
        function getAutoPilotSelectedMachHoldValue(): number | null;
        function getAutoPilotManagedMachHoldValue(): number | null;
        function getAutoPilotHeadingManaged(): boolean;
        function getAutoPilotHeadingSelected(): boolean;
        function getAutoPilotHeadingLockActive(): boolean | null;
        function getAutoPilotHeadingLockValue(radians?: boolean): Radians | Degrees | null;
        function getAutoPilotSelectedHeadingLockValue(radians?: boolean): Radians | Degrees | null;
        function getAutoPilotAltitudeManaged(): boolean;
        function getAutoPilotAltitudeSelected(): boolean;
        function getAutoPilotAltitudeArmed(): boolean | null;
        function getAutoPilotAltitudeLockActive(): boolean | null;
        function getAutoPilotFLCActive(): boolean;
        /**
         * @param units Default = feet.
         */
        function getAutoPilotAltitudeLockValue(units?: string): number | null;
        /**
         * @param units Default = feet.
         */
        function getAutoPilotSelectedAltitudeLockValue(units? : string): number | null;
        /**
         * @param units Default = feet.
         */
        function getAutoPilotDisplayedAltitudeLockValue(units?: string): number;
        function getAutoPilotAltitudeLockUnits(): 'feet';
        function getAutoPilotVerticalSpeedHoldActive(): boolean | null;
        function getAutoPilotVerticalSpeedHoldValue(): FeetPerMinute | null;
        function getAutoPilotSelectedVerticalSpeedHoldValue(): FeetPerMinute | null;
        function getAutoPilotDisplayedVerticalSpeedHoldValue(): FeetPerMinute | null;
        function getAutoPilotLateralModeActive(): boolean | null;
        function getAutoPilotFlightDirectorActive(fdIndex: number): boolean | null;
        function getAutoPilotFlightDirectorBankValue(): Degrees | null;
        function getAutoPilotFlightDirectorPitchValue(): Degrees | null;
        function getAutopilotGPSDriven(): boolean | null;
        function getAutopilotGPSActive(): boolean | null;
        function getAutoPilotTrackAngle(): Degrees | null;
        function getAutoPilotFlightPathAngle(): Degrees | null;
        function getAutoPilotThrottleArmed(index?: number): boolean | null;
        function getAutoPilotThrottleLocked(): boolean | null;
        function getAutoPilotThrottleActive(index?: number): boolean | null;
        function getAutoPilotTOGAActive(): boolean | null;
        function getAutoPilotAPPRCaptured(): boolean | null;
        function getAutoPilotAPPRActive(): boolean;
        function getAutoPilotAPPRArm(): boolean;
        function getAutoPilotAPPRHold(): boolean | null;
        function getAutoPilotTRKFPAModeActive(): boolean | null;
        function getAutoPilotTRKModeActive(): boolean | null;
        function getAutoPilotFPAModeActive(): boolean | null;
        function getAutoPilotGlideslopeActive(): boolean | null;
        function getAutoPilotGlideslopeArm(): boolean | null;
        function getAutoPilotGlideslopeHold(): boolean | null;
        function getAutoPilotApproachType(): ApproachType | null;
        function getAutoPilotApproachLoaded(): boolean | null;
        function getAutoPilotNavAidState(aircraft: Aircraft, user: number, _switch: any): number | null;
        function getAutoPilotIsHeadingAligned(): boolean | null;
        function getNextWaypointName(): string | null;
        function getNextWaypointTrack(): Degrees | null;
        function getNextWaypointDistance(): NauticalMiles | null;
        function getNextWaypointETA(): Seconds | null;
        function getFlightTime(): Seconds | null;
        function getCurrentUTC(): Seconds | null;
        function getEngineCount(): number | null;
        function getEngineActive(engineIndex: number): boolean | null;
        function getEngineThrottle(engineIndex: number): Percent | null;
        function getEngineThrottleMode(engineIndex: number): ThrottleMode | null;
        function getEngineCommandedN1(engineIndex: number): Percent | null;
        function getEngineThrottleCommandedN1(engineIndex: number): Percent | null;
        function getEngineThrottleMaxThrust(engineIndex: number): number;
        function getEngineThrustTakeOffMode(engineIndex: number): number | null;
        function getEngineThrustClimbMode(engineIndex: number): number | null;
        /**
         * Equal to getEngineThrottle
         */
        function getAutopilotThrottle(engineIndex: number): Percent | null;
        /**
         * Equal to getEngineCommandedN1
         */
        function getAutopilotCommandedN1(engineIndex: number): Percent | null;
        function getEngineActive(engineIndex: number): true;
        function getEngineType(): EngineType | null;
        function getEngineRPM(engineIndex: number): RotationsPerMinute | null;
        function getEnginePower(engineIndex: number): Percent | null;
        function getMinCruiseRPM(): RotationsPerMinute | null;
        function getMaxCruiseRPM(): RotationsPerMinute | null;
        function getMaxIndicatedRPM(): RotationsPerMinute | null;
        function getMaxRatedRPM(): RotationsPerMinute | null;
        function getPropellerType(): PropellerType | null;
        function getNbPropellers(): number | null;
        function getInclinometer(): Position | null;
        function getAngleOfAttack(): Angl16 | null;
        function getOrientationAxis(): XYZ | null;
        function getAltitude(): number;
        function getGroundReference(): Feet | null;
        function getTurnRate(): RadiansPerSecond | null;
        function getHeadingMagnetic(): Heading | null;
        function getPitch(): Degrees | null;
        function getBank(): Degrees | null;
        function getFlightDirectorPitch(): Degrees | null;
        function getFlightDirectorBank(): Degrees | null;
        function getIsGrounded(): boolean;
        function getAltitudeAboveGround(forceSimVarCall?: boolean): Feet;
        function getCrossoverAltitude(cas: Knots, mach: Mach): Feet | null;
        function getThrustReductionAltitude(): Feet | null;
        function getFlapsNbHandles(): number | null;
        function getFlapsHandlePercent(): PercentOver100 | null;
        function getFlapsHandleAngle(flapIndex: number): Degrees | null;
        function getFlapsAngle(): Radians | null;
        function getTrim(): PercentOver100 | null;
        function getTrimIndicator(): number | null;
        function getTrimNeutral(): PercentOver100 | null;
        function setTransponderToRegion(): void;
        function setTransponderToZero(): void;
        function getTotalAirTemperature(): Celsius | null;
        function getAmbientTemperature(): Celsius | null;
        function getFlexTemperature(): number | null;
        function getFuelPercent(): Percent;
        function getFuelQuantity(): Gallons;
        function getTotalFuel(): Kilograms | null;
        function getFuelUsed(engineIndex: number): Kilograms | null;
        function getCompassAngle(): Radians | null;
        function getPressureValue(): number;
        function getPressureValue(units?: 'inches of mercury' | 'millibar'): number;
        function getPressureSelectedUnits(): 'inches of mercury' | 'millibar';
        function getPressureSelectedMode(aircraft: Aircraft): 'QFE' | 'QNH' | 'STD' | '';
        function getHasGlassCockpit(): boolean | null;
        function getPressurisationCabinAltitude(): Feet | null;
        function getPressurisationCabinAltitudeGoal(): Feet | null;
        function getPressurisationCabinAltitudeRate(): Feet | null;
        function getPressurisationDifferential(): PressurePerSquareInch | null;
        function getWeight(): Kilograms | null;
        function getMaxWeight(): Kilograms | null;
        function getGearPosition(): Percent | null;
        function getUnitIsMetric(): boolean | null;
        function getWorldRegion(): WorldRegion;
    }
}

export {};
